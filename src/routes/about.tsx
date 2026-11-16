import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import portraitUrl from "@/assets/creator-portrait.jpg";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { principles } from "@/content/community";
import { licenses, project } from "@/config/community";

const values = [
  "Free to learn",
  "Open to contributions",
  "Community-driven",
  "Practical and accessible",
  "Grounded in software engineering fundamentals",
  "Continuously evolving",
];

export const Route = createFileRoute("/about")({
  head: () => {
    const t = `About the project — ${project.name}`;
    const d = project.description;
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
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          About the project
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">{project.name}</h1>
        <p className="mt-2 font-serif text-2xl italic text-muted-foreground">
          {project.descriptor}
        </p>
        <p className="mt-6 max-w-2xl text-lg">{project.description}</p>

        <blockquote className="mt-10 border-l-4 border-brass pl-6">
          <p className="font-serif text-2xl italic leading-snug md:text-3xl">
            &ldquo;AI is changing how we build software, but understanding the foundations of
            software engineering remains valuable and indispensable.&rdquo;
          </p>
        </blockquote>

        <div className="lesson-prose mt-10">
          <h2>An open learning resource</h2>
          <p>
            This is not a course published by one person and left alone. It is an open educational
            resource that software engineers, AI engineers, technical educators and AI-assisted
            builders can learn from, contribute to and improve together, as AI keeps changing how
            software is built.
          </p>
          <p>
            The lessons follow one small application, Taskboard, from the first idea to a live,
            maintained product, so every idea arrives attached to something you can open and
            inspect.
          </p>
        </div>

        <ul className="mt-8 flex flex-wrap gap-2" aria-label="What the project stands for">
          {values.map((v) => (
            <li key={v} className="rounded-full border border-border px-3.5 py-1.5 text-sm">
              {v}
            </li>
          ))}
        </ul>

        <section id="principles" aria-labelledby="principles-title" className="mt-16 scroll-mt-24">
          <h2 id="principles-title" className="font-serif text-3xl md:text-4xl">
            Our Community Principles
          </h2>
          <ol className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.title} className="flex gap-4 border-t border-border py-5">
                <span className="font-serif text-2xl leading-none text-brass" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-1 block text-muted-foreground">{p.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="open-title" className="mt-14">
          <h2 id="open-title" className="font-serif text-3xl">
            Open by design
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            The course content is shared under{" "}
            <a
              href={licenses.content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {licenses.content.title}
            </a>
            : you may share and adapt it with credit, for non-commercial purposes, under the same
            terms. The website&rsquo;s code is released under the{" "}
            <a
              href={licenses.code.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {licenses.code.title}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contribute"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground"
            >
              Contribute <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/roadmap"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-6 py-2.5 font-semibold hover:border-primary hover:text-primary"
            >
              See the roadmap
            </Link>
          </div>
        </section>

        <section aria-labelledby="maintainer-title" className="mt-16 border-t border-border pt-10">
          <h2
            id="maintainer-title"
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Founding maintainer
          </h2>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <img
              src={portraitUrl}
              alt={project.founder.name}
              width={80}
              height={100}
              loading="lazy"
              className="h-24 w-20 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="max-w-2xl">
              <p className="font-serif text-2xl">{project.founder.name}</p>
              <p className="mt-2 text-muted-foreground">
                Founded by {project.founder.name}, a Tech Educator passionate about democratising
                access to technology education and helping more people develop the knowledge
                required to build meaningful technology solutions. The project grew out of the book{" "}
                <em>{project.book.title}</em>.
              </p>
              <Link
                to="/about/maintainer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4"
              >
                More about the founding maintainer <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
