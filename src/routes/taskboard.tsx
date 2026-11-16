import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, ExternalLink, Laptop, Cloud } from "lucide-react";
import { chapters, parts } from "@/content/lessons";
import { REPO, lessonRepo, linkHref } from "@/content/taskboard";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/taskboard")({
  head: () => ({
    meta: [
      { title: "Run Taskboard — Software Engineering Foundations" },
      { name: "description", content: "Run the real Taskboard app from the course in one click, and see exactly where every lesson lives in its code." },
      { property: "og:title", content: "Run Taskboard — Software Engineering Foundations" },
      { property: "og:description", content: "The course's companion app: FastAPI + React, tested, documented, and mapped lesson by lesson." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskboardPage,
});

const CODESPACES = "https://codespaces.new/solomonpromise/taskboard?quickstart=1";
const LOCAL = `git clone ${REPO}.git && cd taskboard
make install     # backend + frontend packages, creates backend/.env
make migrate     # creates the local SQLite database
make dev         # open http://localhost:5173`;
const IN_CLOUD = `make install && make migrate && make dev
# Codespaces opens the forwarded port 5173 for you`;

function CodeBox({ body }: { body: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-3">
      <pre className="lesson-code"><code>{body}</code></pre>
      <button onClick={() => { navigator.clipboard?.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-sidebar-border px-2 py-0.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent">
        {copied ? <><Check className="size-3" />Copied</> : <><Copy className="size-3" />Copy</>}
      </button>
    </div>
  );
}

function TaskboardPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">The course's companion app</p>
        <h1 className="mt-2 font-serif text-5xl">Taskboard</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">A simple, reliable task tracker built with FastAPI and React. Every idea in the course — the data model, API, sign-in, tests, deployment and backups — exists in it as real, working code.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 [&>*]:min-w-0">
          <div className="rounded-2xl border border-brass bg-card p-6 shadow-sm">
            <Cloud className="size-6 text-accent" />
            <h2 className="mt-3 font-serif text-2xl">Run it in your browser</h2>
            <p className="mt-1 text-sm text-muted-foreground">Opens the real project in GitHub Codespaces — a ready computer in the cloud. Needs a free GitHub account; nothing to install.</p>
            <a href={CODESPACES} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Open in Codespaces <ExternalLink className="size-4" /></a>
            <p className="mt-4 text-sm">When it opens, run this in the terminal at the bottom:</p>
            <CodeBox body={IN_CLOUD} />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Laptop className="size-6 text-accent" />
            <h2 className="mt-3 font-serif text-2xl">Run it on your computer</h2>
            <p className="mt-1 text-sm text-muted-foreground">Needs Python 3.12+, Node.js 20+ and Git. Free, no accounts.</p>
            <CodeBox body={LOCAL} />
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline">View on GitHub <ExternalLink className="size-3.5" /></a>
          </div>
        </div>

        <h2 className="mt-16 font-serif text-4xl">Where each lesson lives in the code</h2>
        <p className="mt-2 text-muted-foreground">Taken from the project's own <a href={`${REPO}/blob/main/docs/book-map.md`} target="_blank" rel="noopener noreferrer" className="text-accent underline">book map</a>. Read a lesson, then open its files.</p>
        <div className="mt-8 space-y-10">
          {parts.map((p) => (
            <section key={p.number}>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Part {p.number} · {p.title}</h3>
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {p.chapters.map((c) => {
                  const m = lessonRepo[c.number];
                  return (
                    <li key={c.slug} className="grid gap-2 px-4 py-3 md:grid-cols-[240px_1fr]">
                      <Link to="/learn/$slug" params={{ slug: c.slug }} className="font-serif text-lg hover:text-primary"><span className="text-muted-foreground">{c.number}.</span> {c.title}</Link>
                      <div>
                        {m && <p className="text-sm text-muted-foreground">{m.note}</p>}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">{m?.links.map((l) => <a key={l.label + l.path} href={linkHref(l)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs hover:border-primary hover:text-primary">{l.label || "repository"} ↗</a>)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">{chapters.length} lessons mapped to the real code.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
