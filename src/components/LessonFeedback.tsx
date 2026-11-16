import { MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

const KEY = "sf:lesson-feedback:v1";

export function LessonFeedback({ slug, title }: { slug: string; title: string }) {
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setHelpful(null); setComment(""); setError("");
    try { setSent(Boolean(JSON.parse(localStorage.getItem(KEY) || "{}")[slug])); } catch { setSent(false); }
  }, [slug]);

  const submit = async () => {
    if (helpful === null || !supabase) return;
    setBusy(true); setError("");
    const { error: saveError } = await supabase.from("lesson_feedback").insert({
      lesson_slug: slug,
      helpful,
      comment: comment.trim().slice(0, 1000),
    });
    setBusy(false);
    if (saveError) { setError("Your feedback could not be saved. Please check your connection and try again."); return; }
    try {
      const previous = JSON.parse(localStorage.getItem(KEY) || "{}");
      localStorage.setItem(KEY, JSON.stringify({ ...previous, [slug]: helpful }));
    } catch { /* The feedback is saved even if browser storage is unavailable. */ }
    setSent(true);
    trackEvent(`lesson-rated/${helpful ? "helpful" : "not-helpful"}`, helpful ? "Lesson rated helpful" : "Lesson rated not helpful");
  };

  if (!supabase) return null;
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-6 print:hidden" aria-labelledby={`feedback-${slug}`}>
      <div className="flex items-center gap-3">
        <MessageSquareText className="size-5 text-accent" />
        <h2 id={`feedback-${slug}`} className="font-serif text-2xl">Was this lesson helpful?</h2>
      </div>
      {sent ? (
        <p className="mt-3 text-muted-foreground" role="status">Thank you. Your feedback helps improve “{title}” for other learners.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Rate this lesson">
            <button type="button" onClick={() => setHelpful(true)} aria-pressed={helpful === true} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${helpful === true ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}><ThumbsUp className="size-4" /> Yes, it helped</button>
            <button type="button" onClick={() => setHelpful(false)} aria-pressed={helpful === false} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${helpful === false ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}><ThumbsDown className="size-4" /> Not quite</button>
          </div>
          {helpful !== null && (
            <div className="mt-4">
              <label htmlFor={`feedback-comment-${slug}`} className="text-sm font-semibold">{helpful ? "What worked well? (optional)" : "What was confusing or missing? (optional)"}</label>
              <textarea id={`feedback-comment-${slug}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base" placeholder="A sentence or two is enough. Please don't include passwords or API keys." />
              <button type="button" disabled={busy} onClick={submit} className="mt-3 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Send private feedback"}</button>
              <p className="mt-2 text-xs text-muted-foreground">Your rating and comment go only to the course creator. They are not shown publicly.</p>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}
