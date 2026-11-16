import { createClient, type PostgrestError } from "@supabase/supabase-js";
import { feedbackSchema, fieldErrors, type FeedbackResult, type FeedbackStatus } from "./feedback";

const TABLE = "community_feedback";

/**
 * Uses the public (publishable) key, so the database's row-level security decides what is allowed:
 * visitors may add a message but never read one back. No service-role key is needed.
 */
function client() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** True when the table has not been created yet (docs/database/community_feedback.sql). */
const tableMissing = (e: PostgrestError | null) =>
  !!e &&
  (e.code === "PGRST205" || e.code === "42P01" || /does not exist|schema cache/i.test(e.message));

const json = (body: FeedbackResult | FeedbackStatus, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** GET: lets the page show the form only when messages can really be saved. */
export async function feedbackStatus() {
  const db = client();
  if (!db) return json({ ready: false });
  // Visitors have no read access, so this returns no rows (or "permission denied") when the table exists.
  const { error } = await db.from(TABLE).select("id").limit(1); // Not a HEAD request: those hide "table missing" errors.
  return json({ ready: !tableMissing(error) });
}

export async function submitFeedback(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
      400,
    );
  }
  const { website, ...row } = parsed.data;
  // Quietly accept bot submissions without storing them.
  if (website) return json({ ok: true });

  const db = client();
  if (!db)
    return json({ ok: false, unavailable: true, error: "Feedback can't be saved right now." }, 503);
  const { error } = await db.from(TABLE).insert(row);
  if (error) {
    if (tableMissing(error))
      return json(
        { ok: false, unavailable: true, error: "Feedback can't be saved right now." },
        503,
      );
    console.error("[community-feedback] insert failed", error.code, error.message);
    return json(
      { ok: false, error: "Your message couldn't be saved. Please try again in a moment." },
      500,
    );
  }
  return json({ ok: true });
}
