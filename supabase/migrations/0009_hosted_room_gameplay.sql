-- Complete the hosted room game loop and remove the client's dependency on
-- leave_hosted_room(UUID), which may be absent from an existing PostgREST cache.
GRANT DELETE ON public.room_participants TO authenticated;

DROP POLICY IF EXISTS "Participants can leave their own hosted room" ON public.room_participants;
CREATE POLICY "Participants can leave their own hosted room"
  ON public.room_participants FOR DELETE
  USING (profile_id = auth.uid() AND role = 'contestant');

CREATE OR REPLACE FUNCTION public.advance_hosted_room(p_room_id UUID, p_next_phase TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_room public.rooms;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND OR v_room.host_id <> auth.uid() THEN RAISE EXCEPTION 'only the host can advance this room'; END IF;
  IF NOT (
    (v_room.phase = 'lobby' AND p_next_phase = 'round1') OR
    (v_room.phase = 'round1' AND p_next_phase = 'round2_question') OR
    (v_room.phase = 'round2_question' AND p_next_phase = 'round2_decision') OR
    (v_room.phase = 'round2_decision' AND p_next_phase = 'reveal') OR
    (v_room.phase = 'reveal' AND p_next_phase = 'final')
  ) THEN RAISE EXCEPTION 'invalid phase transition'; END IF;
  IF v_room.phase = 'lobby' AND NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND role = 'contestant' AND status = 'active') THEN
    RAISE EXCEPTION 'at least one player must join first';
  END IF;
  IF v_room.phase = 'round1' AND EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = p_room_id AND rp.role = 'contestant' AND rp.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM public.room_events e WHERE e.room_id = p_room_id AND e.event_type = 'host_vote' AND e.payload->>'profile_id' = rp.profile_id::text AND (e.payload->>'round')::int = 1)
  ) THEN RAISE EXCEPTION 'finish first impression votes before continuing'; END IF;
  IF v_room.phase = 'round2_question' AND NOT EXISTS (SELECT 1 FROM public.room_events WHERE room_id = p_room_id AND event_type = 'personality_question') THEN
    RAISE EXCEPTION 'ask an icebreaker question before continuing';
  END IF;
  IF v_room.phase = 'round2_question' AND EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = p_room_id AND rp.role = 'contestant' AND rp.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM public.room_events e WHERE e.room_id = p_room_id AND e.event_type = 'personality_answer' AND e.payload->>'profile_id' = rp.profile_id::text)
  ) THEN RAISE EXCEPTION 'wait for every active player to answer'; END IF;
  IF v_room.phase = 'round2_decision' AND EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = p_room_id AND rp.role = 'contestant' AND rp.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM public.room_events e WHERE e.room_id = p_room_id AND e.event_type = 'host_vote' AND e.payload->>'profile_id' = rp.profile_id::text AND (e.payload->>'round')::int = 2)
  ) THEN RAISE EXCEPTION 'finish second impression votes before continuing'; END IF;
  UPDATE public.rooms SET phase = p_next_phase WHERE id = p_room_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.advance_hosted_room(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_hosted_room(p_room_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rooms SET phase = 'closed', closed_at = now()
  WHERE id = p_room_id AND host_id = auth.uid() AND phase <> 'closed';
  IF NOT FOUND THEN RAISE EXCEPTION 'room not found, already closed, or you are not the host'; END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.close_hosted_room(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_hosted_room_question(p_room_id UUID, p_question TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND host_id = auth.uid() AND phase = 'round2_question') THEN
    RAISE EXCEPTION 'only the host can ask a question during the icebreaker round';
  END IF;
  IF length(trim(p_question)) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'question must be 1 to 300 characters'; END IF;
  DELETE FROM public.room_events WHERE room_id = p_room_id AND event_type = 'personality_question';
  DELETE FROM public.room_events WHERE room_id = p_room_id AND event_type = 'personality_answer';
  INSERT INTO public.room_events (room_id, event_type, payload)
  VALUES (p_room_id, 'personality_question', jsonb_build_object('question', trim(p_question)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_hosted_room_question(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_hosted_room_answer(p_room_id UUID, p_answer TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND phase = 'round2_question') THEN RAISE EXCEPTION 'the icebreaker round is not open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND profile_id = auth.uid() AND role = 'contestant' AND status = 'active') THEN RAISE EXCEPTION 'you are not an active player in this room'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.room_events WHERE room_id = p_room_id AND event_type = 'personality_question') THEN RAISE EXCEPTION 'the host has not asked a question yet'; END IF;
  IF length(trim(p_answer)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'answer must be 1 to 500 characters'; END IF;
  DELETE FROM public.room_events WHERE room_id = p_room_id AND event_type = 'personality_answer' AND payload->>'profile_id' = auth.uid()::text;
  INSERT INTO public.room_events (room_id, event_type, payload)
  VALUES (p_room_id, 'personality_answer', jsonb_build_object('profile_id', auth.uid(), 'answer', trim(p_answer)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_hosted_room_answer(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_hosted_room_vote(p_room_id UUID, p_participant_id UUID, p_round INTEGER, p_decision TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_phase TEXT;
BEGIN
  SELECT phase INTO v_phase FROM public.rooms WHERE id = p_room_id AND host_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'only the host can vote'; END IF;
  IF NOT ((p_round = 1 AND v_phase = 'round1') OR (p_round = 2 AND v_phase = 'round2_decision')) THEN RAISE EXCEPTION 'voting is not open for this round'; END IF;
  IF p_decision NOT IN ('keep','pop') THEN RAISE EXCEPTION 'decision must be keep or pop'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND profile_id = p_participant_id AND role = 'contestant' AND status = 'active') THEN RAISE EXCEPTION 'player is not active'; END IF;
  IF EXISTS (SELECT 1 FROM public.room_events WHERE room_id = p_room_id AND event_type = 'host_vote' AND payload->>'profile_id' = p_participant_id::text AND (payload->>'round')::int = p_round) THEN RAISE EXCEPTION 'you already voted on this player'; END IF;
  IF p_decision = 'pop' THEN UPDATE public.room_participants SET status = 'eliminated' WHERE room_id = p_room_id AND profile_id = p_participant_id; END IF;
  INSERT INTO public.room_events (room_id, event_type, payload)
  VALUES (p_room_id, 'host_vote', jsonb_build_object('profile_id', p_participant_id, 'round', p_round, 'decision', p_decision));
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_hosted_room_vote(UUID, UUID, INTEGER, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.pick_match(p_room_id UUID, p_participant_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND host_id = auth.uid() AND phase = 'final') THEN RAISE EXCEPTION 'the host can only pick during the final round'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND profile_id = p_participant_id AND role = 'contestant' AND status = 'active') THEN RAISE EXCEPTION 'player is not active'; END IF;
  INSERT INTO public.matches (room_id, profile_id_a, profile_id_b) VALUES (p_room_id, auth.uid(), p_participant_id);
  UPDATE public.rooms SET phase = 'closed', closed_at = now() WHERE id = p_room_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.pick_match(UUID, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
