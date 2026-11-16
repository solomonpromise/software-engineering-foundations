import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Flag } from "lucide-react";
import { useProgress, resetProgress } from "@/lib/progress";
import { parts, chapters } from "@/content/lessons";
import { projectSlug } from "./projects.$slug";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum — Software Engineering Foundations" },
      { name: "description", content: "All 34 lessons of the free Software Engineering Foundations resource, in six parts, each ending with a hands-on project." },
      { property: "og:title", content: "Curriculum — Software Engineering Foundations" },
      { property: "og:description", content: "Six parts, 34 lessons, six hands-on projects for builders using AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Curriculum,
});

function Curriculum() {
  const { done, last, steps } = useProgress();
  const doneSet = new Set(done);
  const total = chapters.length;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{done.length} of {total} lessons finished</p>
        <h1 className="mt-3 font-serif text-5xl">The curriculum</h1>
        <p className="mt-3 text-lg text-muted-foreground">Six parts, {total} lessons. Each part answers one big question and ends with a hands-on project.</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brass" style={{ width: `${(done.length / total) * 100}%` }} /></div>
        <div className="mt-14 space-y-16">
          {parts.map((p) => {
            const n = p.chapters.filter((c) => doneSet.has(c.slug)).length;
            return (
              <div key={p.number} id={`part-${p.number}`} className="scroll-mt-24">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {p.number}</p>
                    <h2 className="mt-1 font-serif text-3xl">{p.title}</h2>
                    <p className="mt-1 italic text-muted-foreground">{p.question}</p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">{n}/{p.chapters.length}</p>
                </div>
                <ol className="relative mt-8 space-y-4 border-l-2 border-border pl-9">
                  {p.chapters.map((c) => {
                    const fin = doneSet.has(c.slug);
                    return (
                      <li key={c.slug} className="relative">
                        <span className={`absolute -left-[3.05rem] top-4 flex size-8 items-center justify-center rounded-full border-2 text-sm ${fin ? "border-primary bg-primary text-primary-foreground" : "border-brass bg-background text-accent"}`}>
                          {fin ? <Check className="size-4" /> : c.number}
                        </span>
                        <Link to="/learn/$slug" params={{ slug: c.slug }} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Lesson {c.number} · {fin ? "Finished" : c.slug === last ? "In progress" : "Not started"}</p>
                            <p className="font-serif text-xl group-hover:text-primary">{c.title}</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">{fin ? "Review" : c.slug === last ? "Continue" : "Start"} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
                        </Link>
                      </li>
                    );
                  })}
                  <li className="relative">
                    <span className="absolute -left-[3.05rem] top-3 flex size-8 items-center justify-center rounded-full border-2 border-brass bg-brass text-primary"><Flag className="size-4" /></span>
                    <Link to="/projects/$slug" params={{ slug: projectSlug(p.number) }} className="group flex items-center gap-4 rounded-xl bg-secondary/60 p-4 transition hover:bg-secondary"><div className="flex-1"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part project · {(steps?.[projectSlug(p.number)] ?? []).length} of {p.project.steps.length} steps</p><p className="font-semibold group-hover:text-primary">{p.project.title}</p><p className="mt-1 text-xs text-muted-foreground">{n === p.chapters.length ? "Ready: you\u2019ve finished every lesson it needs." : `Needs lessons ${p.chapters[0]?.number}\u2013${p.chapters[p.chapters.length - 1]?.number} · ${n} of ${p.chapters.length} done`}</p></div><span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">Open <ArrowRight className="size-4" /></span></Link>
                  </li>
                </ol>
              </div>
            );
          })}
        </div>
        {done.length > 0 && <button onClick={() => confirm("Clear all your reading progress?") && resetProgress()} className="mt-12 text-sm text-muted-foreground underline">Reset my progress</button>}
      </section>
      <SiteFooter />
    </div>
  );
}
