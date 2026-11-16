-- Software Engineering Foundations: database setup
--
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- It is safe to run again.
--
-- The site has no accounts. Visitors can ADD anonymous feedback but nobody can READ it through the
-- public key: there are deliberately no SELECT policies. You read feedback in the dashboard
-- (Table Editor), which uses admin access and bypasses these rules.

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
