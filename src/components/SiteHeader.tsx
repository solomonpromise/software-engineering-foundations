import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useProgress } from "@/lib/progress";
import { chapters } from "@/content/lessons";

const links = [
  { to: "/start/$slug", params: { slug: "about" }, label: "Start here" },
  { to: "/curriculum", label: "Curriculum" },
  { to: "/reference", label: "Reference" },
  { to: "/glossary", label: "Glossary" },
] as const;

export function ProgressRing({ size = 28 }: { size?: number }) {
  const { done } = useProgress();
  const pct = chapters.length ? done.length / chapters.length : 0;
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="text-accent transition-all duration-700" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { done } = useProgress();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link to="/" className="font-serif text-xl">Software Foundations<span className="text-accent">.</span></Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link key={l.label} {...(l as any)} className="hover:text-foreground">{l.label}</Link>
          ))}
          <Link to="/curriculum" className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 hover:border-primary" title="Your progress">
            <ProgressRing /> <span className="font-medium text-foreground">{done.length}/{chapters.length}</span>
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border px-5 pb-5 md:hidden">
          {links.map((l) => (
            <Link key={l.label} {...(l as any)} onClick={() => setOpen(false)} className="block border-b border-border py-3 font-medium">{l.label}</Link>
          ))}
          <p className="flex items-center gap-2 pt-4 text-sm text-muted-foreground"><ProgressRing /> {done.length} of {chapters.length} lessons finished</p>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
      Free to learn, forever. Based on <em>Software Foundations for Vibe Coders</em> by Solomon Promise.
    </footer>
  );
}
