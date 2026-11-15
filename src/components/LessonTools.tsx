import { Bookmark, NotebookPen } from "lucide-react";
import { useState } from "react";
import { setNote, toggleBookmark, useProgress } from "@/lib/progress";

export function LessonTools({ slug, title }: { slug: string; title: string }) {
  const { bookmarks, notes } = useProgress();
  const [open, setOpen] = useState(false);
  const saved = (bookmarks ?? []).includes(slug);
  const note = notes?.[slug] ?? "";
  return (
    <section aria-label="Your lesson tools" className="mt-6 rounded-xl border border-border bg-card p-4 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => toggleBookmark(slug)}
          aria-pressed={saved}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
        >
          <Bookmark className={`size-4 ${saved ? "fill-current text-accent" : ""}`} />
          {saved ? "Bookmarked" : "Bookmark this lesson"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`notes-${slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"
        >
          <NotebookPen className="size-4" /> {open ? "Hide my notes" : "My notes"}{note && !open ? " · saved" : ""}
        </button>
      </div>
      {open && (
        <div id={`notes-${slug}`} className="mt-4">
          <label htmlFor={`note-${slug}`} className="text-sm font-semibold">Notes on “{title}”</label>
          <textarea
            id={`note-${slug}`}
            value={note}
            onChange={(e) => setNote(slug, e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Write an explanation in your own words, a question to revisit, or something to try…"
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed"
          />
          <p className="mt-1 text-xs text-muted-foreground">Saved as you write, in this browser and in your account when signed in.</p>
        </div>
      )}
    </section>
  );
}
