import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock, Flag } from "lucide-react";
import { parts } from "@/content/lessons";
import projects from "@/content/projects.json";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useProgress, toggleStep } from "@/lib/progress";

type Extra = { slug: string; time: string; deliverable: string; setup: string[]; code: { title: string; lang: string; body: string }[] };
const extras = projects as Record<string, Extra>;
export const projectSlug = (n: number) => extras[String(n)]?.slug ?? `part-${n}`;

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const part = parts.find((p) => projectSlug(p.number) === params.slug);
    if (!part) throw notFound();
    return { partNumber: part.number };
  },
  head: ({ loaderData }) => {
    const p = parts.find((x) => x.number === loaderData?.partNumber);
    const t = `Project ${p?.number ?? ""}: ${p?.project.title ?? "Project"} — Software Foundations`;
    const d = p?.project.summary.slice(0, 155) ?? "A hands-on course project.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: ProjectPage,
});

function ProjectPage() {
  const { partNumber } = Route.useLoaderData();
  const part = parts.find((p) => p.number === partNumber)!;
  const x = extras[String(partNumber)]!;
  const { steps } = useProgress();
  const doneSteps = new Set(steps?.[x.slug] ?? []);
  const total = part.project.steps.length;
  const prev = parts.find((p) => p.number === partNumber - 1);
  const next = parts.find((p) => p.number === partNumber + 1);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/curriculum" hash={`part-${part.number}`} className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {part.number} · {part.title}</Link>
        <h1 className="mt-3 flex items-start gap-3 font-serif text-4xl md:text-5xl"><Flag className="mt-2 size-8 shrink-0 text-brass" />{part.project.title}</h1>
        <p className="lesson-prose mt-6"><span className="block">{part.project.summary}</span></p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"><Clock className="size-4" />Time</p><p className="mt-1 font-serif text-xl">{x.time}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">You'll finish with</p><p className="mt-1">{x.deliverable}</p></div>
        </div>

        <div className="sticky top-16 z-10 mt-10 rounded-xl border border-border bg-background/95 p-4 backdrop-blur">
          <div className="flex justify-between text-sm"><span className="font-semibold">Your progress</span><span className="text-muted-foreground">{doneSteps.size} of {total} steps</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brass transition-all" style={{ width: `${(doneSteps.size / total) * 100}%` }} /></div>
        </div>

        <h2 className="mt-12 font-serif text-3xl">Set up</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6">{x.setup.map((s) => <li key={s}>{s}</li>)}</ol>

        <h2 className="mt-12 font-serif text-3xl">Steps</h2>
        <ol className="relative mt-6 space-y-4 border-l-2 border-border pl-9">
          {part.project.steps.map((s, i) => {
            const on = doneSteps.has(i);
            return (
              <li key={i} className="relative">
                <button onClick={() => toggleStep(x.slug, i)} aria-pressed={on} aria-label={`Mark step ${i + 1} ${on ? "not done" : "done"}`} className={`absolute -left-[3.05rem] top-4 flex size-8 items-center justify-center rounded-full border-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-brass bg-background text-accent hover:bg-secondary"}`}>
                  {on ? <Check className="size-4" /> : i + 1}
                </button>
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${on ? "border-primary/30 bg-secondary/50" : "border-border bg-card hover:border-primary"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggleStep(x.slug, i)} className="mt-1.5 size-4 accent-[var(--primary)]" />
                  <span className={on ? "text-muted-foreground line-through" : ""}>{s}</span>
                </label>
              </li>
            );
          })}
        </ol>
        {doneSteps.size === total && <p className="mt-6 rounded-xl bg-primary p-5 font-serif text-xl text-primary-foreground">Project complete. Well done.</p>}

        <h2 className="mt-14 font-serif text-3xl">Code and templates</h2>
        <div className="mt-6 space-y-8">
          {x.code.map((c) => (
            <div key={c.title}>
              <div className="flex items-baseline justify-between"><h3 className="font-serif text-xl">{c.title}</h3><span className="text-xs uppercase tracking-widest text-muted-foreground">{c.lang}</span></div>
              <div className="relative mt-2">
                <pre className="lesson-code"><code>{c.body}</code></pre>
                <button onClick={() => navigator.clipboard?.writeText(c.body)} className="absolute right-2 top-2 rounded border border-sidebar-border px-2 py-0.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent">Copy</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-between gap-4 border-t border-border pt-8 text-sm font-semibold text-primary">
          {prev ? <Link to="/projects/$slug" params={{ slug: projectSlug(prev.number) }} className="inline-flex items-center gap-2"><ArrowLeft className="size-4" />Project {prev.number}</Link> : <span />}
          {next ? <Link to="/projects/$slug" params={{ slug: projectSlug(next.number) }} className="inline-flex items-center gap-2">Project {next.number}<ArrowRight className="size-4" /></Link> : <Link to="/curriculum">Back to curriculum</Link>}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
