import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X, Download } from "lucide-react";
import book from "@/assets/book.pdf.asset.json";
import { parts, sectionFor, TOTAL_PAGES } from "@/lib/toc";

const PdfPage = lazy(() => import("@/components/PdfPage"));

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => {
    const n = Number(s.page);
    return { page: Number.isFinite(n) && n >= 1 && n <= TOTAL_PAGES ? Math.floor(n) : 1 };
  },
  head: () => ({
    meta: [
      { title: "Software Foundations for Vibe Coders — Read online" },
      { name: "description", content: "Read Solomon Promise's beginner's guide to building software with AI, chapter by chapter." },
      { property: "og:title", content: "Software Foundations for Vibe Coders" },
      { property: "og:description", content: "A beginner's guide to building software with AI — read it online." },
      { property: "og:type", content: "book" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reader,
});

function Reader() {
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [open, setOpen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);
  const go = (p: number) => {
    const n = Math.min(TOTAL_PAGES, Math.max(1, p));
    navigate({ search: { page: n } });
    setOpen(false);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const fit = () => stage.current && setWidth(Math.min(820, stage.current.clientWidth - 32));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const cur = sectionFor(page);

  return (
    <div className="flex min-h-screen font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-80 overflow-y-auto bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-start justify-between border-b border-sidebar-border p-6">
          <button onClick={() => go(1)} className="text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-sidebar-primary">A beginner's guide</p>
            <h1 className="mt-2 font-serif text-2xl leading-tight">Software Foundations for Vibe Coders</h1>
            <p className="mt-2 text-sm opacity-70">Solomon Promise</p>
          </button>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close contents"><X /></button>
        </div>
        <nav className="p-3 pb-10">
          {parts.map((part) => (
            <div key={part.label} className="mt-4">
              <button onClick={() => go(part.page)} className="w-full px-3 py-1 text-left text-xs font-bold uppercase tracking-widest text-sidebar-primary">
                {part.label.startsWith("P") ? `Part ${part.label.slice(1)} · ` : ""}{part.title}
              </button>
              {part.entries.map((e) => {
                const active = cur.entry === e;
                return (
                  <button
                    key={e.page + e.title}
                    onClick={() => go(e.page)}
                    className={`flex w-full gap-3 rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "opacity-80"}`}
                  >
                    <span className="w-6 shrink-0 font-mono text-xs leading-5 opacity-60">{e.label}</span>
                    <span className="flex-1">{e.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open contents"><Menu /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">{cur.part.title}</p>
            <p className="truncate font-serif text-lg">{cur.entry?.title ?? cur.part.title}</p>
          </div>
          <a href={book.url} download className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex"><Download className="size-4" /> PDF</a>
        </header>

        <div ref={stage} className="flex flex-1 justify-center px-4 py-8">
          <ClientOnly fallback={<div className="page-sheet" style={{ width, aspectRatio: "595/842" }} />}>
            <Suspense fallback={<div className="page-sheet" style={{ width, aspectRatio: "595/842" }} />}>
              <PdfPage url={book.url} page={page} width={width} />
            </Suspense>
          </ClientOnly>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-center gap-4 border-t border-border bg-background/90 px-4 py-3 backdrop-blur">
          <button onClick={() => go(page - 1)} disabled={page <= 1} className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-30" aria-label="Previous page"><ChevronLeft /></button>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Page
            <input
              key={page}
              type="number"
              defaultValue={page}
              min={1}
              max={TOTAL_PAGES}
              onKeyDown={(e) => e.key === "Enter" && go(Number(e.currentTarget.value))}
              className="w-16 rounded border border-input bg-card px-2 py-1 text-center text-foreground"
            />
            of {TOTAL_PAGES}
          </label>
          <button onClick={() => go(page + 1)} disabled={page >= TOTAL_PAGES} className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-30" aria-label="Next page"><ChevronRight /></button>
        </footer>
      </main>
    </div>
  );
}
