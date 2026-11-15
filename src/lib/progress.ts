import { useSyncExternalStore } from "react";

const KEY = "sf:progress:v1";
export type Progress = { done: string[]; last?: string; steps?: Record<string, number[]> };
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
export function toggleStep(project: string, i: number) {
  const p = read();
  const cur = new Set(p.steps?.[project] ?? []);
  if (cur.has(i)) cur.delete(i); else cur.add(i);
  write({ ...p, steps: { ...(p.steps ?? {}), [project]: [...cur] } });
}
/** Union of two progress records: nothing finished on either side is ever lost. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const steps: Record<string, number[]> = {};
  for (const src of [a.steps ?? {}, b.steps ?? {}]) for (const [k, v] of Object.entries(src)) steps[k] = [...new Set([...(steps[k] ?? []), ...v])].sort((x, y) => x - y);
  const last = a.last ?? b.last;
  return { done: [...new Set([...a.done, ...b.done])], ...(last ? { last } : {}), steps };
}
export function getProgress() { return read(); }
export function replaceProgress(p: Progress) { write(p); }
export function subscribeProgress(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function setLast(slug: string) { const p = read(); if (p.last !== slug) write({ ...p, last: slug }); }
export function resetProgress() { write(EMPTY); }
export function useProgress(): Progress {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    read,
    () => EMPTY,
  );
}
