-- Software Engineering Foundations: engagement features
--
-- Run this AFTER schema.sql, once, in your Supabase project: SQL Editor → New query → paste → Run.
-- It is safe to run again. It adds:
--   1. Reader counts: how many people read the course and how far they read each lesson.
--      A reader is a random ID made in their browser — no name, no email.
--   2. Letters to the next reader: short notes readers leave for whoever reads a lesson next.
--      Nothing is public until a maintainer approves it on /admin.
--   3. Reading reminders: browser notifications for readers who asked for them.
--
-- Every table is closed to the public key. The site only reaches them through the functions
-- below, which check their input and return counts, never rows about individual readers.

-- ---------------------------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------------------------

-- A private random value. Mixed with the day and the visitor's network address it makes a
-- fingerprint that only works for one day and can't be reversed; it is used only to stop one
-- place from creating thousands of fake readers or reminder sign-ups.
CREATE TABLE IF NOT EXISTS public.engagement_salt (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  value TEXT NOT NULL DEFAULT (gen_random_uuid()::text || gen_random_uuid()::text)
);
INSERT INTO public.engagement_salt DEFAULT VALUES ON CONFLICT DO NOTHING;
ALTER TABLE public.engagement_salt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.engagement_salt FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_origin()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h JSON := nullif(current_setting('request.headers', true), '')::json;
  ip TEXT;
BEGIN
  ip := trim(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(h->>'x-forwarded-for', ',', 1), ''));
  IF ip = '' THEN RETURN NULL; END IF;
  RETURN encode(sha256(convert_to((SELECT value FROM engagement_salt) || current_date::text || ip, 'UTF8')), 'hex');
END $$;
REVOKE EXECUTE ON FUNCTION public.request_origin() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 1. Reader counts
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.readers (
  id UUID PRIMARY KEY,
  number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  current_lesson TEXT CHECK (current_lesson IS NULL OR current_lesson ~ '^[a-z0-9-]{1,120}$'),
  origin TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS readers_last_seen_idx ON public.readers (last_seen DESC);
CREATE INDEX IF NOT EXISTS readers_origin_idx ON public.readers (origin);

CREATE TABLE IF NOT EXISTS public.lesson_reach (
  reader_id UUID NOT NULL REFERENCES public.readers (id) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL CHECK (lesson_slug ~ '^[a-z0-9-]{1,120}$'),
  depth SMALLINT NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 100),
  finished_at TIMESTAMPTZ,
  PRIMARY KEY (reader_id, lesson_slug)
);
CREATE INDEX IF NOT EXISTS lesson_reach_lesson_idx ON public.lesson_reach (lesson_slug, finished_at);

ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_reach ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.readers, public.lesson_reach FROM anon, authenticated;

-- Records that a reader is on a lesson and how far down it they have read (0–100).
-- Returns the reader's number ("Reader #128") and the month they started.
CREATE OR REPLACE FUNCTION public.reader_pulse(p_reader UUID, p_lesson TEXT DEFAULT NULL, p_depth INT DEFAULT 0)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_number BIGINT;
  v_first TIMESTAMPTZ;
  v_origin TEXT;
