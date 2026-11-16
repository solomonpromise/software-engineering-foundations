import { useSyncExternalStore } from "react";

const KEY = "sf:progress:v1";
export type Practice = { answer?: string; done?: number[] };
export type Progress = {
  done: string[];
  last?: string;
  steps?: Record<string, number[]>;
  bookmarks?: string[];
  notes?: Record<string, string>;
  assessments?: Record<string, number[]>;
  practice?: Record<string, Practice>;
  /** Name the learner wants on their certificate. */
  certificateName?: string;
  /** Local dates (YYYY-MM-DD) the learner read on, newest last; used for the weekly rhythm. */
  days?: string[];
  /** Spaced review of check questions: "slug#index" → box (1–5) and the date it's next due. */
  review?: Record<string, { box: number; due: string }>;
};
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
function toggleIndex(map: Record<string, number[]> | undefined, key: string, i: number) {
  const cur = new Set(map?.[key] ?? []);
  if (cur.has(i)) cur.delete(i); else cur.add(i);
  return { ...(map ?? {}), [key]: [...cur].sort((a, b) => a - b) };
}
function mergeIndexes(a: Record<string, number[]> | undefined, b: Record<string, number[]> | undefined) {
  const out: Record<string, number[]> = {};
  for (const src of [a ?? {}, b ?? {}]) {
    for (const [k, v] of Object.entries(src)) out[k] = [...new Set([...(out[k] ?? []), ...v])].sort((x, y) => x - y);
  }
  return out;
}

export function markDone(slug: string, done = true) {
  const p = read();
  const set = new Set(p.done);
  if (done) set.add(slug); else set.delete(slug);
  write({ ...p, done: [...set] });
}
export function toggleStep(project: string, i: number) {
  const p = read();
  write({ ...p, steps: toggleIndex(p.steps, project, i) });
}
export function toggleAssessment(project: string, i: number) {
  const p = read();
  write({ ...p, assessments: toggleIndex(p.assessments, project, i) });
}
export function toggleBookmark(slug: string) {
  const p = read();
  const saved = new Set(p.bookmarks ?? []);
  if (saved.has(slug)) saved.delete(slug); else saved.add(slug);
  write({ ...p, bookmarks: [...saved] });
}
export function setNote(slug: string, text: string) {
  const p = read();
  write({ ...p, notes: { ...(p.notes ?? {}), [slug]: text.slice(0, 5000) } });
}
export function setPracticeAnswer(slug: string, text: string) {
  const p = read();
  write({ ...p, practice: { ...(p.practice ?? {}), [slug]: { ...p.practice?.[slug], answer: text.slice(0, 5000) } } });
}
export function togglePracticeTask(slug: string, i: number) {
  const p = read();
  const done = toggleIndex({ [slug]: p.practice?.[slug]?.done ?? [] }, slug, i)[slug] ?? [];
  write({ ...p, practice: { ...(p.practice ?? {}), [slug]: { ...p.practice?.[slug], done } } });
}

/** Union of two learning records: finished work and saved items on either side are retained. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const last = a.last ?? b.last;
  const notes: Record<string, string> = { ...(b.notes ?? {}) };
  for (const [slug, text] of Object.entries(a.notes ?? {})) if (text || !notes[slug]) notes[slug] = text;
  const practice: Record<string, Practice> = {};
  for (const slug of new Set([...Object.keys(a.practice ?? {}), ...Object.keys(b.practice ?? {})])) {
    const local = a.practice?.[slug];
    const remote = b.practice?.[slug];
    practice[slug] = {
      answer: local?.answer || remote?.answer || "",
      done: mergeIndexes({ [slug]: local?.done ?? [] }, { [slug]: remote?.done ?? [] })[slug] ?? [],
    };
  }
  return {
    done: [...new Set([...a.done, ...b.done])],
    ...(last ? { last } : {}),
    steps: mergeIndexes(a.steps, b.steps),
    bookmarks: [...new Set([...(a.bookmarks ?? []), ...(b.bookmarks ?? [])])],
    notes,
    assessments: mergeIndexes(a.assessments, b.assessments),
    practice,
    days: [...new Set([...(a.days ?? []), ...(b.days ?? [])])].sort().slice(-400),
    review: { ...(b.review ?? {}), ...(a.review ?? {}) },
  };
}
export function setCertificateName(name: string) {
  const p = read();
  write({ ...p, certificateName: name.slice(0, 80) });
}
/** A local calendar date, "2026-11-16". */
export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Notes that the learner read today (for the weekly rhythm). */
export function recordReadingDay() {
  const p = read();
  const today = localDay();
  if (p.days?.[p.days.length - 1] === today || p.days?.includes(today)) return;
  write({ ...p, days: [...(p.days ?? []), today].slice(-400) });
}
export function setReview(review: Progress["review"]) {
  write({ ...read(), review: review ?? {} });
}
export function getProgress() { return read(); }
export function replaceProgress(p: Progress) { write(p); }
export function subscribeProgress(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }
export function setLast(slug: string) { const p = read(); if (p.last !== slug) write({ ...p, last: slug }); }
/** Clear course completion without deleting the learner's notes, bookmarks or practice answers. */
export function resetProgress() {
  const p = { ...read() };
  delete p.last;
  write({ ...p, done: [], steps: {}, assessments: {} });
}
export function useProgress(): Progress {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    read,
    () => EMPTY,
  );
}
