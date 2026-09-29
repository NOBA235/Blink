-- Add columns to rooms table
ALTER TABLE public.rooms
  ADD COLUMN title TEXT,
  ADD COLUMN vibe TEXT,
  ADD COLUMN max_participants INTEGER DEFAULT 4,
  ADD COLUMN host_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.rooms ALTER COLUMN contestant_id DROP NOT NULL;

-- Update phase check constraint
ALTER TABLE public.rooms DROP CONSTRAINT rooms_phase_check;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_phase_check CHECK (phase in ('lobby', 'waiting_room','intro','countdown','round1','round1_results','round2','round2_question','round2_answer','round2_decision','round2_results','reveal','final','closed'));

-- Add status to room_participants
ALTER TABLE public.room_participants ADD COLUMN status text default 'active' check (status in ('active', 'eliminated'));

-- Create compatibility_scores table
CREATE TABLE IF NOT EXISTS public.compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  host_id UUID REFERENCES public.profiles(id),
  participant_id UUID REFERENCES public.profiles(id),
  overall_score FLOAT DEFAULT 0,
  interest_overlap JSONB DEFAULT '[]',
  food_alignment FLOAT DEFAULT 0,
  activity_alignment FLOAT DEFAULT 0,
  drink_alignment FLOAT DEFAULT 0,
  ai_insights TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, participant_id)
);

-- RLS for compatibility_scores
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compatibility_scores TO authenticated;

CREATE POLICY "Only the room's host can SELECT compatibility scores"
  ON public.compatibility_scores FOR SELECT
  USING (host_id = auth.uid());

-- Additional RLS for rooms and room_participants
CREATE POLICY "Anyone authenticated can SELECT rooms in lobby phase"
  ON public.rooms FOR SELECT
  USING (phase = 'lobby');

CREATE POLICY "Hosts can see their room's roster"
  ON public.room_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r WHERE r.id = room_participants.room_id AND r.host_id = auth.uid()
    )
  );

-- RPCs
CREATE OR REPLACE FUNCTION public.create_hosted_room(p_title TEXT, p_vibe TEXT, p_max_participants INTEGER)
RETURNS public.rooms
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to create a room';
  END IF;

  -- Keep room creation resilient if the auth signup trigger did not create
  -- this user's profile row (rooms.host_id references public.profiles).
  INSERT INTO public.profiles (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_reveal (profile_id)
  VALUES (auth.uid())
  ON CONFLICT (profile_id) DO NOTHING;

  INSERT INTO public.rooms (host_id, title, vibe, max_participants, phase)
  VALUES (auth.uid(), p_title, p_vibe, p_max_participants, 'lobby')
  RETURNING * INTO v_room;
  RETURN v_room;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_hosted_room(TEXT, TEXT, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
  v_count INT;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN RAISE EXCEPTION 'room not found'; END IF;
  IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'room not in lobby phase'; END IF;
  
  SELECT COUNT(*) INTO v_count FROM public.room_participants WHERE room_id = p_room_id AND role = 'contestant';
  IF v_count >= COALESCE(v_room.max_participants, 4) THEN
    RAISE EXCEPTION 'room is full';
  END IF;

  INSERT INTO public.room_participants (room_id, profile_id, role)
  VALUES (p_room_id, auth.uid(), 'contestant')
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_room(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.eliminate_participant(p_room_id UUID, p_participant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room.host_id <> auth.uid() THEN RAISE EXCEPTION 'only host can eliminate'; END IF;
  
  UPDATE public.room_participants SET status = 'eliminated' WHERE room_id = p_room_id AND profile_id = p_participant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.eliminate_participant(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.pick_match(p_room_id UUID, p_participant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = p_room_id AND host_id = auth.uid()) THEN
    RAISE EXCEPTION 'only host can pick a match';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = p_room_id AND profile_id = p_participant_id AND status = 'active') THEN
    RAISE EXCEPTION 'participant is not active';
  END IF;

  INSERT INTO public.matches (room_id, profile_id_a, profile_id_b)
  VALUES (p_room_id, auth.uid(), p_participant_id);

  UPDATE public.rooms SET phase = 'closed' WHERE id = p_room_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.pick_match(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.advance_hosted_room(p_room_id UUID, p_next_phase TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_room public.rooms;
BEGIN
  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
  IF v_room.host_id <> auth.uid() THEN RAISE EXCEPTION 'only host can advance room'; END IF;
  
  IF p_next_phase NOT IN ('round1', 'round2', 'reveal', 'final') THEN
    RAISE EXCEPTION 'invalid phase transition';
  END IF;

  UPDATE public.rooms SET phase = p_next_phase WHERE id = p_room_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.advance_hosted_room(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_open_rooms()
RETURNS TABLE (
  id uuid,
  title text,
  vibe text,
  max_participants int,
  host_id uuid,
  host_name text,
  host_age int,
  host_photo_url text,
  participant_count bigint
)
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    r.id,
    r.title,
    r.vibe,
    r.max_participants,
    r.host_id,
    p.name AS host_name,
    p.age AS host_age,
    p.photo_url AS host_photo_url,
    (SELECT COUNT(*) FROM public.room_participants rp WHERE rp.room_id = r.id) AS participant_count
  FROM public.rooms r
  JOIN public.profiles p ON p.id = r.host_id
  WHERE r.phase = 'lobby';
$$;
GRANT EXECUTE ON FUNCTION public.get_open_rooms() TO authenticated;