BEGIN
  IF p_reader IS NULL THEN RETURN NULL; END IF;
  IF p_lesson IS NOT NULL AND p_lesson !~ '^[a-z0-9-]{1,120}$' THEN RETURN NULL; END IF;

  SELECT number, first_seen INTO v_number, v_first FROM readers WHERE id = p_reader;
  IF v_number IS NULL THEN
    v_origin := request_origin();
    -- At most 20 new readers a day from one network (enough for a classroom).
    IF v_origin IS NOT NULL AND (SELECT count(*) FROM readers WHERE origin = v_origin) >= 20 THEN
      RETURN NULL;
    END IF;
    INSERT INTO readers (id, current_lesson, origin) VALUES (p_reader, p_lesson, v_origin)
    ON CONFLICT (id) DO NOTHING;
    SELECT number, first_seen INTO v_number, v_first FROM readers WHERE id = p_reader;
  ELSE
    UPDATE readers SET last_seen = now(), current_lesson = coalesce(p_lesson, current_lesson)
    WHERE id = p_reader;
  END IF;

  IF p_lesson IS NOT NULL AND (
    EXISTS (SELECT 1 FROM lesson_reach WHERE reader_id = p_reader AND lesson_slug = p_lesson)
    OR (SELECT count(*) FROM lesson_reach WHERE reader_id = p_reader) < 60
  ) THEN
    INSERT INTO lesson_reach (reader_id, lesson_slug, depth)
    VALUES (p_reader, p_lesson, least(100, greatest(0, coalesce(p_depth, 0))))
    ON CONFLICT (reader_id, lesson_slug) DO UPDATE SET depth = greatest(lesson_reach.depth, excluded.depth);
  END IF;

  RETURN json_build_object('number', v_number, 'season', to_char(v_first, 'YYYY-MM'));
END $$;

-- Marks a lesson finished and returns the reader's place: "the 418th reader to finish this lesson".
CREATE OR REPLACE FUNCTION public.reader_finish(p_reader UUID, p_lesson TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_at TIMESTAMPTZ;
BEGIN
  PERFORM reader_pulse(p_reader, p_lesson, 100);
  UPDATE lesson_reach SET finished_at = coalesce(finished_at, now()), depth = 100
  WHERE reader_id = p_reader AND lesson_slug = p_lesson
  RETURNING finished_at INTO v_at;
  IF v_at IS NULL THEN RETURN NULL; END IF;
  RETURN (SELECT count(*) FROM lesson_reach WHERE lesson_slug = p_lesson AND finished_at <= v_at);
END $$;

-- "Stop counting me": removes the reader and everything recorded about them.
CREATE OR REPLACE FUNCTION public.reader_forget(p_reader UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM readers WHERE id = p_reader;
$$;

-- Reader totals for the home page and /admin. Counts only.
CREATE OR REPLACE FUNCTION public.reader_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'readers', (SELECT count(*) FROM readers),
    'reading_now', (SELECT count(*) FROM readers WHERE last_seen > now() - interval '10 minutes'),
    -- slug → [readers who opened it, readers who finished it]
    'reach', coalesce((
      SELECT json_object_agg(lesson_slug, json_build_array(opened, finished))
      FROM (
        SELECT lesson_slug, count(*) AS opened, count(finished_at) AS finished
        FROM lesson_reach GROUP BY lesson_slug
      ) r
    ), '{}'::json),
    -- Read-along seasons: readers who started each month (last six months), and how many are still reading.
    'seasons', coalesce((
      SELECT json_agg(json_build_object('season', season, 'readers', n, 'active', active) ORDER BY season)
      FROM (
        SELECT to_char(first_seen, 'YYYY-MM') AS season, count(*) AS n,
               count(*) FILTER (WHERE last_seen > now() - interval '14 days') AS active
        FROM readers
        WHERE first_seen >= date_trunc('month', now()) - interval '5 months'
        GROUP BY 1
      ) s
    ), '[]'::json)
  );
$$;

-- How far readers get through one lesson: the share reaching 10%, 20% … 100% of the page.
CREATE OR REPLACE FUNCTION public.lesson_river(p_lesson TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'opened', count(*),
    'finished', count(finished_at),
    'reached', json_build_array(
      count(*) FILTER (WHERE depth >= 10), count(*) FILTER (WHERE depth >= 20),
      count(*) FILTER (WHERE depth >= 30), count(*) FILTER (WHERE depth >= 40),
      count(*) FILTER (WHERE depth >= 50), count(*) FILTER (WHERE depth >= 60),
      count(*) FILTER (WHERE depth >= 70), count(*) FILTER (WHERE depth >= 80),
      count(*) FILTER (WHERE depth >= 90), count(*) FILTER (WHERE depth >= 100)
    )
  )
  FROM lesson_reach WHERE lesson_slug = p_lesson;
$$;

GRANT EXECUTE ON FUNCTION
  public.reader_pulse(UUID, TEXT, INT), public.reader_finish(UUID, TEXT), public.reader_forget(UUID),
  public.reader_stats(), public.lesson_river(TEXT)
TO anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 2. Letters to the next reader
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reader_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The lesson the letter is about, or 'course' for a letter to someone just starting.
  lesson_slug TEXT NOT NULL CHECK (lesson_slug ~ '^[a-z0-9-]{1,120}$'),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 600),
  name TEXT CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 60),
  place TEXT CHECK (place IS NULL OR char_length(place) BETWEEN 1 AND 60),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reader_letters_approved_idx ON public.reader_letters (approved, approved_at DESC);

