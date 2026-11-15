import { ArrowRight, Bookmark, CheckCircle2, Flag, NotebookPen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { chapters, parts } from "@/content/lessons";
import { useProgress } from "@/lib/progress";
import { projectSlug } from "@/routes/projects.$slug";

export function ContinueLearning() {
  const { done, last, steps, bookmarks, notes } = useProgress();
  const doneSet = new Set(done);
  const resume = chapters.find((c) => c.slug === last && !doneSet.has(c.slug)) ?? chapters.find((c) => !doneSet.has(c.slug));
  const saved = (bookmarks ?? []).map((slug) => chapters.find((c) => c.slug === slug)).filter(Boolean).slice(0, 3);
  const activeProject = parts.find((p) => {
    const count = steps?.[projectSlug(p.number)]?.length ?? 0;
    return count > 0 && count < p.project.steps.length;
  });
  const noteCount = Object.values(notes ?? {}).filter((n) => n.trim()).length;
  const started = done.length > 0 || Boolean(last) || (bookmarks ?? []).length > 0 || noteCount > 0 || Object.keys(steps ?? {}).length > 0;
  if (!started || (!resume && !activeProject && !saved.length)) return null;
  return (
    <section aria-labelledby="continue-learning" className="mx-auto max-w-6xl px-5 pt-12">
      <div className="rounded-2xl border border-brass/50 bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Your learning</p>
            <h2 id="continue-learning" className="mt-2 font-serif text-3xl">Pick up where you left off</h2>
          </div>
          <p className="text-sm text-muted-foreground">{done.length} lessons finished · {noteCount} {noteCount === 1 ? "note" : "notes"} saved</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {resume && (
            <Link to="/learn/$slug" params={{ slug: resume.slug }} className="group rounded-xl bg-primary p-5 text-primary-foreground">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brass"><CheckCircle2 className="size-4" /> Next lesson</p>
              <p className="mt-3 font-serif text-2xl">{resume.number}. {resume.title}</p>
              <p className="mt-2 text-sm text-primary-foreground/75">{resume.summary}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Continue reading <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
            </Link>
          )}
          <div className="space-y-4">
            {activeProject && (
              <Link to="/projects/$slug" params={{ slug: projectSlug(activeProject.number) }} className="group flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary">
                <Flag className="size-6 shrink-0 text-accent" />
                <span className="min-w-0 flex-1"><span className="block text-xs uppercase tracking-[0.15em] text-muted-foreground">Project in progress</span><span className="mt-1 block font-semibold">{activeProject.project.title}</span></span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            )}
            {saved.length > 0 && (
              <div className="rounded-xl border border-border p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"><Bookmark className="size-4" /> Bookmarked lessons</p>
                <ul className="mt-3 space-y-2">{saved.map((c) => <li key={c!.slug}><Link to="/learn/$slug" params={{ slug: c!.slug }} className="flex items-center justify-between gap-3 text-sm font-semibold hover:text-primary"><span>{c!.title}</span><ArrowRight className="size-3.5 shrink-0" /></Link></li>)}</ul>
              </div>
            )}
            {!activeProject && !saved.length && (
              <Link to="/curriculum" className="group flex h-full min-h-28 items-center justify-between gap-4 rounded-xl border border-border p-5 hover:border-primary">
                <span><span className="block font-serif text-xl">See the whole course</span><span className="mt-1 block text-sm text-muted-foreground">Review parts, projects and everything you have finished.</span></span><ArrowRight className="size-5 shrink-0" />
              </Link>
            )}
          </div>
        </div>
        {noteCount > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><NotebookPen className="size-3.5" /> Open any lesson to read or edit its notes.</p>}
      </div>
    </section>
  );
}
