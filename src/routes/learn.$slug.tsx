import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { findChapter } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

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

function Check({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium">{q}</p>
      <button onClick={() => setOpen(!open)} className="mt-2 text-sm font-semibold text-primary">{open ? "Hide answer" : "Show answer"}</button>
      {open && <p className="mt-2 text-muted-foreground">{a}</p>}
    </li>
  );
}

function Lesson() {
  const { chapter: c, prev, next } = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 py-16">
        <Link to="/" hash="curriculum" className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {c.part.number} · {c.part.title}</Link>
        <p className="mt-6 font-serif text-7xl text-primary/20">{String(c.number).padStart(2, "0")}</p>
        <h1 className="font-serif text-4xl leading-tight md:text-5xl">{c.title}</h1>
        <p className="mt-6 border-l-4 border-accent pl-5 font-serif text-xl italic">{c.question}</p>

        <div className="lesson-prose mt-10">
          {c.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p, i) => <Para key={i} text={p} />)}
              {s.bullets && s.bullets.length > 0 && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
            </section>
          ))}
        </div>

        <div className="mt-12 space-y-6">
          <Box tone="key" label="Key idea"><p className="font-serif text-xl">{c.keyIdea}</p></Box>
          <Box tone="taskboard" label="In Taskboard"><p>{c.taskboard}</p></Box>
          <Box tone="walk" label={`Walkthrough · ${c.walkthrough.title}`}>
            <ol className="list-decimal space-y-2 pl-5">{c.walkthrough.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </Box>
          <div className="grid gap-6 md:grid-cols-2">
            <Box tone="mistake" label="Common mistakes"><ul className="list-disc space-y-2 pl-5">{c.mistakes.map((m) => <li key={m}>{m}</li>)}</ul></Box>
            <Box tone="ai" label="When AI gets it wrong"><ul className="list-disc space-y-2 pl-5">{c.aiMistakes.map((m) => <li key={m}>{m}</li>)}</ul></Box>
          </div>
          <Box tone="walk" label="Try it yourself"><ol className="list-decimal space-y-2 pl-5">{c.tryIt.map((t) => <li key={t}>{t}</li>)}</ol></Box>
        </div>

        <h2 className="mt-14 font-serif text-3xl">Check your understanding</h2>
        <ul className="mt-6 space-y-3">{c.check.map((x) => <Check key={x.q} {...x} />)}</ul>

        <nav className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
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
      <SiteFooter />
    </div>
  );
}
