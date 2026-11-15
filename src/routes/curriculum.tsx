import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { useProgress, resetProgress } from "@/lib/progress";
import { parts } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum — Software Foundations" },
      { name: "description", content: "All 34 lessons of the free Software Foundations course, in six parts, each ending with a hands-on project." },
      { property: "og:title", content: "Curriculum — Software Foundations" },
      { property: "og:description", content: "Six parts, 34 lessons, six hands-on projects for builders using AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Curriculum,
});

function Curriculum() {
  const { done } = useProgress();
  const doneSet = new Set(done);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section>
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h1 className="font-serif text-5xl">The curriculum</h1>
          <p className="mt-2 text-muted-foreground">Six parts. Each answers one big question and ends with a hands-on project.</p>
          <div className="mt-12 space-y-14">
            {parts.map((p) => (
              <div key={p.number} id={`part-${p.number}`} className="scroll-mt-24 grid gap-6 md:grid-cols-[260px_1fr]">
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
                          {doneSet.has(c.slug) ? <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-accent" aria-label="Finished" /> : <Circle className="size-4 shrink-0 translate-y-0.5 text-muted-foreground/60" />}
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
