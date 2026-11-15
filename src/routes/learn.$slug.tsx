import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { markDone, setLast, useProgress } from "@/lib/progress";
import { findChapter } from "@/content/lessons";
import { lessonRepo, linkHref } from "@/content/taskboard";
import { projectSlug } from "./projects.$slug";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { figuresFor } from "@/content/extras";
import { FigureBlock } from "@/components/Prose";
import { LessonTutor } from "@/components/LessonTutor";
import { canFinish, gotCount, type Verdict } from "@/lib/quiz";
import { LessonTools } from "@/components/LessonTools";
import { PracticeExercise } from "@/components/PracticeExercise";
import { LessonFeedback } from "@/components/LessonFeedback";

export const Route = createFileRoute("/learn/$slug")({
  loader: ({ params }) => {
    const r = findChapter(params.slug);
    if (!r) throw notFound();
    return r;
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.chapter.title} — Software Foundations` : "Lesson — Software Foundations";
    const d = loaderData?.chapter.summary ?? "A free lesson for AI builders.";
    return { meta: [
      { title: t }, { name: "description", content: d },
      { property: "og:title", content: t }, { property: "og:description", content: d },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: Lesson,
});

function Para({ text }: { text: string }) {
  if (text.startsWith("```")) {
    const code = text.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
    return <pre className="lesson-code"><code>{code}</code></pre>;
  }
  return <p>{text}</p>;
}

function Box({ tone, label, children }: { tone: string; label: string; children: React.ReactNode }) {
  return (
    <div className={`callout callout-${tone}`}>
      <p className="callout-label">{label}</p>
      {children}
    </div>
  );
}

