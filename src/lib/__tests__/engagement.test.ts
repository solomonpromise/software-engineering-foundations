import { describe, expect, it } from "vitest";
import { chapters } from "@/content/lessons";
import { addDays, cardsFor, dueCards, grade, scheduleLesson } from "../engagement/review";
import { rhythmMessage, weeklyRhythm } from "../engagement/rhythm";
import { ordinal, seasonName } from "../engagement/reader";
import { letterSchema, signature, timeAgo } from "../engagement/letters";
import {
  isPushEndpoint,
  reminderMessage,
  vapidHeader,
  fromB64url,
  toB64url,
} from "../../../supabase/functions/reminders/push";

const [a, b, c] = chapters.map((x) => x.slug);

describe("daily refresh", () => {
  it("only asks about finished lessons, at most three, one per lesson first", () => {
    expect(dueCards({ done: [] }, "2026-11-16")).toEqual([]);
    const cards = dueCards({ done: [a!, b!, c!] }, "2026-11-16");
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((x) => x.slug)).size).toBe(3);
  });

  it("a just-finished lesson comes back tomorrow, not today", () => {
    const review = scheduleLesson(undefined, a!, "2026-11-16");
    expect(dueCards({ done: [a!], review }, "2026-11-16")).toEqual([]);
    expect(dueCards({ done: [a!], review }, "2026-11-17").length).toBeGreaterThan(0);
  });

  it("remembering pushes a card further away; missing it brings it back tomorrow", () => {
    const key = cardsFor(a!)[0]!.key;
    let r = grade(undefined, key, true, "2026-11-16");
    expect(r[key]).toEqual({ box: 1, due: "2026-11-17" });
    r = grade(r, key, true, "2026-11-17");
    expect(r[key]).toEqual({ box: 2, due: "2026-11-20" });
    r = grade(r, key, false, "2026-11-20");
    expect(r[key]).toEqual({ box: 1, due: "2026-11-21" });
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 3)).toBe("2027-01-03");
  });
});

describe("weekly rhythm", () => {
  const today = new Date(2026, 10, 18); // Wednesday 18 Nov 2026

  it("counts weeks, not days", () => {
    const r = weeklyRhythm(["2026-11-16", "2026-11-17", "2026-11-10", "2026-11-03"], today);
    expect(r.thisWeek).toBe(true);
    expect(r.streak).toBe(3);
    expect(r.inLastFour).toBe(3);
    expect(r.weeks.at(-1)).toMatchObject({ start: "2026-11-16", current: true, read: true });
  });

  it("an unread current week doesn't break the streak yet", () => {
    const r = weeklyRhythm(["2026-11-10", "2026-11-03"], today);
    expect(r.thisWeek).toBe(false);
    expect(r.streak).toBe(2);
    expect(rhythmMessage(r)).toBe("Read once this week to make it 3 weeks in a row.");
  });

  it("is gentle with nothing read", () => {
    expect(rhythmMessage(weeklyRhythm([], today))).toMatch(/once a week/);
  });
});

describe("reader count and letters helpers", () => {
  it("formats ordinals and seasons", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111, 418].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "12th",
      "13th",
      "21st",
      "22nd",
      "101st",
      "111th",
      "418th",
    ]);
    expect(seasonName("2026-11")).toBe("November 2026");
    expect(seasonName("2026-01", "month")).toBe("January");
  });

  it("refuses letters with links or email addresses", () => {
    const base = { lesson: "course", message: "Take it one lesson at a time." };
    expect(letterSchema.safeParse(base).success).toBe(true);
    expect(letterSchema.safeParse({ ...base, message: "See https://spam.example" }).success).toBe(
      false,
    );
    expect(letterSchema.safeParse({ ...base, message: "Email me at a@b.co please" }).success).toBe(
      false,
    );
    expect(letterSchema.safeParse({ ...base, message: "too short" }).success).toBe(false);
  });

  it("signs letters with what the writer chose to share", () => {
    expect(signature({ name: "Ada", place: "Lagos" })).toBe("Ada, Lagos");
    expect(signature({ name: null, place: "Lagos" })).toBe("A reader in Lagos");
    expect(signature({ name: null, place: null })).toBe("A reader");
    expect(timeAgo("2026-11-13T10:00:00Z", Date.parse("2026-11-16T12:00:00Z"))).toBe("3 days ago");
  });
});

describe("reading reminders", () => {
  const row = {
    goal: "a booking app for my salon",
    last_lesson_title: "How the web works",
    next_lesson_slug: "apis",
    next_lesson_title: "APIs",
    next_lesson_number: 7,
    next_lesson_summary: "What an API is.",
    lessons_done: 6,
    lessons_total: 34,
    reminders_sent: 0,
  };

  it("links to the reader's next lesson and mentions their goal or progress", () => {
    const first = reminderMessage(row, "https://example.org/site/", "x");
    expect(first.url).toBe("https://example.org/site/learn/apis?utm_source=reminder");
    const second = [..."abcdefgh"].map((s) =>
      reminderMessage({ ...row, reminders_sent: 1 }, "https://e.org", s),
    );
    expect(second.some((m) => m.title.includes("booking app") || m.body.includes("6 of 34"))).toBe(
      true,
    );
    const last = reminderMessage({ ...row, reminders_sent: 2 }, "https://e.org");
    expect(last.body).toMatch(/last reminder/);
  });

  it("keeps notifications short", () => {
    const long = {
      ...row,
      next_lesson_title: "x".repeat(300),
      next_lesson_summary: "y ".repeat(300),
      goal: "z".repeat(80),
    };
    for (const sent of [0, 1, 2])
      for (const seed of "abcd") {
        const m = reminderMessage({ ...long, reminders_sent: sent }, "https://e.org", seed);
        expect(m.title.length).toBeLessThanOrEqual(80);
        expect(m.body.length).toBeLessThanOrEqual(200);
      }
  });

  it("only sends to real push services", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isPushEndpoint("https://evil.example.com/fcm.googleapis.com/")).toBe(false);
    expect(isPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
  });

  it("signs a VAPID token for the push service's origin", async () => {
    const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
    const pub = toB64url(new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)));
    const d = (await crypto.subtle.exportKey("jwk", pair.privateKey)).d!;
    const header = await vapidHeader(
      "https://fcm.googleapis.com/fcm/send/x",
      pub,
      d,
      "https://example.org",
      0,
    );
    const token = /t=([^,]+)/.exec(header)![1]!;
    const [h, p, sig] = token.split(".");
    expect(JSON.parse(new TextDecoder().decode(fromB64url(p!)))).toEqual({
      aud: "https://fcm.googleapis.com",
      exp: 43200,
      sub: "https://example.org",
    });
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      fromB64url(sig!),
      new TextEncoder().encode(`${h}.${p}`),
    );
    expect(ok).toBe(true);
    expect(header).toContain(`k=${pub}`);
  });
});