ALTER TABLE public.reader_letters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reader_letters FROM anon, authenticated;
GRANT INSERT ON public.reader_letters TO anon, authenticated;

-- Anyone may write a letter, but it always arrives unapproved.
DROP POLICY IF EXISTS "Anyone can write a letter" ON public.reader_letters;
CREATE POLICY "Anyone can write a letter"
ON public.reader_letters FOR INSERT TO anon, authenticated
WITH CHECK (approved = false AND approved_at IS NULL);

-- Maintainers read, approve, hide and delete letters on /admin.
GRANT SELECT, DELETE ON public.reader_letters TO authenticated;
GRANT UPDATE (approved, approved_at) ON public.reader_letters TO authenticated;

DROP POLICY IF EXISTS "Admins can read letters" ON public.reader_letters;
CREATE POLICY "Admins can read letters"
ON public.reader_letters FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can approve letters" ON public.reader_letters;
CREATE POLICY "Admins can approve letters"
ON public.reader_letters FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete letters" ON public.reader_letters;
CREATE POLICY "Admins can delete letters"
ON public.reader_letters FOR DELETE TO authenticated
USING (public.is_admin());

-- The only public way to read letters: approved ones, without any other columns.
CREATE OR REPLACE FUNCTION public.approved_letters()
RETURNS TABLE (id UUID, lesson_slug TEXT, message TEXT, name TEXT, place TEXT, approved_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, lesson_slug, message, name, place, approved_at
  FROM reader_letters WHERE approved
  ORDER BY approved_at DESC LIMIT 400;
$$;
GRANT EXECUTE ON FUNCTION public.approved_letters() TO anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- 3. Reading reminders (browser notifications)
--
-- A reminder subscription is identified by its push "endpoint", a long secret address that only
-- the reader's own browser knows. Stored with it: the reader's optional goal, preferred hour and
-- time zone, and the lesson they're on, so the reminder can mention it. No name or email.
-- ---------------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reading_reminders (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL CHECK (char_length(p256dh) <= 200),
  auth TEXT NOT NULL CHECK (char_length(auth) <= 100),
  goal TEXT CHECK (goal IS NULL OR char_length(goal) <= 80),
  remind_hour SMALLINT NOT NULL DEFAULT 19 CHECK (remind_hour BETWEEN 0 AND 23),
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  last_lesson_title TEXT CHECK (last_lesson_title IS NULL OR char_length(last_lesson_title) <= 200),
  next_lesson_slug TEXT CHECK (next_lesson_slug IS NULL OR next_lesson_slug ~ '^[a-z0-9-]{1,120}$'),
  next_lesson_title TEXT CHECK (next_lesson_title IS NULL OR char_length(next_lesson_title) <= 200),
  next_lesson_number SMALLINT,
  next_lesson_summary TEXT CHECK (next_lesson_summary IS NULL OR char_length(next_lesson_summary) <= 400),
  lessons_done SMALLINT NOT NULL DEFAULT 0,
  lessons_total SMALLINT NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminders_sent SMALLINT NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  welcomed BOOLEAN NOT NULL DEFAULT false,
  origin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reading_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reading_reminders FROM anon, authenticated;

-- Only real browser push services, so the reminder sender can't be pointed at other websites.
CREATE OR REPLACE FUNCTION public.is_push_endpoint(p TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT char_length(p) <= 1000 AND p ~ '^https://(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/';
$$;

CREATE OR REPLACE FUNCTION public.reminder_subscribe(
  p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT, p_goal TEXT, p_hour INT, p_time_zone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_origin TEXT;
  v_zone TEXT := coalesce(p_time_zone, 'UTC');
BEGIN
  IF NOT is_push_endpoint(p_endpoint) THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_zone) THEN v_zone := 'UTC'; END IF;
  IF NOT EXISTS (SELECT 1 FROM reading_reminders WHERE endpoint = p_endpoint) THEN
    v_origin := request_origin();
    IF v_origin IS NOT NULL AND (SELECT count(*) FROM reading_reminders WHERE origin = v_origin) >= 20 THEN
      RETURN false;
    END IF;
  END IF;
  INSERT INTO reading_reminders (endpoint, p256dh, auth, goal, remind_hour, time_zone, origin)
  VALUES (p_endpoint, p_p256dh, p_auth, nullif(left(trim(p_goal), 80), ''),
          least(23, greatest(0, coalesce(p_hour, 19))), v_zone, v_origin)
  ON CONFLICT (endpoint) DO UPDATE SET
    p256dh = excluded.p256dh, auth = excluded.auth, goal = excluded.goal,
    remind_hour = excluded.remind_hour, time_zone = excluded.time_zone,
    last_read_at = now(), reminders_sent = 0;
  RETURN true;
END $$;

-- Called whenever the reader reads: resets the clock and remembers where they are.
CREATE OR REPLACE FUNCTION public.reminder_touch(
  p_endpoint TEXT, p_last_title TEXT, p_next_slug TEXT, p_next_title TEXT, p_next_number INT,
  p_next_summary TEXT, p_done INT, p_total INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reading_reminders SET
    last_read_at = now(),
    reminders_sent = 0,
    last_lesson_title = left(p_last_title, 200),
    next_lesson_slug = CASE WHEN p_next_slug ~ '^[a-z0-9-]{1,120}$' THEN p_next_slug END,
    next_lesson_title = left(p_next_title, 200),
    next_lesson_number = p_next_number,
    next_lesson_summary = left(p_next_summary, 400),
    lessons_done = greatest(0, least(999, coalesce(p_done, 0))),
    lessons_total = greatest(0, least(999, coalesce(p_total, 0)))
  WHERE endpoint = p_endpoint;
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.reminder_unsubscribe(p_endpoint TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM reading_reminders WHERE endpoint = p_endpoint;
$$;

GRANT EXECUTE ON FUNCTION
  public.reminder_subscribe(TEXT, TEXT, TEXT, TEXT, INT, TEXT),
  public.reminder_touch(TEXT, TEXT, TEXT, TEXT, INT, TEXT, INT, INT),
  public.reminder_unsubscribe(TEXT)
TO anon, authenticated;

-- For the "reminders" Edge Function only (it uses the service-role key): who is due a reminder
-- right now. A reader is reminded at their chosen hour after 1, 4 and 11 days away — then never
-- again until they read.
CREATE OR REPLACE FUNCTION public.reminders_due()
RETURNS SETOF public.reading_reminders
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT * FROM reading_reminders
  WHERE reminders_sent < 3
    AND extract(hour FROM now() AT TIME ZONE time_zone) = remind_hour
    AND (last_reminded_at IS NULL OR last_reminded_at < now() - interval '20 hours')
    AND last_read_at < now() - CASE reminders_sent
      WHEN 0 THEN interval '1 day' WHEN 1 THEN interval '4 days' ELSE interval '11 days' END
  LIMIT 500;
$$;
REVOKE EXECUTE ON FUNCTION public.reminders_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reminders_due() TO service_role;

-- Maintainers can see how many readers use reminders (a count, nothing else), on /admin.
CREATE OR REPLACE FUNCTION public.reminder_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE WHEN is_admin() THEN (SELECT count(*) FROM reading_reminders) END;
$$;
GRANT EXECUTE ON FUNCTION public.reminder_count() TO authenticated;
