import { useSyncExternalStore } from "react";

const KEY = "sf:progress:v1";
export type Progress = { done: string[]; last?: string };
const EMPTY: Progress = { done: [] };
let cache: Progress | null = null;
const subs = new Set<() => void>();

function read(): Progress {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try { cache = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { cache = EMPTY; }
  return cache!;
}
function write(p: Progress) {
  cache = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function markDone(slug: string, done = true) {
  const p = read();
  const set = new Set(p.done);
  if (done) set.add(slug); else set.delete(slug);
  write({ ...p, done: [...set] });
}
export function setLast(slug: string) { const p = read(); if (p.last !== slug) write({ ...p, last: slug }); }
export function resetProgress() { write(EMPTY); }
export function useProgress(): Progress {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    read,
    () => EMPTY,
  );
}
