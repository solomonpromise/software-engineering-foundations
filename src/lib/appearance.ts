import { useEffect, useState } from "react";

export const THEMES = [
  { id: "forest", label: "Forest & Brass", swatch: ["#FBFAF6", "#1F3B2D", "#B8893B"] },
  { id: "sepia", label: "Sepia paper", swatch: ["#F3EBDD", "#5A3B26", "#A8743A"] },
  { id: "night", label: "Night reading", swatch: ["#17211C", "#EDEAE0", "#D4AE5E"] },
  { id: "contrast", label: "High contrast", swatch: ["#FFFFFF", "#000000", "#14432C"] },
] as const;
export const SIZES = [
  { id: "small", label: "A", title: "Smaller text" },
  { id: "normal", label: "A", title: "Normal text" },
  { id: "large", label: "A", title: "Larger text" },
  { id: "xlarge", label: "A", title: "Largest text" },
] as const;
export type Appearance = { theme: string; size: string };
const KEY = "sf:appearance";
const DEFAULT: Appearance = { theme: "forest", size: "normal" };

/** Runs before first paint (inlined in <head>) so there's no flash of the wrong theme. */
export const appearanceBootScript = `try{var a=JSON.parse(localStorage.getItem("${KEY}")||"{}");if(a.theme&&a.theme!=="forest")document.documentElement.dataset.theme=a.theme;if(a.size&&a.size!=="normal")document.documentElement.dataset.size=a.size}catch(e){}`;

function apply(a: Appearance) {
  const el = document.documentElement;
  if (a.theme === "forest") delete el.dataset.theme; else el.dataset.theme = a.theme;
  if (a.size === "normal") delete el.dataset.size; else el.dataset.size = a.size;
}

export function useAppearance() {
  const [a, setA] = useState<Appearance>(DEFAULT);
  useEffect(() => { try { setA({ ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* ignore */ } }, []);
  const update = (patch: Partial<Appearance>) => {
    const next = { ...a, ...patch };
    setA(next); apply(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  return [a, update] as const;
}
