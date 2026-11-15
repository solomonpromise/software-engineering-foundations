import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AppearanceMenu } from "@/components/AppearanceMenu";
import { SiteSearch } from "@/components/SiteSearch";
import { AccountButton } from "@/components/AccountButton";
import logoAsset from "@/assets/course-logo.png.asset.json";

const links = [
  { to: "/start/$slug", params: { slug: "about" }, label: "Start here", match: "/start" },
  { to: "/curriculum", label: "Curriculum", match: "/curriculum" },
  { to: "/reference", label: "Reference", match: "/reference" },
  { to: "/glossary", label: "Glossary", match: "/glossary" },
  { to: "/taskboard", label: "Taskboard", match: "/taskboard" },
  { to: "/about", label: "About", match: "/about" },
] as const;

function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-header-accent text-header ring-1 ring-header-foreground/25">
        <img src={logoAsset.url} alt="" className="size-9" />
      </span>
      <span className="leading-none">
        <span className="block font-serif text-xl">Software Foundations</span>
        <span className="mt-1.5 block text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-header-muted">
          for vibe coders
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (m: string) => pathname === m || pathname.startsWith(m + "/");
  return (
    <header className="site-header sticky top-0 z-30">
      {pathname.startsWith("/learn/") && <a href="#lesson-content" className="sr-only fixed left-4 top-3 z-50 rounded-md bg-background px-4 py-2 font-semibold text-foreground focus:not-sr-only">Skip to lesson content</a>}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const { match, ...rest } = l;
            const active = isActive(match);
            return (
              <Link
                key={l.label}
                {...(rest as any)}
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
          <AppearanceMenu />
          <AccountButton />
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <SiteSearch />
          <AppearanceMenu />
          <AccountButton />
          <button
            className="flex size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-header-border px-5 pb-5 md:hidden">
          {links.map((l) => {
            const { match, ...rest } = l;
            const active = isActive(match);
            return (
              <Link
                key={l.label}
                {...(rest as any)}
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
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
      Free to learn, forever. Based on <em>Software Foundations for Vibe Coders</em> by{" "}
      <Link to="/about" className="underline underline-offset-2 hover:text-foreground">Solomon Promise</Link>.
    </footer>
  );
}
