-- Software Engineering Foundations: database setup
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again.
--
-- Learners have no accounts. Visitors can ADD anonymous feedback but can never READ it. Only the
-- maintainer accounts listed in public.admins can read or delete it, on the site's /admin page
-- (see the last section of this file). The Supabase dashboard can always read everything.

-- "Was this lesson helpful?" ratings at the end of each lesson
CREATE TABLE IF NOT EXISTS public.lesson_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_slug TEXT NOT NULL CHECK (char_length(lesson_slug) BETWEEN 1 AND 120),
  helpful BOOLEAN NOT NULL,
  comment TEXT NOT NULL DEFAULT '' CHECK (char_length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The feedback form on /contribute
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

ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_feedback ENABLE ROW LEVEL SECURITY;

-- Visitors may only insert. No SELECT, UPDATE or DELETE for the public key.
REVOKE ALL ON public.lesson_feedback, public.community_feedback FROM anon, authenticated;
GRANT INSERT ON public.lesson_feedback, public.community_feedback TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can rate a lesson" ON public.lesson_feedback;
CREATE POLICY "Anyone can rate a lesson"
ON public.lesson_feedback FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can send community feedback" ON public.community_feedback;
CREATE POLICY "Anyone can send community feedback"
ON public.community_feedback FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS lesson_feedback_slug_created_idx
ON public.lesson_feedback (lesson_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS community_feedback_created_idx
ON public.community_feedback (created_at DESC);

-- ---------------------------------------------------------------------------------------------
-- Maintainer access for the /admin page
--
-- Only accounts listed in public.admins can read or delete feedback. To make yourself an admin:
--   1. Authentication → Users → Add user → Create new user (your email + a strong password,
--      tick "Auto Confirm User").
--   2. Authentication → Sign In / Providers → turn OFF "Allow new users to sign up".
--   3. Run this once in the SQL Editor, with your email (capital letters don't matter):
--        INSERT INTO public.admins (user_id)
--        SELECT id FROM auth.users WHERE lower(email) = lower('you@example.com')
--        ON CONFLICT DO NOTHING;
--      Check it worked (is_admin should be true for your account):
--        SELECT u.email, (a.user_id IS NOT NULL) AS is_admin
--        FROM auth.users u LEFT JOIN public.admins a ON a.user_id = u.id;
-- Your email stays in your database; it is never written into the public repository.
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- Nobody reads or edits this table through the API; is_admin() checks it on their behalf.
REVOKE ALL ON public.admins FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;

-- Signed-in accounts may read and delete feedback, but the policies below only let admins do so.
GRANT SELECT, DELETE ON public.lesson_feedback, public.community_feedback TO authenticated;

DROP POLICY IF EXISTS "Admins can read lesson feedback" ON public.lesson_feedback;
CREATE POLICY "Admins can read lesson feedback"
ON public.lesson_feedback FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete lesson feedback" ON public.lesson_feedback;
CREATE POLICY "Admins can delete lesson feedback"
ON public.lesson_feedback FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read community feedback" ON public.community_feedback;
CREATE POLICY "Admins can read community feedback"
ON public.community_feedback FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete community feedback" ON public.community_feedback;
CREATE POLICY "Admins can delete community feedback"
ON public.community_feedback FOR DELETE TO authenticated
USING (public.is_admin());
