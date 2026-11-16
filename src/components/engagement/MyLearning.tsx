import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Award, Bookmark, Flag, Mail, NotebookPen } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RefreshCard, RhythmCard } from "@/components/engagement/Habits";
import { PaperNote } from "@/components/engagement/Letters";
import { ReminderCard } from "@/components/engagement/ReminderCard";
import { chapters, parts } from "@/content/lessons";
import { useLetters } from "@/lib/engagement/letters";
import { useMe } from "@/lib/engagement/reader";
import { useProgress } from "@/lib/progress";
import { projectSlug } from "@/routes/projects.$slug";

/**
 * "My learning": a side panel opened from the header, so personal things (progress, rhythm,
 * daily refresh, reminders, bookmarks) and letters from other readers stay out of the page flow.
 */

type Tab = "progress" | "letters";
let state: { open: boolean; tab: Tab } = { open: false, tab: "progress" };
const subs = new Set<() => void>();
function set(next: Partial<typeof state>) {
  state = { ...state, ...next };
  subs.forEach((f) => f());
}
function usePanel() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state,
  );
}

export const openMyLearning = (tab: Tab = "progress") => set({ open: true, tab });

/** True once the reader has done anything worth showing in the panel. */
export function useHasStarted() {
  const { done, last, bookmarks, notes, steps } = useProgress();
  return (
    done.length > 0 ||
    !!last ||
    (bookmarks ?? []).length > 0 ||
    Object.values(notes ?? {}).some((n) => n.trim()) ||
    Object.keys(steps ?? {}).length > 0
  );
}

export function MyLearningButton({ compact = false }: { compact?: boolean }) {
  const started = useHasStarted();
  if (!started) return null;
  return (
    <button
      type="button"
      onClick={() => openMyLearning("progress")}
      aria-label="My learning"
      title="My learning"
      className={
        compact
          ? "flex size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15"
          : "ml-1 inline-flex h-9 min-w-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-header-accent/45 text-sm text-header-foreground hover:bg-header-accent/15 xl:px-3.5"
      }
    >
      <NotebookPen className="size-4" aria-hidden />
      {!compact && <span className="hidden xl:inline">My learning</span>}
    </button>
  );
}

export function MyLearningPanel() {
  const { open, tab } = usePanel();
  const href = useRouterState({ select: (s) => s.location.href });
  // Following a link inside the panel closes it.
  useEffect(() => set({ open: false }), [href]);
  return (
    <Sheet open={open} onOpenChange={(o) => set({ open: o })}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 pb-0 pt-6 text-left">
          <SheetTitle className="font-serif text-2xl">My learning</SheetTitle>
          <SheetDescription>Your progress, and notes from readers before you.</SheetDescription>
          <div role="tablist" aria-label="My learning" className="-mb-px mt-3 flex gap-1">
            {(
              [
                ["progress", "Progress"],
                ["letters", "Letters from readers"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => set({ tab: id })}
                className={`border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </SheetHeader>
        <div role="tabpanel" className="px-6 py-6">
          {tab === "progress" ? <ProgressTab /> : <LettersTab />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProgressTab() {
  const { done, last, steps, bookmarks } = useProgress();
  const me = useMe();
  const doneSet = new Set(done);
  const resume =
    chapters.find((c) => c.slug === last && !doneSet.has(c.slug)) ??
    chapters.find((c) => !doneSet.has(c.slug));
  const saved = (bookmarks ?? [])
    .map((slug) => chapters.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, 5);
  const activeProject = parts.find((p) => {
    const count = steps?.[projectSlug(p.number)]?.length ?? 0;
    return count > 0 && count < p.project.steps.length;
  });
  const pct = Math.round((done.length / chapters.length) * 100);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-serif text-xl">
            {done.length} of {chapters.length} lessons finished
          </p>
          {me.number && (
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Reader #{me.number.toLocaleString("en")}
            </p>
          )}
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary">
          <div className="h-full rounded-full bg-brass" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {resume ? (
        <Link
          to="/learn/$slug"
          params={{ slug: resume.slug }}
          className="group block rounded-xl bg-primary p-5 text-primary-foreground"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brass">Next lesson</p>
          <p className="mt-2 font-serif text-xl">
            {resume.number}. {resume.title}
          </p>
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
            Continue reading <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </Link>
      ) : (
        <Link
          to="/certificate"
          className="flex items-center gap-3 rounded-xl bg-primary p-5 text-primary-foreground"
        >
          <Award className="size-6 text-brass" />{" "}
          <span className="font-serif text-xl">Every lesson finished — see your certificate</span>
        </Link>
      )}

      {activeProject && (
        <Link
          to="/projects/$slug"
          params={{ slug: projectSlug(activeProject.number) }}
          className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-primary"
        >
          <Flag className="size-5 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Project in progress
            </span>
            <span className="mt-0.5 block font-semibold">{activeProject.project.title}</span>
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <RefreshCard />
      <RhythmCard />
      <ReminderCard compact />

      {saved.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <Bookmark className="size-4" /> Bookmarked lessons
          </p>
          <ul className="mt-3 space-y-2">
            {saved.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/learn/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center justify-between gap-3 text-sm font-semibold hover:text-primary"
                >
                  <span>{c.title}</span>
                  <ArrowRight className="size-3.5 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function LettersTab() {
  const letters = useLetters();
  const [count, setCount] = useState(8);
  if (letters === undefined)
    return <p className="text-sm text-muted-foreground">Loading letters…</p>;
  if (!letters.length) {
    return (
      <div className="text-center">
        <Mail className="mx-auto size-8 text-accent" />
        <p className="mt-3 font-serif text-xl">No letters yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you finish a lesson, you can leave a note for whoever reads it next. Yours could be
          the first.
        </p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Notes readers left for whoever comes next, after finishing a lesson.
      </p>
      <div className="mt-6 space-y-7 px-1">
        {letters.slice(0, count).map((l, i) => (
          <PaperNote key={l.id} letter={l} tilt={i % 2 ? 0.7 : -0.7} lessonTag />
        ))}
      </div>
      {letters.length > count && (
        <button
          type="button"
          onClick={() => setCount((c) => c + 8)}
          className="mt-6 w-full rounded-full border border-border py-2.5 text-sm font-semibold hover:border-primary"
        >
          Show more letters
        </button>
      )}
    </div>
  );
}
