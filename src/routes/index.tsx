import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, Layers, AppWindow, Workflow, ClipboardList, Network, Bot, Rocket } from "lucide-react";
import heroImg from "@/assets/landing-hero.jpg";

const conceptIcons = [AppWindow, Workflow, ClipboardList, Network, Bot, Rocket];
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
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img src={heroImg} alt="A builder planning an app's frontend, backend and database in a notebook beside a laptop with an AI assistant" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/30" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pb-32 md:pt-28">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brass">Free course · No experience needed</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
            You can build apps with AI. <span className="italic text-brass">Now understand them.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
            {chapters.length} plain-language lessons that take you from your first idea to a live, maintained product — so you can judge what AI builds for you, not just hope it works.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {first && (
              <Link to="/learn/$slug" params={{ slug: (started && resume ? resume : first).slug }} className="inline-flex items-center gap-2 rounded-full bg-brass px-7 py-4 font-semibold text-primary transition hover:gap-4">
                {started && resume ? `Continue · Lesson ${resume.number}` : "Start lesson 1"} <ArrowRight className="size-4" />
              </Link>
            )}
            <Link to="/start/$slug" params={{ slug: "about" }} className="rounded-full border border-primary-foreground/40 px-7 py-4 font-semibold hover:bg-primary-foreground/10">How the course works</Link>
          </div>
          {started && <p className="mt-6 text-sm text-primary-foreground/70">{done.length} of {chapters.length} lessons finished</p>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">What you'll understand</p>
        <h2 className="mt-3 max-w-2xl font-serif text-4xl">Six ideas every builder needs before trusting AI with their product.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p, i) => {
            const Icon = conceptIcons[i] ?? Layers;
            return (
              <a key={p.number} href="#curriculum" className="group bg-card p-7 transition hover:bg-secondary/50">
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-accent" />
                  <span className="font-serif text-3xl text-brass">0{p.number}</span>
                </div>
                <h3 className="mt-5 font-serif text-2xl group-hover:text-primary">{p.title}</h3>
                <p className="mt-2 italic text-muted-foreground">{p.question}</p>
                <p className="mt-4 text-sm text-muted-foreground">{p.chapters.length} lessons · Project: {p.project.title}</p>
              </a>
            );
          })}
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[["Plain language","Every idea explained without jargon, with everyday examples."],["Learn by building","Each part ends with a hands-on project you can do with AI."],["Ask the tutor","Stuck? Ask questions about any lesson and get answers grounded in it."]].map(([t,d]) => (
            <div key={t} className="border-t-2 border-brass pt-4"><h3 className="font-serif text-xl">{t}</h3><p className="mt-1 text-muted-foreground">{d}</p></div>
          ))}
        </div>
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
