import { createFileRoute, Link } from "@tanstack/react-router";
import { appendices } from "@/content/extras";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/reference")({
  head: () => ({ meta: [
    { title: "Reference — Software Foundations" },
    { name: "description", content: "Quick-reference guides: project files, Git commands, HTTP and SQL, templates, checklists and further study." },
    { property: "og:title", content: "Reference — Software Foundations" },
    { property: "og:description", content: "Cheat sheets, templates and checklists for AI builders." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RefIndex,
});

function RefIndex() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="font-serif text-5xl">Reference</h1>
        <p className="mt-3 text-muted-foreground">Cheat sheets to keep open while you build.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {appendices.map((a) => (
            <Link key={a.slug} to="/reference/$slug" params={{ slug: a.slug }} className="rounded-xl border border-border bg-card p-6 transition hover:border-primary">
              <span className="font-serif text-4xl text-accent">{a.letter}</span>
              <p className="mt-2 font-semibold">{a.title}</p>
              {a.intro && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.intro}</p>}
            </Link>
          ))}
          <Link to="/bibliography" className="rounded-xl border border-border bg-card p-6 transition hover:border-primary">
            <span className="font-serif text-4xl text-accent">✦</span>
            <p className="mt-2 font-semibold">Bibliography</p>
            <p className="mt-1 text-sm text-muted-foreground">Every source the course draws on.</p>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
