import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { parts } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Glossary — Software Engineering Foundations" },
      { name: "description", content: "Plain-language definitions of every software term used in the course." },
      { property: "og:title", content: "Glossary — Software Engineering Foundations" },
      { property: "og:description", content: "Every software term in the course, explained simply." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Glossary,
});

function Glossary() {
  const [q, setQ] = useState("");
  const terms = parts
    .flatMap((p) => p.glossary.map((g) => ({ ...g, part: p.number })))
    .filter((g) => (g.term + g.definition).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.term.localeCompare(b.term));
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-serif text-5xl">Glossary</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term…" className="mt-8 w-full rounded-lg border border-input bg-card px-4 py-3" />
        <dl className="mt-8 divide-y divide-border">
          {terms.map((t) => (
            <div key={t.term + t.part} className="py-4">
              <dt className="font-semibold">{t.term} <span className="ml-2 text-xs font-normal text-muted-foreground">Part {t.part}</span></dt>
              <dd className="mt-1 text-muted-foreground">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </main>
      <SiteFooter />
    </div>
  );
}
