import { chapters } from "@/content/lessons";
import type { Progress } from "@/lib/progress";

/**
 * Daily refresh: spaced review of the "Check your understanding" questions from lessons the
 * learner has finished. Each question sits in a box (1–5); getting it right moves it up and pushes
 * the next review further away, missing it brings it back tomorrow. Stored in the browser only.
 */

/** Days until the next review for a card in box 1…5. */
export const INTERVALS = [0, 1, 3, 7, 16, 35] as const;
export const DAILY = 3;

export type Card = {
  key: string;
  slug: string;
  lessonNumber: number;
  lessonTitle: string;
  q: string;
  a: string;
};
type Review = NonNullable<Progress["review"]>;

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(y!, m! - 1, d! + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export function cardsFor(slug: string): Card[] {
  const c = chapters.find((x) => x.slug === slug);
  if (!c) return [];
  return c.check.map((x, i) => ({
    key: `${slug}#${i}`,
    slug,
    lessonNumber: c.number,
    lessonTitle: c.title,
    q: x.q,
    a: x.a,
  }));
}

/**
 * Today's cards: overdue ones first, then ones never reviewed, at most one per lesson so the
 * refresh mixes ideas from across the course.
 */
export function dueCards(
  p: Pick<Progress, "done" | "review">,
  today: string,
  limit = DAILY,
): Card[] {
  const review = p.review ?? {};
  const due: { card: Card; due: string }[] = [];
  for (const slug of p.done) {
    for (const card of cardsFor(slug)) {
      const r = review[card.key];
      if (!r || r.due <= today) due.push({ card, due: r?.due ?? "9999" });
    }
  }
  due.sort((a, b) =>
    a.due === b.due ? a.card.lessonNumber - b.card.lessonNumber : a.due < b.due ? -1 : 1,
  );
  const picked: Card[] = [];
  const lessons = new Set<string>();
  for (const { card } of due) {
    if (picked.length >= limit) break;
    if (lessons.has(card.slug)) continue;
    lessons.add(card.slug);
    picked.push(card);
  }
  for (const { card } of due) {
    if (picked.length >= limit) break;
    if (!picked.includes(card)) picked.push(card);
  }
  return picked;
}

export function grade(
  review: Review | undefined,
  key: string,
  got: boolean,
  today: string,
): Review {
  const box = got ? Math.min(5, (review?.[key]?.box ?? 0) + 1) : 1;
  return { ...(review ?? {}), [key]: { box, due: addDays(today, INTERVALS[box] ?? 1) } };
}

/** A just-finished lesson's questions were answered moments ago: first review is tomorrow. */
export function scheduleLesson(review: Review | undefined, slug: string, today: string): Review {
  const out = { ...(review ?? {}) };
  for (const c of cardsFor(slug)) if (!out[c.key]) out[c.key] = { box: 1, due: addDays(today, 1) };
  return out;
}
