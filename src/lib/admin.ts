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

export type FeedbackTable = "community_feedback" | "lesson_feedback";

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
