import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { chapters } from "@/content/lessons";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/account";
import { CommunityMessages } from "@/components/community/CommunityMessages";

type FeedbackRow = { id: string; lesson_slug: string; helpful: boolean; comment: string; created_at: string };

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({ meta: [
    { title: "Learner feedback — Software Engineering Foundations" },
    { name: "description", content: "Private lesson ratings and comments for the course creator." },
    { property: "og:title", content: "Learner feedback — Software Engineering Foundations" },
    { property: "og:description", content: "Private lesson ratings and comments for the course creator." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: FeedbackDashboard,
});

function FeedbackDashboard() {
  const { user } = useUser();
  const [status, setStatus] = useState<"loading" | "admin" | "denied">("loading");
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void (async () => {
      const role = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!alive) return;
      if (role.error || !role.data) { setStatus("denied"); return; }
      setStatus("admin");
      const result = await supabase.from("lesson_feedback").select("id,lesson_slug,helpful,comment,created_at").order("created_at", { ascending: false }).limit(500);
      if (!alive) return;
      if (result.error) setError("Feedback could not be loaded. Please try again later.");
      else setRows(result.data);
    })();
    return () => { alive = false; };
  }, [user]);
  const summaries = useMemo(() => chapters.map((c) => {
    const items = rows.filter((r) => r.lesson_slug === c.slug);
    return { chapter: c, total: items.length, helpful: items.filter((r) => r.helpful).length };
  }).filter((s) => s.total > 0).sort((a, b) => b.total - a.total), [rows]);
  const comments = rows.filter((r) => r.comment.trim());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Creator dashboard</p>
        <h1 className="mt-3 font-serif text-5xl">Learner feedback</h1>
        <p className="mt-3 text-muted-foreground">Private ratings and comments help you find lessons that need a clearer explanation.</p>
        {status === "loading" && <p className="mt-10" role="status">Loading feedback…</p>}
        {status === "denied" && <p className="mt-10 rounded-xl border border-border bg-card p-6">This dashboard is available only to the course creator.</p>}
        {status === "admin" && !error && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label="Responses" value={rows.length} />
              <Stat label="Helpful" value={rows.filter((r) => r.helpful).length} />
              <Stat label="Written comments" value={comments.length} />
            </div>
            {rows.length === 0 ? <p className="mt-10 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No feedback yet. Ratings and comments will appear here after learners submit them.</p> : (
              <div className="mt-10 grid gap-10 lg:grid-cols-[18rem_1fr]">
                <section aria-labelledby="lesson-ratings">
                  <h2 id="lesson-ratings" className="font-serif text-2xl">Ratings by lesson</h2>
                  <ol className="mt-4 space-y-3">{summaries.map((s) => <li key={s.chapter.slug} className="rounded-lg border border-border bg-card p-3"><p className="font-semibold">{s.chapter.number}. {s.chapter.title}</p><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><ThumbsUp className="size-3.5" /> {s.helpful} of {s.total} helpful</p><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brass" style={{ width: `${(s.helpful / s.total) * 100}%` }} /></div></li>)}</ol>
                </section>
                <section aria-labelledby="learner-comments">
                  <h2 id="learner-comments" className="font-serif text-2xl">Written comments</h2>
                  {comments.length === 0 ? <p className="mt-4 text-muted-foreground">No written comments yet.</p> : <ul className="mt-4 space-y-4">{comments.map((r) => {
                    const lesson = chapters.find((c) => c.slug === r.lesson_slug);
                    return <li key={r.id} className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="font-semibold">{lesson?.number}. {lesson?.title ?? r.lesson_slug}</p><span className={`inline-flex items-center gap-1 ${r.helpful ? "text-primary" : "text-destructive"}`}>{r.helpful ? <ThumbsUp className="size-4" /> : <ThumbsDown className="size-4" />}{r.helpful ? "Helpful" : "Not quite"}</span></div><p className="mt-3 whitespace-pre-wrap">{r.comment}</p><time className="mt-3 block text-xs text-muted-foreground" dateTime={r.created_at}>{new Date(r.created_at).toLocaleString()}</time></li>;
                  })}</ul>}
                </section>
              </div>
            )}
          </>
        )}
        {error && <p className="mt-8 text-destructive" role="alert">{error}</p>}
        {status === "admin" && <CommunityMessages />}
        <p className="mt-12 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><MessageSquareText className="size-4" /> Only your creator account can read these responses.</p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-card p-5"><p className="font-serif text-4xl text-primary">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}
