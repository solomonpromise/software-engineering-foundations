-- Community feedback form (/contribute#feedback)
--
-- Run once in the project's Supabase database (SQL editor, or as a migration once the project
-- manages its own migrations). Until this table exists, the site hides the form and explains why.
--
-- Privacy: visitors can add a message but nobody can read messages except accounts with the
-- 'admin' role in public.user_roles (the founding maintainer). Name and email are optional.
-- Requires public.has_role(), created by the lesson-feedback migration.

CREATE TABLE IF NOT EXISTS public.community_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (
    category IN ('lesson-correction', 'topic-suggestion', 'resource', 'experience', 'general')
  ),
  name TEXT CHECK (name IS NULL OR char_length(name) <= 100),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 200),
  related TEXT CHECK (related IS NULL OR char_length(related) <= 160),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.community_feedback TO anon, authenticated;
GRANT SELECT, DELETE ON public.community_feedback TO authenticated;
GRANT ALL ON public.community_feedback TO service_role;
ALTER TABLE public.community_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send community feedback"
ON public.community_feedback FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Only admins can read community feedback"
ON public.community_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete community feedback"
ON public.community_feedback FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS community_feedback_created_idx
ON public.community_feedback (created_at DESC);
