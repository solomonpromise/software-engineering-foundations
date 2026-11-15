import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { THEMES, SIZES, useAppearance } from "@/lib/appearance";

export function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const [a, update] = useAppearance();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Appearance" title="Appearance" className="flex size-9 items-center justify-center rounded-full border border-border text-foreground hover:border-primary">
        <Palette className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Appearance</p>
          <ul className="mt-3 space-y-1">
            {THEMES.map((t) => (
              <li key={t.id}>
                <button onClick={() => update({ theme: t.id })} aria-pressed={a.theme === t.id} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary ${a.theme === t.id ? "bg-secondary" : ""}`}>
                  <span className="flex overflow-hidden rounded-full border border-border">{t.swatch.map((c) => <span key={c} className="size-4" style={{ background: c }} />)}</span>
                  <span className="flex-1">{t.label}</span>
                  {a.theme === t.id && <Check className="size-4 text-accent" />}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Text size</p>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {SIZES.map((s, i) => (
              <button key={s.id} onClick={() => update({ size: s.id })} title={s.title} aria-label={s.title} aria-pressed={a.size === s.id} className={`rounded-md border py-1.5 font-serif ${a.size === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`} style={{ fontSize: `${0.8 + i * 0.18}rem` }}>{s.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
