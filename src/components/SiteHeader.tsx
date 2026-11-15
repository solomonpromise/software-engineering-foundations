import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-serif text-xl">Software Foundations<span className="text-accent">.</span></Link>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/start/$slug" params={{ slug: "about" }} className="hover:text-foreground">Start here</Link>
          <Link to="/" hash="curriculum" className="hover:text-foreground">Curriculum</Link>
          <Link to="/reference" className="hover:text-foreground">Reference</Link>
          <Link to="/glossary" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>Glossary</Link>
        </nav>
      </div>
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
