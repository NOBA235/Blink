-- Make match membership checks safe and consistent for message reads/writes.
-- The SECURITY DEFINER helper avoids evaluating messages -> matches policies
-- as nested client queries, while still limiting each match to its two users.
CREATE OR REPLACE FUNCTION public.is_match_member(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = p_match_id
      AND (m.profile_id_a = auth.uid() OR m.profile_id_b = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_match_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_match_member(UUID) TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

DROP POLICY IF EXISTS "matched users can read their messages" ON public.messages;
DROP POLICY IF EXISTS "matched users can send messages" ON public.messages;

CREATE POLICY "matched users can read their messages"
  ON public.messages FOR SELECT
  USING (public.is_match_member(match_id));

CREATE POLICY "matched users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND public.is_match_member(match_id));

NOTIFY pgrst, 'reload schema';