function Check({ n, q, a, verdict, onVerdict }: { n: number; q: string; a: string; verdict?: Verdict | undefined; onVerdict: (v: Verdict) => void }) {
  const [open, setOpen] = useState(false);
  const tone = verdict === "got" ? "border-accent/60" : verdict === "not" ? "border-destructive/40" : "border-border";
  return (
    <li className={`rounded-lg border bg-card p-4 ${tone}`}>
      <p className="font-medium"><span className="mr-2 text-sm text-muted-foreground">Q{n}.</span>{q}</p>
      <p className="mt-1 text-xs text-muted-foreground">Answer it in your head or on paper first, then compare.</p>
      <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-semibold text-primary">{open ? "Hide answer" : "Show answer"}</button>
      {open && (
        <>
          <p className="mt-2 text-muted-foreground">{a}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Did you get it?</span>
            <button onClick={() => onVerdict("got")} aria-pressed={verdict === "got"} className={`rounded-full border px-3 py-1 ${verdict === "got" ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>Yes, I got it</button>
            <button onClick={() => onVerdict("not")} aria-pressed={verdict === "not"} className={`rounded-full border px-3 py-1 ${verdict === "not" ? "border-destructive bg-destructive/10 text-destructive" : "border-border"}`}>Not yet</button>
          </div>
          {verdict === "not" && <p className="mt-2 text-xs text-muted-foreground">Re-read the section above, or ask the lesson helper (bottom right) to explain it another way.</p>}
        </>
      )}
    </li>
  );
}

function Lesson() {
  const { chapter: c, prev, next } = Route.useLoaderData();
  const figs = figuresFor(c.slug);
  const hero = figs.find((f) => f.hero);
  const inline = figs.filter((f) => !f.hero);
  const { done } = useProgress();
  const isDone = done.includes(c.slug);
  const [verdicts, setVerdicts] = useState<Record<number, Verdict>>({});
  useEffect(() => setVerdicts({}), [c.slug]);
  const passed = canFinish(verdicts, c.check.length);
  const navigate = useNavigate();
  const [scroll, setScroll] = useState(0);
  const [active, setActive] = useState(0);
  const words = JSON.stringify(c).split(/\s+/).length;
  const minutes = Math.max(3, Math.round(words / 220));
  const ids = c.sections.map((_, i) => `s${i + 1}`);

  useEffect(() => { setLast(c.slug); }, [c.slug]);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      setScroll(pct);
      let a = 0;
      ids.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 160) a = i; });
      setActive(a);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [c.slug]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" && next) navigate({ to: "/learn/$slug", params: { slug: next.slug } });
      if (e.key === "ArrowLeft" && prev) navigate({ to: "/learn/$slug", params: { slug: prev.slug } });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [prev, next]);

  return (
    <div className="lesson-page min-h-screen">
      <SiteHeader />
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-transparent" aria-hidden>
        <div className="h-full bg-brass transition-[width] duration-150" style={{ width: `${scroll * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-6xl gap-10 px-5">
      <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-56 shrink-0 overflow-y-auto py-16 text-sm lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">In this lesson</p>
        <ol className="mt-4 space-y-1 border-l border-border">
          {c.sections.map((s, i) => (
            <li key={s.heading}>
              <a href={`#${ids[i]}`} className={`-ml-px block border-l-2 py-1.5 pl-3 leading-snug transition ${active === i ? "border-accent font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{s.heading}</a>
            </li>
          ))}
          <li><a href="#check" className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-muted-foreground hover:text-foreground">Check your understanding</a></li>
        </ol>
        <p className="mt-8 text-xs text-muted-foreground">Tip: use ← → keys to move between lessons.</p>
      </aside>
      <article id="lesson-content" tabIndex={-1} className="mx-auto min-w-0 max-w-3xl flex-1 py-16">
        <Link to="/curriculum" hash={`part-${c.part.number}`} className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {c.part.number} · {c.part.title}</Link>
        {hero && (
          <figure className="mt-6">
            <img src={hero.url} alt={hero.caption || c.title} className="aspect-[21/9] w-full rounded-xl object-cover" />
            {hero.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{hero.caption}</figcaption>}
          </figure>
        )}
        <p className="mt-6 font-serif text-7xl text-primary/40">{String(c.number).padStart(2, "0")}</p>
        <h1 className="font-serif text-4xl leading-tight md:text-5xl">{c.title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> About {minutes} min read</span>
          {isDone && <span className="inline-flex items-center gap-1.5 font-medium text-accent"><CheckCircle2 className="size-4" /> Finished</span>}
        </p>
        <p className="mt-6 border-l-4 border-accent pl-5 font-serif text-xl italic">{c.question}</p>
        <LessonTools slug={c.slug} title={c.title} />

        <div className="lesson-prose mt-10">
          {c.sections.map((s, si) => (
            <section key={s.heading} id={ids[si]} className="scroll-mt-24">
              {inline[si - 1] && si > 0 && <FigureBlock {...inline[si - 1]!} />}
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, i) => <Para key={i} text={p} />)}
              {s.bullets && s.bullets.length > 0 && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
            </section>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <Box tone="key" label="Key idea"><p className="font-serif text-xl">{c.keyIdea}</p></Box>
          <Box tone="taskboard" label="In Taskboard"><p>{c.taskboard}</p>
            {lessonRepo[c.number] && <div className="mt-3 border-t border-border pt-3 text-base">
              <p className="text-sm text-muted-foreground">See it in the real code: {lessonRepo[c.number]!.note}</p>
              <div className="mt-2 flex flex-wrap gap-2">{lessonRepo[c.number]!.links.map((l) => <a key={l.label + l.path} href={linkHref(l)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs hover:border-primary hover:text-primary">{l.label || "repository"} ↗</a>)}</div>
            </div>}
            <p className="mt-3 text-sm"><Link to="/taskboard" className="font-semibold text-primary underline">Run Taskboard</Link> and follow along in the real code.</p>
            {c.part.project && <p className="mt-3 text-sm">This lesson is used in <Link to="/projects/$slug" params={{ slug: projectSlug(c.part.number) }} className="font-semibold text-primary underline">Project {c.part.number}: {c.part.project.title}</Link>.</p>}
          </Box>
          <Box tone="walk" label={`Walkthrough · ${c.walkthrough.title}`}>
            <ol className="list-decimal space-y-2 pl-5">{c.walkthrough.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </Box>
          <div className="grid gap-6 md:grid-cols-2">
            <Box tone="mistake" label="Common mistakes"><ul className="list-disc space-y-2 pl-5">{c.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></Box>
            <Box tone="ai" label="When AI gets it wrong"><ul className="list-disc space-y-2 pl-5">{c.aiMistakes.map((m) => <li key={m}>{m}</li>)}</ul></Box>
          </div>
          <Box tone="walk" label="Try it yourself"><ol className="list-decimal space-y-2 pl-5">{c.tryIt.map((t) => <li key={t}>{t}</li>)}</ol></Box>
        </div>

        <h2 id="check" className="mt-14 scroll-mt-24 font-serif text-3xl">Check your understanding</h2>
        <ul className="mt-6 space-y-3">{c.check.map((x, i) => <Check key={x.q} n={i + 1} {...x} verdict={verdicts[i]} onVerdict={(v) => setVerdicts((p) => ({ ...p, [i]: v }))} />)}</ul>

        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
          {isDone ? (
            <>
              <CheckCircle2 className="size-10 text-accent" />
              <p className="font-serif text-2xl">Lesson finished. Nice work.</p>
              <div className="flex flex-wrap justify-center gap-3">
                {next && <Link to="/learn/$slug" params={{ slug: next.slug }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Next lesson <ArrowRight className="size-4" /></Link>}
                <button onClick={() => markDone(c.slug, false)} className="text-sm text-muted-foreground underline">Mark as not finished</button>
              </div>
            </>
          ) : (
            <>
              <p className="font-serif text-2xl">Done with this lesson?</p>
              <p className="text-sm text-muted-foreground">{passed ? "You've answered every question. Mark it finished to track your progress." : `Answer the questions above first: ${gotCount(verdicts)} of ${c.check.length} got it.`}</p>
              <button disabled={!passed} onClick={() => { markDone(c.slug); }} className="disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"><CheckCircle2 className="size-4" /> Mark as finished</button>
            </>
          )}
        </div>

        <nav className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
          {prev ? (
            <Link to="/learn/$slug" params={{ slug: prev.slug }} className="group rounded-lg border border-border p-4 hover:border-primary">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3" /> Previous</span>
              <span className="mt-1 block font-medium">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link to="/learn/$slug" params={{ slug: next.slug }} className="group rounded-lg border border-border p-4 text-right hover:border-primary">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Next <ArrowRight className="size-3" /></span>
              <span className="mt-1 block font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
      </div>
      <LessonTutor slug={c.slug} title={c.title} />
      <SiteFooter />
    </div>
  );
}
