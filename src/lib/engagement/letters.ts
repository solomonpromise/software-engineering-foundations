import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

/**
 * Letters to the next reader: short notes readers leave for whoever reads a lesson after them
 * (lesson "course" = a letter to someone just starting). Every letter is read by a maintainer on
 * /admin before it appears; the public can only fetch approved ones (approved_letters()).
 */

export const COURSE = "course";
const SENT_KEY = "sf:letters:v1";

export type Letter = {
  id: string;
  lesson_slug: string;
  message: string;
  name: string | null;
  place: string | null;
  approved_at: string;
};

export const letterSchema = z.object({
  lesson: z.string().regex(/^[a-z0-9-]{1,120}$/),
  message: z
    .string()
    .trim()
    .min(10, "Write at least a sentence (10 characters).")
    .max(600, "Keep it under 600 characters.")
    .refine((m) => !/https?:\/\/|www\./i.test(m), "Please leave out links.")
    .refine((m) => !/\S+@\S+\.\S+/.test(m), "Please leave out email addresses."),
  name: z.string().trim().max(60).optional(),
  place: z.string().trim().max(60).optional(),
});
export type LetterInput = z.input<typeof letterSchema>;

let all: Promise<Letter[]> | null = null;
let loadedAt = 0;

function fetchLetters(): Promise<Letter[]> {
  if (!supabase) return Promise.resolve([]);
  if (all && Date.now() - loadedAt < 5 * 60_000) return all;
  loadedAt = Date.now();
  all = Promise.resolve(supabase.rpc("approved_letters")).then(
    ({ data, error }) => (error ? [] : ((data ?? []) as Letter[])),
    () => [],
  );
  return all;
}

/** Approved letters, newest first; optionally only those for one lesson. undefined while loading. */
export function useLetters(lesson?: string) {
  const [letters, setLetters] = useState<Letter[] | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void fetchLetters().then(
      (l) => live && setLetters(lesson ? l.filter((x) => x.lesson_slug === lesson) : l),
    );
    return () => {
      live = false;
    };
  }, [lesson]);
  return letters;
}

export function lettersEnabled() {
  return !!supabase;
}

export function letterSent(lesson: string) {
  try {
    return Boolean(JSON.parse(localStorage.getItem(SENT_KEY) || "{}")[lesson]);
  } catch {
    return false;
  }
}

export async function sendLetter(
  input: LetterInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = letterSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your letter." };
  if (!supabase)
    return { ok: false, error: "Letters aren't switched on for this copy of the site." };
  const { lesson, message, name, place } = parsed.data;
  const { error } = await supabase.from("reader_letters").insert({
    lesson_slug: lesson,
    message,
    name: name || null,
    place: place || null,
  });
  if (error)
    return {
      ok: false,
      error: "Your letter couldn't be sent. Check your connection and try again.",
    };
  try {
    const sent = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
    localStorage.setItem(SENT_KEY, JSON.stringify({ ...sent, [lesson]: new Date().toISOString() }));
  } catch {
    /* sent anyway */
  }
  return { ok: true };
}

/** "3 days ago", "last month" */
export function timeAgo(iso: string, now = Date.now()) {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 62) return "last month";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return "over a year ago";
}

/** "Ada, Lagos" / "Ada" / "A reader in Lagos" / "A reader" */
export function signature(l: Pick<Letter, "name" | "place">) {
  if (l.name && l.place) return `${l.name}, ${l.place}`;
  if (l.name) return l.name;
  if (l.place) return `A reader in ${l.place}`;
  return "A reader";
}
