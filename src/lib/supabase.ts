import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The project's Supabase database, used for anonymous feedback. Learners never sign in; only the
 * maintainer does, on /admin, to read feedback. Both values are public by design: the publishable
 * key can only do what the database's row-level security allows (adding feedback, and reading it
 * only for accounts listed in public.admins). They come from VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example); without them, feedback forms stay switched off.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        // Keeps the maintainer signed in on /admin. Learners never sign in, so nothing is stored for them.
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;
