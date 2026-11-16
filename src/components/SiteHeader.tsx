import { Link, useRouterState } from "@tanstack/react-router";
import { Github, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppearanceMenu } from "@/components/AppearanceMenu";
import { SiteSearch } from "@/components/SiteSearch";
import { AccountButton } from "@/components/AccountButton";
import logoUrl from "@/assets/course-logo.png";
import { githubLinks, licenses, project } from "@/config/community";

const links = [
  {
    to: "/curriculum",
    label: "Learn",
    match: ["/curriculum", "/learn", "/projects", "/start", "/certificate"],
  },
  { to: "/reference", label: "Reference", match: ["/reference", "/glossary", "/bibliography"] },
  { to: "/taskboard", label: "Taskboard", match: ["/taskboard"] },
  { to: "/roadmap", label: "Roadmap", match: ["/roadmap"] },
  { to: "/contribute", label: "Contribute", match: ["/contribute"] },
  { to: "/about", label: "About", match: ["/about"] },
] as const;

function GitHubIconLink({ className = "" }: { className?: string }) {
  if (!githubLinks.repo) return null;
  return (
    <a
      href={githubLinks.repo}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub repository (opens in a new tab)"
      title="GitHub repository"
      className={`size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15 ${className || "flex"}`}
    >
      <Github className="size-4" />
    </a>
  );
}

function Wordmark() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-header-accent text-header ring-1 ring-header-foreground/25 sm:size-11">
        <img src={logoUrl} alt="" className="size-8 sm:size-9" />
      </span>
      <span className="min-w-0 leading-none">
        <span className="block font-serif text-base leading-tight sm:text-xl">{project.name}</span>
        <span className="mt-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-header-muted sm:block">
          {project.descriptor}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = useRouterState({ select: (s) => s.location.href });
  useEffect(() => setOpen(false), [href]);
  const isActive = (ms: readonly string[]) =>
    ms.some((m) => pathname === m || pathname.startsWith(m + "/"));
  return (
    <header className="site-header sticky top-0 z-30">
      {pathname.startsWith("/learn/") && (
        <a
          href="#lesson-content"
          className="sr-only fixed left-4 top-3 z-50 rounded-md bg-background px-4 py-2 font-semibold text-foreground focus:not-sr-only"
        >
          Skip to lesson content
        </a>
      )}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = isActive(l.match);
            return (
              <Link
                key={l.label}
                to={l.to}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active
                    ? "bg-header-accent/20 text-header-foreground"
                    : "text-header-muted hover:bg-header-accent/10 hover:text-header-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <SiteSearch hotkey />
          <GitHubIconLink className="hidden xl:flex" />
          <AppearanceMenu />
          <AccountButton />
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:hidden">
          <SiteSearch />
          <AppearanceMenu />
          <span className="hidden sm:block">
            <AccountButton />
          </span>
          <button
            className="flex size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-header-border px-5 pb-5 lg:hidden"
        >
          {links.map((l) => {
            const active = isActive(l.match);
            return (
              <Link
                key={l.label}
                to={l.to}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block border-b border-header-border py-3 font-medium ${
                  active ? "text-header-accent" : "text-header-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {githubLinks.repo && (
            <a
              href={githubLinks.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border-b border-header-border py-3 font-medium text-header-foreground"
            >
              <Github className="size-4" aria-hidden /> GitHub
            </a>
          )}
          <div className="flex items-center justify-between pt-4 sm:hidden">
            <span className="text-sm text-header-muted">Your account</span>
            <AccountButton />
          </div>
        </nav>
      )}
    </header>
  );
}

const footerGroups = [
  {
    title: "Learn",
    links: [
      { to: "/start/$slug", params: { slug: "about" }, label: "Start here" },
      { to: "/curriculum", label: "Curriculum" },
      { to: "/glossary", label: "Glossary" },
      { to: "/reference", label: "Reference" },
      { to: "/bibliography", label: "Bibliography" },
      { to: "/taskboard", label: "Taskboard" },
    ],
  },
  {
    title: "Community",
    links: [
      { to: "/contribute", label: "Contribute" },
      { to: "/contribute", hash: "feedback", label: "Send feedback" },
      { to: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Project",
    links: [
      { to: "/about", label: "About the project" },
      { to: "/about", hash: "principles", label: "Community principles" },
      { to: "/about/maintainer", label: "Founding maintainer" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl text-foreground">{project.name}</p>
          <p className="mt-1 text-muted-foreground">
            {project.descriptor}. Free to learn, open to contributions.
          </p>
          {githubLinks.repo && (
            <a
              href={githubLinks.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Github className="size-4" aria-hidden /> GitHub
            </a>
          )}
        </div>
        {footerGroups.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="font-semibold text-foreground">{g.title}</p>
            <ul className="mt-3 space-y-2">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    {...("params" in l ? { params: l.params } : {})}
                    {...("hash" in l ? { hash: l.hash } : {})}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs leading-relaxed text-muted-foreground">
          Course content by {project.founder.name} and contributors, licensed{" "}
          <a
            href={licenses.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {licenses.content.name}
          </a>
          . Code licensed{" "}
          <a
            href={licenses.code.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {licenses.code.name}
          </a>
          . Based on <em>{project.book.title}</em> by {project.book.author}.
        </p>
      </div>
    </footer>
  );
}
