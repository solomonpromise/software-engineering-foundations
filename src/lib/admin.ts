import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/** Data access for the maintainer's /admin page. Row-level security only lets admins read or delete. */

export type CommunityRow = {
  id: string;
  category: string;
  name: string | null;
  email: string | null;
  related: string | null;
  message: string;
  created_at: string;
};

export type LessonRow = {
  id: string;
  lesson_slug: string;
  helpful: boolean;
  comment: string;
  created_at: string;
};

export type FeedbackTable = "community_feedback" | "lesson_feedback" | "reader_letters";

export type LetterRow = {
  id: string;
  lesson_slug: string;
  message: string;
  name: string | null;
  place: string | null;
  approved: boolean;
  approved_at: string | null;
  created_at: string;
};

const LIMIT = 2000;

function db() {
  if (!supabase) throw new Error("The database isn't configured for this site.");
  return supabase;
}

export const adminAvailable = () => supabase !== null;

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onSessionChange(cb: (s: Session | null) => void) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, s) => cb(s));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (!error) return null;
  if (/invalid login credentials/i.test(error.message))
    return "That email and password don't match an account.";
  if (/rate|too many/i.test(error.message))
    return "Too many attempts. Wait a minute and try again.";
  return "Sign-in failed. Check your connection and try again.";
}

export async function signOut() {
  await db().auth.signOut();
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await db().rpc("is_admin");
  return !error && data === true;
}

export async function loadFeedback() {
  const [community, lessons] = await Promise.all([
    db()
      .from("community_feedback")
      .select("id,category,name,email,related,message,created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    db()
      .from("lesson_feedback")
      .select("id,lesson_slug,helpful,comment,created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);
  if (community.error || lessons.error) throw new Error("Feedback could not be loaded.");
  return {
    community: (community.data ?? []) as CommunityRow[],
    lessons: (lessons.data ?? []) as LessonRow[],
  };
}

/** Deletes one row; resolves to true only if the database actually removed it. */
export async function deleteFeedback(table: FeedbackTable, id: string) {
  const { data, error } = await db().from(table).delete().eq("id", id).select("id");
  return !error && (data?.length ?? 0) > 0;
}

/** Letters to the next reader, newest first. null when the letters table hasn't been set up yet. */
export async function loadLetters(): Promise<LetterRow[] | null> {
  const { data, error } = await db()
    .from("reader_letters")
    .select("id,lesson_slug,message,name,place,approved,approved_at,created_at")
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw new Error("Letters could not be loaded.");
  }
  return (data ?? []) as LetterRow[];
}

/** Approves (publishes) or hides a letter. Resolves to the updated row, or null if it failed. */
export async function setLetterApproved(id: string, approved: boolean) {
  const { data, error } = await db()
    .from("reader_letters")
    .update({ approved, approved_at: approved ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id,lesson_slug,message,name,place,approved,approved_at,created_at");
  return !error && data?.[0] ? (data[0] as LetterRow) : null;
}

/** Reader totals and reminders (counts only). */
export async function loadReaderSummary() {
  const [trail, reminders] = await Promise.all([db().rpc("reader_stats"), db().rpc("reminder_count")]);
  const t = trail.data as { readers: number; reading_now: number; seasons: { season: string; readers: number; active: number }[] } | null;
  return {
    readers: t?.readers ?? null,
    readingNow: t?.reading_now ?? null,
    seasons: t?.seasons ?? [],
    reminders: typeof reminders.data === "number" ? reminders.data : reminders.data == null ? null : Number(reminders.data),
  };
}

/** Turns rows into a CSV file and starts a download in the browser. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]!);
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join(
    "\n",
  );
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export type Count = { name: string; count: number };
export type PathCount = { path: string; title: string; count: number };
export type Analytics = {
  days: number;
  start: string;
  end: string;
  total: number;
  totalEvents: number;
  daily: { day: string; count: number }[];
  pages: PathCount[];
  events: PathCount[];
  referrers: Count[];
  locations: Count[];
  devices: Count[];
};
export type AnalyticsResult =
  | { ok: true; data: Analytics }
  | {
      ok: false;
      reason: "not-deployed" | "forbidden" | "missing-key" | "bad-key" | "unavailable";
      /** GoatCounter's own explanation, when it gave one. */
      detail?: string;
    };

/** Visitor statistics from GoatCounter, fetched through the admin-only "analytics" Edge Function. */
export async function loadAnalytics(days: 7 | 30 | 90): Promise<AnalyticsResult> {
  const { data, error } = await db().functions.invoke<Analytics>("analytics", { body: { days } });
  if (!error && data) return { ok: true, data };
  const status = (error as { context?: Response } | null)?.context?.status;
  let body: { error?: string; detail?: string } = {};
  try {
    body = ((await (error as { context?: Response }).context?.clone().json()) ?? {}) as typeof body;
  } catch {
    /* not JSON */
  }
  const detail = body.detail ? { detail: body.detail } : {};
  if (status === 404 || (error && /relay|failed to send/i.test(error.message) && !status))
    return { ok: false, reason: "not-deployed" };
  if (status === 401 || status === 403) return { ok: false, reason: "forbidden" };
  if (body.error === "missing_api_key") return { ok: false, reason: "missing-key" };
  if (body.error === "goatcounter_auth") return { ok: false, reason: "bad-key", ...detail };
  return { ok: false, reason: "unavailable", ...detail };
}
