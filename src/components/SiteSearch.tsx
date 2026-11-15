import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { chapters, parts } from "@/content/lessons";
import { appendices, introPages } from "@/content/extras";

const glossary = parts.flatMap((p) => p.glossary);

export function SiteSearch({ hotkey = false }: { hotkey?: boolean }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);
  const go = (fn: () => void) => { setOpen(false); fn(); };
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Search the course" title="Search (Ctrl K)" className="flex size-9 items-center justify-center rounded-full border border-header-accent/45 text-header-foreground hover:bg-header-accent/15">
        <Search className="size-4" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search lessons, terms and guides…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Lessons">
            {chapters.map((c) => (
              <CommandItem key={c.slug} value={`lesson ${c.number} ${c.title} ${c.summary}`} onSelect={() => go(() => navigate({ to: "/learn/$slug", params: { slug: c.slug } }))}>
                <span className="mr-2 text-xs text-muted-foreground">{c.number}</span>{c.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Glossary">
            {glossary.map((g) => (
              <CommandItem key={g.term} value={`term ${g.term} ${g.definition}`} onSelect={() => go(() => navigate({ to: "/glossary" }))}>
                <span className="font-semibold">{g.term}</span><span className="ml-2 truncate text-xs text-muted-foreground">{g.definition}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Start here and reference">
            {introPages.map((p) => <CommandItem key={p.slug} value={`start ${p.title}`} onSelect={() => go(() => navigate({ to: "/start/$slug", params: { slug: p.slug } }))}>{p.title}</CommandItem>)}
            {appendices.map((a) => <CommandItem key={a.slug} value={`appendix ${a.letter} ${a.title}`} onSelect={() => go(() => navigate({ to: "/reference/$slug", params: { slug: a.slug } }))}>Appendix {a.letter}: {a.title}</CommandItem>)}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
