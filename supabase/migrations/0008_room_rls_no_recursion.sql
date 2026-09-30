-- Avoid recursive RLS evaluation across rooms, room_participants, and
-- room_events. These helpers run as their owner, so their internal lookups do
-- not re-enter the caller's row policies.
CREATE OR REPLACE FUNCTION public.is_room_participant(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_participants rp
    WHERE rp.room_id = p_room_id
      AND rp.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_host(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rooms r
    WHERE r.id = p_room_id
      AND r.host_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_room_participant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_room_host(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_room_participant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_room_host(UUID) TO authenticated;

DROP POLICY IF EXISTS "participants can see their own room" ON public.rooms;
DROP POLICY IF EXISTS "Anyone authenticated can SELECT rooms in lobby phase" ON public.rooms;
DROP POLICY IF EXISTS "Hosts can read their own hosted rooms" ON public.rooms;

CREATE POLICY "Room members and hosts can read rooms"
  ON public.rooms FOR SELECT
  USING (
    phase = 'lobby'
    OR host_id = auth.uid()
    OR public.is_room_participant(id)
  );

DROP POLICY IF EXISTS "participants can see their room's roster" ON public.room_participants;
DROP POLICY IF EXISTS "Hosts can see their room's roster" ON public.room_participants;

CREATE POLICY "Room members and hosts can read participant rosters"
  ON public.room_participants FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_room_participant(room_id)
    OR public.is_room_host(room_id)
  );

DROP POLICY IF EXISTS "participants can read their room's event feed" ON public.room_events;

CREATE POLICY "Room members and hosts can read room events"
  ON public.room_events FOR SELECT
  USING (
    public.is_room_participant(room_id)
    OR public.is_room_host(room_id)
  );
