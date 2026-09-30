-- Make joining idempotent, ensure legacy auth users have a profile, and allow
-- a participant to leave their hosted-room lobby through a guarded RPC.
CREATE POLICY "Hosts can read their own hosted rooms"
  ON public.rooms FOR SELECT
  USING (host_id = auth.uid());

CREATE OR REPLACE FUNCTION public.join_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join a room';
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'room not found'; END IF;
  IF v_room.host_id = auth.uid() THEN RAISE EXCEPTION 'You are already hosting this room'; END IF;
  IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'This room has already started'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = p_room_id AND profile_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  INSERT INTO public.profiles (id) VALUES (auth.uid()) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.profile_reveal (profile_id) VALUES (auth.uid()) ON CONFLICT (profile_id) DO NOTHING;

  SELECT COUNT(*) INTO v_count
  FROM public.room_participants
  WHERE room_id = p_room_id AND role = 'contestant';
  IF v_count >= COALESCE(v_room.max_participants, 4) THEN
    RAISE EXCEPTION 'room is full';
  END IF;

  INSERT INTO public.room_participants (room_id, profile_id, role)
  VALUES (p_room_id, auth.uid(), 'contestant');
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_room(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_hosted_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to leave a room';
  END IF;

  DELETE FROM public.room_participants rp
  USING public.rooms r
  WHERE rp.room_id = p_room_id
    AND rp.profile_id = auth.uid()
    AND rp.role = 'contestant'
    AND r.id = rp.room_id
    AND r.phase <> 'closed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You are not an active participant in this room';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.leave_hosted_room(UUID) TO authenticated;
