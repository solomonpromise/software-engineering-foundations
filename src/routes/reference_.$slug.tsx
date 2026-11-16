import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { appendices } from "@/content/extras";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { SectionBlock } from "@/components/Prose";

export const Route = createFileRoute("/reference_/$slug")({
  loader: ({ params }) => {
    const a = appendices.find((x) => x.slug === params.slug);
    if (!a) throw notFound();
    return a;
  },
  head: ({ loaderData }) => {
    const t = `${loaderData ? `Appendix ${loaderData.letter}: ${loaderData.title}` : "Reference"} — Software Engineering Foundations`;
    const d = loaderData?.intro ?? "Quick reference for AI builders.";
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: AppendixView,
});

function AppendixView() {
  const a = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-5 py-16">
        <Link to="/reference" className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Reference · Appendix {a.letter}</Link>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">{a.title}</h1>
        {a.intro && <p className="mt-4 text-lg text-muted-foreground">{a.intro}</p>}
        <div className="lesson-prose mt-6">{a.sections.map((s) => <SectionBlock key={s.heading} s={s} />)}</div>
      </article>
      <SiteFooter />
    </div>
  );
}
