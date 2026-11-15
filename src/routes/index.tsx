import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 md:pt-28">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Free course · No experience needed</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[1.05] md:text-7xl">
          You can build apps with AI. <span className="italic text-primary">Now understand them.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          {chapters.length || 34} plain-language lessons that take you from your first idea to a live, maintained product — so you can judge what AI builds for you, not just hope it works.
        </p>
        {first && (
          <Link to="/learn/$slug" params={{ slug: first.slug }} className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:gap-4">
            Start lesson 1 <ArrowRight className="size-4" />
          </Link>
        )}
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
                          <span className="w-8 font-mono text-xs text-muted-foreground">{String(c.number).padStart(2, "0")}</span>
                          <span className="flex-1 font-medium group-hover:text-primary">{c.title}</span>
                          <ArrowRight className="size-4 opacity-0 transition group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm"><span className="font-semibold text-accent">Project:</span> {p.project.title}</p>
                </div>
              </div>
            ))}
            {parts.length === 0 && <p className="text-muted-foreground">Lessons are being prepared…</p>}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
