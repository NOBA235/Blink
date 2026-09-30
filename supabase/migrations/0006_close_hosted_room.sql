-- Let a host close a lobby they cancel so it is no longer returned by
-- get_open_rooms() and cannot accept new participants.
CREATE OR REPLACE FUNCTION public.close_hosted_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to close a room';
  END IF;

  UPDATE public.rooms
  SET phase = 'closed', closed_at = now()
  WHERE id = p_room_id AND host_id = auth.uid() AND phase = 'lobby';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'room not found, already closed, or you are not the host';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_hosted_room(UUID) TO authenticated;
