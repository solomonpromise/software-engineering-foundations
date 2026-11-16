import { createFileRoute } from "@tanstack/react-router";
import { bibliography } from "@/content/extras";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/bibliography")({
  head: () => ({ meta: [
    { title: "Bibliography — Software Engineering Foundations" },
    { name: "description", content: "The books, standards and articles behind Software Engineering Foundations." },
    { property: "og:title", content: "Bibliography — Software Engineering Foundations" },
    { property: "og:description", content: "Sources and further reading for the course." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Bib,
});

function Bib() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-serif text-5xl">Bibliography</h1>
        {bibliography.map((g, i) => (
          <section key={i} className="mt-10">
            {g.group && <h2 className="font-serif text-2xl">{g.group}</h2>}
            <ul className="mt-4 space-y-3">
              {g.entries.map((e) => <li key={e} className="border-l-2 border-border pl-4 text-muted-foreground">{e}</li>)}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
