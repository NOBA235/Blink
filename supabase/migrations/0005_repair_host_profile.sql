-- Existing users can lack a profiles row if the auth signup trigger failed
-- or was not installed when their account was created. Ensure the referenced
-- profile exists before creating a hosted room.
CREATE OR REPLACE FUNCTION public.create_hosted_room(
  p_title TEXT,
  p_vibe TEXT,
  p_max_participants INTEGER
)
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
