import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { introPages } from "@/content/extras";
import { chapters } from "@/content/lessons";
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
    const d = "Start here: how the free Software Foundations course works and how to get the most from it.";
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
        <div className="lesson-prose mt-6">{page.sections.map((s) => <SectionBlock key={s.heading} s={s} />)}</div>
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
