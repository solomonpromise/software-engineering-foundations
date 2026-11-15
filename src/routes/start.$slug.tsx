import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { introPages } from "@/content/extras";
import { chapters, parts } from "@/content/lessons";
import { Flag, Check } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { SectionBlock } from "@/components/Prose";

export const Route = createFileRoute("/start/$slug")({
  loader: ({ params }) => {
    const i = introPages.findIndex((p) => p.slug === params.slug);
    if (i < 0) throw notFound();
    return { page: introPages[i]!, next: introPages[i + 1] };
  },
  head: ({ loaderData }) => {
    const t = `${loaderData?.page.title ?? "Start here"} — Software Foundations`;
    const first = loaderData?.page.sections.find((s) => s.paragraphs?.length)?.paragraphs?.[0] ?? "";
    const clean = first.replace(/\s+/g, " ").trim();
    const d = clean ? (clean.length > 155 ? clean.slice(0, clean.lastIndexOf(" ", 152)) + "…" : clean) : `${loaderData?.page.title ?? "Start here"}: an introduction to the free Software Foundations course.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: IntroView,
});

function IntroView() {
  const { page, next } = Route.useLoaderData();
  const first = chapters[0];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Start here</p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {introPages.map((p) => (
            <Link key={p.slug} to="/start/$slug" params={{ slug: p.slug }} className="rounded-full border border-border px-3 py-1 text-sm" activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}>{p.title}</Link>
          ))}
        </nav>
        <h1 className="mt-8 font-serif text-4xl md:text-5xl">{page.title}</h1>
        {page.slug === "roadmap" ? <Roadmap sections={page.sections} /> : <div className="lesson-prose mt-6">{page.sections.map((s) => <SectionBlock key={s.heading} s={s} />)}</div>}
        <div className="mt-14 border-t border-border pt-8">
          {next ? (
            <Link to="/start/$slug" params={{ slug: next.slug }} className="inline-flex items-center gap-2 font-semibold text-primary">Next: {next.title} <ArrowRight className="size-4" /></Link>
          ) : first && (
            <Link to="/learn/$slug" params={{ slug: first.slug }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Begin lesson 1 <ArrowRight className="size-4" /></Link>
          )}
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}

function Roadmap({ sections }: { sections: { heading: string; paragraphs?: string[] }[] }) {
  const { done } = useProgress();
  const doneSet = new Set(done);
  const closing = sections.find((s) => !s.heading.startsWith("Part"));
  return (
    <div className="mt-8">
      <p className="text-lg text-muted-foreground">Six stages take you from an idea to a live, maintained product. Each stage builds on the one before and ends with a project.</p>
      <ol className="relative mt-12 space-y-10 border-l-2 border-border pl-10">
        {parts.map((p) => {
          const sec = sections.find((s) => s.heading.startsWith(`Part ${p.number}`));
          const [about, outcome] = sec?.paragraphs ?? [];
          const n = p.chapters.filter((c) => doneSet.has(c.slug)).length;
          const complete = n === p.chapters.length;
          return (
            <li key={p.number} className="relative">
              <span className={`absolute -left-[3.2rem] top-0 flex size-10 items-center justify-center rounded-full border-2 font-serif text-lg ${complete ? "border-primary bg-primary text-primary-foreground" : "border-brass bg-background text-accent"}`}>
                {complete ? <Check className="size-5" /> : p.number}
              </span>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {p.number} · Lessons {p.chapters[0]?.number}–{p.chapters[p.chapters.length - 1]?.number}</p>
                  <p className="text-xs text-muted-foreground">{n} of {p.chapters.length} finished</p>
                </div>
                <h2 className="mt-2 font-serif text-2xl">{p.title}</h2>
                <p className="mt-1 italic text-muted-foreground">{p.question}</p>
                {about && <p className="mt-4">{about}</p>}
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brass" style={{ width: `${(n / p.chapters.length) * 100}%` }} /></div>
                <div className="mt-5 flex gap-3 rounded-lg bg-secondary/60 p-4">
                  <Flag className="mt-1 size-4 shrink-0 text-accent" />
                  <div><p className="font-semibold">Project: {p.project.title}</p>{outcome && <p className="text-sm text-muted-foreground">{outcome.replace(/^Practical outcome:\s*/, "")}</p>}</div>
                </div>
                {p.chapters[0] && <Link to="/learn/$slug" params={{ slug: p.chapters[0].slug }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3">Start part {p.number} <ArrowRight className="size-4" /></Link>}
              </div>
            </li>
          );
        })}
      </ol>
      {closing && <div className="mt-12 rounded-xl bg-primary p-6 text-primary-foreground"><h2 className="font-serif text-2xl">{closing.heading}</h2>{closing.paragraphs?.map((t) => <p key={t} className="mt-2 text-primary-foreground/85">{t}</p>)}</div>}
    </div>
  );
}
