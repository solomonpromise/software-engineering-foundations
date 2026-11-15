import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, BookOpen } from "lucide-react";
import { useProgress, resetProgress } from "@/lib/progress";
import { parts, chapters } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Software Foundations — Free lessons for AI builders" },
      { name: "description", content: "A free course for people building apps with AI and no engineering background: understand, judge and maintain what you build." },
      { property: "og:title", content: "Software Foundations — Free lessons for AI builders" },
      { property: "og:description", content: "Understand, judge and maintain the apps you build with AI. Free, beginner-friendly lessons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const first = chapters[0];
  const { done, last } = useProgress();
  const doneSet = new Set(done);
  const resume = chapters.find((c) => c.slug === last && !doneSet.has(c.slug)) ?? chapters.find((c) => !doneSet.has(c.slug));
  const started = done.length > 0 || !!last;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 md:pt-28">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Free course · No experience needed</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl">
          You can build apps with AI. <span className="italic text-primary">Now understand them.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          {chapters.length || 34} plain-language lessons that take you from your first idea to a live, maintained product — so you can judge what AI builds for you, not just hope it works.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link to="/start/$slug" params={{ slug: "about" }} className="rounded-full border border-primary px-7 py-4 font-semibold text-primary">Start here</Link>
        {first && (
          <Link to="/learn/$slug" params={{ slug: first.slug }} className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:gap-4">
            Start lesson 1 <ArrowRight className="size-4" />
          </Link>
        )}
        </div>
        {started && resume && (
          <Link to="/learn/$slug" params={{ slug: resume.slug }} className="group mt-12 flex max-w-2xl items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary">
            <BookOpen className="size-8 shrink-0 text-accent" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Continue reading · {done.length} of {chapters.length} done</p>
              <p className="mt-1 font-serif text-xl group-hover:text-primary">Lesson {resume.number}: {resume.title}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${(done.length / chapters.length) * 100}%` }} /></div>
            </div>
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </Link>
        )}
      </section>

      <section id="curriculum" className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-serif text-4xl">The curriculum</h2>
          <p className="mt-2 text-muted-foreground">Six parts. Each answers one big question and ends with a hands-on project.</p>
          <div className="mt-12 space-y-14">
            {parts.map((p) => (
              <div key={p.number} className="grid gap-6 md:grid-cols-[260px_1fr]">
                <div>
                  <p className="font-serif text-6xl text-accent">0{p.number}</p>
                  <h3 className="mt-2 font-serif text-2xl">{p.title}</h3>
                  <p className="mt-2 text-sm italic text-muted-foreground">{p.question}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{p.intro}</p>
                  <ul className="mt-5 divide-y divide-border border-y border-border">
                    {p.chapters.map((c) => (
                      <li key={c.slug}>
                        <Link to="/learn/$slug" params={{ slug: c.slug }} className="group flex items-baseline gap-4 py-3">
                          {doneSet.has(c.slug) ? <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-accent" aria-label="Finished" /> : <Circle className="size-4 shrink-0 translate-y-0.5 text-border" />}
                          <span className="w-6 font-mono text-xs text-muted-foreground">{String(c.number).padStart(2, "0")}</span>
                          <span className="flex-1 font-medium group-hover:text-primary">{c.title}</span>
                          <ArrowRight className="size-4 opacity-0 transition group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">{p.chapters.filter((c) => doneSet.has(c.slug)).length} of {p.chapters.length} finished</p>
                  <p className="mt-1 text-sm"><span className="font-semibold text-accent">Project:</span> {p.project.title}</p>
                </div>
              </div>
            ))}
            {done.length > 0 && <button onClick={() => confirm("Clear all your reading progress?") && resetProgress()} className="text-sm text-muted-foreground underline">Reset my progress</button>}
            {parts.length === 0 && <p className="text-muted-foreground">Lessons are being prepared…</p>}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
