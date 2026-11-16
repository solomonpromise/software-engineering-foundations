import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, AppWindow, Workflow, ClipboardList, Network, Bot, Rocket } from "lucide-react";
import { absoluteUrl, project } from "@/config/community";
import shareImg from "@/assets/course-share.jpg";

const SHARE_IMAGE = absoluteUrl(shareImg);
import heroImg from "@/assets/landing-hero.jpg";

const conceptIcons = [AppWindow, Workflow, ClipboardList, Network, Bot, Rocket];
import { useProgress } from "@/lib/progress";
import { parts, chapters } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { useReaderStats } from "@/lib/engagement/reader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Software Engineering Foundations — For the AI Building Era" },
      { name: "description", content: "An open learning resource helping people understand the principles, concepts and practices of software engineering required to build reliable software with AI." },
      { property: "og:title", content: "Software Engineering Foundations — For the AI Building Era" },
      { property: "og:description", content: "Free to learn, open to contributions: the software engineering foundations you need to build reliable software with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
  }),
  component: Home,
});

function Home() {
  const first = chapters[0];
  const { done, last } = useProgress();
  const doneSet = new Set(done);
  const resume = chapters.find((c) => c.slug === last && !doneSet.has(c.slug)) ?? chapters.find((c) => !doneSet.has(c.slug));
  const started = done.length > 0 || !!last;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img src={heroImg} alt="A builder planning an app's frontend, backend and database in a notebook beside a laptop with an AI assistant" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 md:pb-32 md:pt-28">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brass">Free and open · No experience needed<ReaderTotal /></p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
            You can build apps with AI. <span className="italic text-brass">Now understand them.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
            {chapters.length} plain-language lessons that take you from your first idea to a live, maintained product — so you can judge what AI builds for you, not just hope it works.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {first && (
              <Link to="/learn/$slug" params={{ slug: (started && resume ? resume : first).slug }} className="inline-flex items-center gap-2 rounded-full bg-brass px-7 py-4 font-semibold text-primary transition hover:gap-4">
                {started && resume ? `Continue · Lesson ${resume.number}` : "Start lesson 1"} <ArrowRight className="size-4" />
              </Link>
            )}
            <Link to="/start/$slug" params={{ slug: "about" }} className="rounded-full border border-primary-foreground/40 px-7 py-4 font-semibold hover:bg-primary-foreground/10">How the course works</Link>
          </div>
          {started && <p className="mt-6 text-sm text-primary-foreground/70">{done.length} of {chapters.length} lessons finished</p>}
        </div>
      </section>



      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">What you'll understand</p>
        <h2 className="mt-3 max-w-2xl font-serif text-4xl">Six ideas every builder needs before trusting AI with their product.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p, i) => {
            const Icon = conceptIcons[i] ?? Layers;
            return (
              <Link key={p.number} to="/curriculum" hash={`part-${p.number}`} className="group bg-card p-7 transition hover:bg-secondary/50">
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-accent" />
                  <span className="font-serif text-3xl text-brass">0{p.number}</span>
                </div>
                <h3 className="mt-5 font-serif text-2xl group-hover:text-primary">{p.title}</h3>
                <p className="mt-2 italic text-muted-foreground">{p.question}</p>
                <p className="mt-4 text-sm text-muted-foreground">{p.chapters.length} lessons · Project: {p.project.title}</p>
              </Link>
            );
          })}
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[["Plain language","Every idea explained without jargon, with everyday examples."],["Learn by building","Each part ends with a hands-on project you can do with AI."],["Ask the tutor","Stuck? Ask questions about any lesson and get answers grounded in it."]].map(([t,d]) => (
            <div key={t} className="border-t-2 border-brass pt-4"><h3 className="font-serif text-xl">{t}</h3><p className="mt-1 text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>

      <section aria-labelledby="open-resource" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">An open learning resource</p>
            <h2 id="open-resource" className="mt-3 font-serif text-4xl">Built in the open, improved by the community.</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">{project.description} Software engineers, AI engineers, educators and learners can review lessons, suggest topics, recommend resources and report errors.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/contribute" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:gap-3">Contribute <ArrowRight className="size-4" /></Link>
              <Link to="/roadmap" className="inline-flex items-center rounded-full border border-border px-6 py-3 font-semibold hover:border-primary hover:text-primary">See the roadmap</Link>
            </div>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border text-sm">
            {[["Free to learn","Every lesson, project and reference page, with no paywall."],["Open to contributions","Anyone can propose improvements; maintainers review every change."],["Continuously evolving","Lessons are revisited as tools and good practice change."]].map(([t,d]) => (
              <li key={t} className="bg-card p-5"><p className="font-serif text-xl">{t}</p><p className="mt-1 text-muted-foreground">{d}</p></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-14">
          <div><h2 className="font-serif text-3xl">Ready to see every lesson?</h2><p className="mt-1 text-muted-foreground">All {chapters.length} lessons, grouped into six parts, with your progress.</p></div>
          <Link to="/curriculum" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground transition hover:gap-4">View the curriculum <ArrowRight className="size-4" /></Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

/** " · 1,284 readers" in the hero's top line, once there are readers to count. */
function ReaderTotal() {
  const stats = useReaderStats();
  if (!stats || stats.readers < 1) return null;
  return <> · {stats.readers.toLocaleString("en")} {stats.readers === 1 ? "reader" : "readers"}</>;
}
