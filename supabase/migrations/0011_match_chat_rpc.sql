-- Route hosted-match chat through narrowly scoped functions. This keeps the
-- client from depending on table grants/RLS subqueries for chat operations.
CREATE OR REPLACE FUNCTION public.get_match_messages(p_match_id UUID)
RETURNS SETOF public.messages
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = p_match_id
      AND (m.profile_id_a = auth.uid() OR m.profile_id_b = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You are not a member of this match';
  END IF;

  RETURN QUERY
    SELECT msg.* FROM public.messages msg
    WHERE msg.match_id = p_match_id
    ORDER BY msg.created_at ASC, msg.id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_match_message(p_match_id UUID, p_text TEXT)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_message public.messages;
  v_text TEXT := trim(p_text);
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'You must be signed in to send a message'; END IF;
  IF char_length(v_text) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Message must be 1 to 2000 characters'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = p_match_id
      AND (m.profile_id_a = v_user_id OR m.profile_id_b = v_user_id)
  ) THEN
    RAISE EXCEPTION 'You are not a member of this match';
  END IF;

  INSERT INTO public.messages (match_id, sender_id, text)
  VALUES (p_match_id, v_user_id, v_text)
  RETURNING * INTO v_message;
  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.get_match_messages(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_match_message(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_match_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_match_message(UUID, TEXT) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
