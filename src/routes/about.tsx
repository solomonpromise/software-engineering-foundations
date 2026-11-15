import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github, Linkedin, Mail, Globe } from "lucide-react";
import portrait from "@/assets/creator-portrait.jpg.asset.json";
import { chapters } from "@/content/lessons";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

const SITE = "https://softwareengineeringfoundations.lovable.app";
const PORTRAIT_URL = `${SITE}${portrait.url}`;

const stats = [
  { value: "1,000+", label: "learners trained across Nigeria, the US, India and South Africa" },
  { value: "4+", label: "years teaching data science, machine learning and AI" },
  { value: "4.6/5", label: "average learner rating" },
  { value: "2,804", label: "health facilities covered by one of his readiness dashboards" },
];

const roles = [
  { org: "Synterra Digital", when: "Now", title: "Data Scientist, Full-Stack AI Engineering & Application Development", note: "Builds the dashboards and decision-support tools public-health programmes in Nigeria use to see what is working — from national primary health care performance to zero-dose immunisation." },
  { org: "Simplilearn", when: "Now", title: "Instructor, Data Science, Machine Learning & Deep Learning", note: "Teaches live workshops and recorded sessions, from first LLM apps to machine-learning career roads." },
  { org: "AfriTech Digital Hub", when: "Now", title: "Co-founder", note: "An EdTech company building structured, age-appropriate technology education for African learners, so children grow up creating with technology, not just consuming it." },
  { org: "Omdena Ibadan", when: "Jun 2024 – May 2025", title: "Chapter Lead", note: "Led an AI-powered traffic management project built with contributors from around the world." },
  { org: "Univelcity", when: "", title: "Machine learning & data analysis trainer", note: "" },
  { org: "Seedbuilders", when: "", title: "Tech mentor", note: "" },
];

const links = [
  { label: "GitHub", href: "https://github.com/solomonpromise", icon: Github, handle: "solomonpromise" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/solomon-promise-etiyeme/", icon: Linkedin, handle: "in/solomon-promise-etiyeme" },
  { label: "Email", href: "mailto:solomonpromise51@gmail.com?subject=Let%E2%80%99s%20talk", icon: Mail, handle: "solomonpromise51@gmail.com" },
  { label: "Portfolio", href: "https://solomon-promise.lovable.app", icon: Globe, handle: "solomon-promise.lovable.app" },
];

export const Route = createFileRoute("/about")({
  head: () => {
    const t = "About the creator — Software Foundations";
    const d = "Solomon E. Promise builds AI and data products and teaches people to build them. He wrote Software Foundations for Vibe Coders so builders without an engineering background can judge what AI makes for them.";
    return { meta: [
      { title: t },
      { name: "description", content: d },
      { property: "og:title", content: t },
      { property: "og:description", content: d },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: PORTRAIT_URL },
      { name: "twitter:image", content: PORTRAIT_URL },
    ] };
  },
  component: About,
});

function About() {
  const first = chapters[0];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-5 py-16">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_15rem]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">About the creator</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] md:text-6xl">Solomon E. Promise</h1>
            <p className="mt-4 text-lg italic text-muted-foreground">AI engineer &amp; educator · I build, I teach, I keep learning.</p>
            <p className="mt-5 max-w-xl text-lg">
              I build AI and data products, and teach people to build them. From public-health systems to
              classrooms, my work is about expanding what people can do with technology.
            </p>
          </div>
          <figure className="justify-self-center">
            <div className="rounded-xl border border-brass/60 bg-card p-2 shadow-md">
              <img src={portrait.url} alt="Solomon E. Promise" width={880} height={1100} className="w-full rounded-lg" />
            </div>
            <figcaption className="mt-2 text-center text-xs text-muted-foreground">Solomon E. Promise</figcaption>
          </figure>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="bg-card p-5">
              <p className="font-serif text-3xl text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="lesson-prose mt-14">
          <h2>Why this course exists</h2>
          <p>
            AI coding tools have changed who can build software. You can describe an idea in plain language and,
            minutes later, have something that looks like a working application. That is genuinely exciting, and it
            is also where many new builders get stuck: an application that looks finished is not the same as one
            that is finished.
          </p>
          <p>
            Behind every screen there are decisions about where data is stored, who is allowed to see it, what
            happens when something fails, and how the application will be updated next month without breaking. AI
            tools make those decisions for you whenever you don&rsquo;t make them yourself, and they don&rsquo;t always
            make good ones. This course gives you the foundations to take those decisions back.
          </p>
          <p>
            I teach this material to learners in several countries, and the same question keeps coming up: it works
            on my machine, so what now? The lessons here follow one small application, Taskboard, from the first
            idea to a live, maintained product, so every idea arrives attached to something you can open and
            inspect.
          </p>
        </div>

        <h2 className="mt-14 font-serif text-3xl">Where I work</h2>
        <ol className="relative mt-6 space-y-6 border-l-2 border-border pl-9">
          {roles.map((r) => (
            <li key={r.org + r.title} className="relative">
              <span className="absolute -left-[2.6rem] top-2 size-3 rounded-full border-2 border-brass bg-background" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-serif text-xl">{r.org}</p>
                {r.when && <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{r.when}</p>}
              </div>
              <p className="text-sm font-semibold text-muted-foreground">{r.title}</p>
              {r.note && <p className="mt-1 max-w-2xl text-muted-foreground">{r.note}</p>}
            </li>
          ))}
        </ol>

        <blockquote className="mt-14 rounded-xl border-l-4 border-brass bg-card p-6">
          <p className="font-serif text-2xl italic leading-snug">
            &ldquo;I believe Africa&rsquo;s future belongs to those who can learn, build, and lead with technology.&rdquo;
          </p>
        </blockquote>

        <h2 className="mt-14 font-serif text-3xl">Say hello</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <l.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold group-hover:text-primary">{l.label}</span>
                <span className="block truncate text-sm text-muted-foreground">{l.handle}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          {first && (
            <Link to="/learn/$slug" params={{ slug: first.slug }} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:gap-4">
              Start lesson 1 <ArrowRight className="size-4" />
            </Link>
          )}
          <Link to="/curriculum" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:bg-secondary">
            See the curriculum <ArrowRight className="size-4" />
          </Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
