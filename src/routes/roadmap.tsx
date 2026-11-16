import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { roadmapPhases } from "@/content/community";
import { project } from "@/config/community";

export const Route = createFileRoute("/roadmap")({
  head: () => {
    const t = `Project roadmap — ${project.name}`;
    const d =
      "Where Software Engineering Foundations is going: from the initial release to community contributions, learning expansion and continuous improvement.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Roadmap,
});

function Roadmap() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Project roadmap</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">Where We Are Going</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          The direction we&rsquo;re taking this open resource, phase by phase. It is a direction,
          not a promise of fixed delivery dates: priorities will shift with community feedback and
          contributions.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Looking for the order to study the lessons in? See the{" "}
          <Link
            to="/start/$slug"
            params={{ slug: "roadmap" }}
            className="text-primary underline underline-offset-4"
          >
            course learning path
          </Link>
          .
        </p>

        <ol className="relative mt-12 space-y-10 border-l-2 border-border pl-8 md:pl-10">
          {roadmapPhases.map((p) => {
            const done = p.status === "Done";
            const now = p.status === "In progress";
            return (
              <li key={p.number} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[2.8rem] top-1 flex size-6 items-center justify-center rounded-full border-2 md:-left-[3.3rem] ${
                    done
                      ? "border-primary bg-primary"
                      : now
                        ? "border-brass bg-background"
                        : "border-border bg-background"
                  }`}
                >
                  {now && <span className="size-2 rounded-full bg-brass" />}
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Phase {p.number}
                  </p>
                  {p.status && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        done
                          ? "bg-secondary text-secondary-foreground"
                          : "border border-brass text-foreground"
                      }`}
                    >
                      {p.status}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-serif text-2xl md:text-3xl">{p.title}</h2>
                <ul className="mt-3 space-y-1.5 text-muted-foreground">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brass"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
          <div>
            <h2 className="font-serif text-2xl">Want to shape what comes next?</h2>
            <p className="mt-1 text-muted-foreground">
              Suggest topics, review lessons, or help build the platform.
            </p>
          </div>
          <Link
            to="/contribute"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Contribute <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
