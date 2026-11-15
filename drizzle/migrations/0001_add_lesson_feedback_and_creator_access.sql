CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_slug TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.lesson_feedback TO anon, authenticated;
GRANT SELECT ON public.lesson_feedback TO authenticated;
GRANT ALL ON public.lesson_feedback TO service_role;
ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Learners can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read role assignments"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Visitors can leave lesson feedback"
ON public.lesson_feedback FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND char_length(lesson_slug) BETWEEN 1 AND 120
  AND char_length(comment) <= 1000
);

CREATE POLICY "Learners can leave lesson feedback"
ON public.lesson_feedback FOR INSERT TO authenticated
WITH CHECK (
  (user_id IS NULL OR auth.uid() = user_id)
  AND char_length(lesson_slug) BETWEEN 1 AND 120
  AND char_length(comment) <= 1000
);

CREATE POLICY "Only the course creator can read feedback"
ON public.lesson_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX lesson_feedback_slug_created_idx
ON public.lesson_feedback (lesson_slug, created_at DESC);