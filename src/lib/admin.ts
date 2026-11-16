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
