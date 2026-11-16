import type { PostgrestError } from "@supabase/supabase-js";
import { supabase as db } from "@/lib/supabase";
import { feedbackSchema, fieldErrors, type FeedbackResult } from "./feedback";

const TABLE = "community_feedback";

// The community_feedback table is created by docs/database/schema.sql. Row-level security lets
// visitors add messages but never read them; the table's CHECK constraints repeat the limits
// validated here. Messages are read in the Supabase dashboard.

/** True when the table has not been created yet. */
export const tableMissing = (e: PostgrestError | null) =>
  !!e &&
  (e.code === "PGRST205" || e.code === "42P01" || /does not exist|schema cache/i.test(e.message));

/** Whether messages can be saved, so the page never shows a form that can't submit. */
export async function feedbackReady(): Promise<boolean> {
  if (!db) return false;
  // A normal read, not a HEAD request: HEAD responses hide the "table missing" error.
  const { error } = await db.from(TABLE).select("id").limit(1);
  return !tableMissing(error);
}

export async function sendFeedback(input: unknown): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };
  }
  const { website, ...row } = parsed.data;
  // Honeypot filled in: a bot. Pretend it worked and store nothing.
  if (website) return { ok: true };
  if (!db) return { ok: false, unavailable: true, error: "Feedback can't be saved right now." };
  const { error } = await db.from(TABLE).insert(row);
  if (!error) return { ok: true };
  if (tableMissing(error))
    return { ok: false, unavailable: true, error: "Feedback can't be saved right now." };
  return { ok: false, error: "Your message couldn't be saved. Please try again in a moment." };
}
