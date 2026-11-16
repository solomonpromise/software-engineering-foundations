import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The project's Supabase database, used only for anonymous feedback (no accounts, no sign-in).
 * Both values are public by design: the publishable key can only do what the database's row-level
 * security allows, which is adding feedback, never reading it. They come from VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example); without them, feedback forms stay switched off.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
