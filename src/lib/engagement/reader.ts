import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Reader counts. Each browser gets a random reader ID (no name, no email) so the site can show
 * honest counts: how many people read the course and how far they get through a
 * lesson. Only counts ever come back from the database (see docs/database/engagement.sql).
 * Readers can switch this off on /about#privacy, which also deletes what was recorded.
 */

const KEY = "sf:reader:v1";
export type Me = {
  id: string;
  /** "Reader #128" — given by the database the first time this reader opens a lesson. */
  number?: number;
  /** The month they started, e.g. "2026-11": their read-along season. */
  season?: string;
  /** Their place among readers who finished each lesson. */
  ranks?: Record<string, number>;
  optOut?: boolean;
};

const subs = new Set<() => void>();
let cache: Me | null = null;
const SERVER_ME: Me = { id: "" };

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
      );
}

function read(): Me {
  if (typeof window === "undefined") return SERVER_ME;
  if (cache) return cache;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Me | null;
    cache = saved?.id ? saved : { id: newId() };
  } catch {
    cache = { id: newId() };
  }
  return cache;
}

function write(me: Me) {
  cache = me;
  try {
    localStorage.setItem(KEY, JSON.stringify(me));
  } catch {
    /* Counting still works for this visit. */
  }
  subs.forEach((f) => f());
}

export const getMe = read;
export function useMe(): Me {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    read,
    () => SERVER_ME,
  );
}

/** Counting runs on the live site only, never in development, previews or embeds. */
export function counting() {
  return (
    import.meta.env.PROD &&
    typeof window !== "undefined" &&
    window.self === window.top &&
    !!supabase &&
    !read().optOut
  );
}

// ---------------------------------------------------------------------------------------------
// Sending: where the reader is and how far they've read
// ---------------------------------------------------------------------------------------------

const sentDepth = new Map<string, number>();
let pending: { lesson: string; depth: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

async function send(lesson: string | null, depth: number) {
  if (!counting() || !supabase) return;
  const me = read();
  const { data } = await supabase.rpc("reader_pulse", {
    p_reader: me.id,
    p_lesson: lesson,
    p_depth: depth,
  });
  const r = data as { number?: number; season?: string } | null;
  if (r?.number && (r.number !== me.number || r.season !== me.season)) {
    write({ ...read(), number: r.number, ...(r.season ? { season: r.season } : {}) });
  }
}

/**
 * Records that the reader is on a lesson and has read `depth` percent of it. Calls are combined,
 * so scrolling sends at most one update every few seconds, and only when they've read further.
 */
export function pulse(lesson: string, depth = 0) {
  if (!counting()) return;
  const d = Math.max(0, Math.min(100, Math.floor(depth / 10) * 10));
  const prev = sentDepth.get(lesson);
  if (prev !== undefined && d <= prev) return;
  sentDepth.set(lesson, d);
  // Moving to another lesson: send what's left of the previous one first.
  if (pending && pending.lesson !== lesson) void send(pending.lesson, pending.depth);
  pending = null;
  if (prev === undefined) {
    // First visit to this lesson in this session: count it straight away.
    void send(lesson, d);
    return;
  }
  pending = { lesson, depth: d };
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const p = pending;
    pending = null;
    if (p) void send(p.lesson, p.depth);
  }, 5000);
}

/** Keeps "reading right now" honest while someone stays on a lesson without scrolling. */
export function heartbeat(lesson: string) {
  if (!counting()) return () => {};
  const id = setInterval(
    () => {
      if (document.visibilityState === "visible") void send(lesson, sentDepth.get(lesson) ?? 0);
    },
    4 * 60 * 1000,
  );
  return () => clearInterval(id);
}

/** Marks a lesson finished. Resolves to "you're the Nth reader to finish it". */
export async function finishOnTrail(lesson: string): Promise<number | null> {
  const known = read().ranks?.[lesson];
  if (known) return known;
  if (!counting() || !supabase) return null;
  const { data } = await supabase.rpc("reader_finish", { p_reader: read().id, p_lesson: lesson });
  const rank = typeof data === "number" ? data : Number(data) || null;
  if (rank) {
    const me = read();
    write({ ...me, ranks: { ...(me.ranks ?? {}), [lesson]: rank } });
  }
  return rank;
}

/** "Don't count me": deletes this reader's anonymous record and stops counting. */
export async function stopCounting() {
  const me = read();
  if (supabase) await supabase.rpc("reader_forget", { p_reader: me.id });
  write({ id: newId(), optOut: true });
}

export function startCounting() {
  write({ id: newId() });
}

// ---------------------------------------------------------------------------------------------
// Reading: counts for the home page and the lesson river
// ---------------------------------------------------------------------------------------------

export type Season = { season: string; readers: number; active: number };
export type ReaderStats = {
  readers: number;
  reading_now: number;
  /** slug → [readers who opened it, readers who finished it] */
  reach: Record<string, [number, number]>;
  seasons: Season[];
};
export type River = { opened: number; finished: number; reached: number[] };

const cached = new Map<string, { at: number; value: Promise<unknown> }>();

/** Loads a value once and shares it between components for `ttl` ms. Resolves to null on failure. */
function load<T>(
  key: string,
  fn: () => PromiseLike<{ data: unknown; error: unknown }>,
  ttl = 120_000,
) {
  const hit = cached.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as Promise<T | null>;
  const value = Promise.resolve(fn()).then(
    ({ data, error }) => (error ? null : (data as T)),
    () => null,
  );
  cached.set(key, { at: Date.now(), value });
  return value;
}

/** undefined while loading, null when the database isn't available. */
function useLoaded<T>(
  key: string | null,
  fn: () => PromiseLike<{ data: unknown; error: unknown }>,
  ttl?: number,
) {
  const [value, setValue] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    if (!key || !supabase) {
      setValue(null);
      return;
    }
    let live = true;
    setValue(undefined);
    void load<T>(key, fn, ttl).then((v) => live && setValue(v));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}

export function useReaderStats() {
  return useLoaded<ReaderStats>("readers", () => supabase!.rpc("reader_stats"));
}

export function useRiver(slug: string) {
  return useLoaded<River>(`river:${slug}`, () => supabase!.rpc("lesson_river", { p_lesson: slug }));
}

export function forgetCached(prefix: string) {
  for (const k of cached.keys()) if (k.startsWith(prefix)) cached.delete(k);
}

// ---------------------------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------------------------

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n.toLocaleString("en")}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** "2026-11" → "November 2026" */
export function seasonName(season: string, style: "long" | "month" = "long") {
  const [y, m] = season.split("-").map(Number);
  if (!y || !m) return season;
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en", {
    month: "long",
    ...(style === "long" ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export const currentSeason = () => new Date().toISOString().slice(0, 7);
