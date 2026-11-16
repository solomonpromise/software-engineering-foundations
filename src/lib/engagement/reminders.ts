import { useSyncExternalStore } from "react";
import { reminders as config } from "@/config/community";
import { chapters } from "@/content/lessons";
import { getProgress } from "@/lib/progress";
import { supabase } from "@/lib/supabase";

/**
 * Reading reminders as browser notifications — free, and no email address needed. The reader's
 * browser gives us a push "endpoint"; we store it with their optional goal, preferred hour and the
 * lesson they're on. The "reminders" Edge Function sends a gentle note after 1, 4 and 11 days away.
 */

const KEY = "sf:reminders:v1";
export type ReminderPrefs = { endpoint: string; goal: string; hour: number; lost?: boolean };
export const HOURS = [
  { hour: 8, label: "Morning" },
  { hour: 12, label: "Midday" },
  { hour: 19, label: "Evening" },
  { hour: 21, label: "Night" },
] as const;

const subs = new Set<() => void>();
let cache: ReminderPrefs | null | undefined;

function read(): ReminderPrefs | null {
  if (typeof window === "undefined") return null;
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    cache = null;
  }
  return cache ?? null;
}
function write(p: ReminderPrefs | null) {
  cache = p;
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}

export function useReminderPrefs() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    read,
    () => null,
  );
}

export type Support = "ok" | "unsupported" | "needs-home-screen" | "dev" | "off";

/** Whether this browser can get reminders, and if not, why. */
export function reminderSupport(): Support {
  if (typeof window === "undefined" || !config.vapidPublicKey || !supabase) return "off";
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (ios && !standalone && !("PushManager" in window)) return "needs-home-screen";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
    return "unsupported";
  if (!import.meta.env.PROD) return "dev";
  return "ok";
}

function keyBytes(b64url: string) {
  const b64 =
    b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64url.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function serviceWorker(): Promise<ServiceWorkerRegistration | null> {
  const ready = navigator.serviceWorker.ready;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 8000));
  return Promise.race([ready, timeout]);
}

/** What the reminder should mention: the lesson the reader is on and what comes next for them. */
export function readingContext(currentSlug?: string) {
  const p = getProgress();
  const done = new Set(p.done);
  const current = chapters.find((c) => c.slug === (currentSlug ?? p.last));
  const next =
    current && !done.has(current.slug)
      ? current
      : (chapters.find((c) => current && c.number > current.number && !done.has(c.slug)) ??
        chapters.find((c) => !done.has(c.slug)));
  return {
    p_last_title: current?.title ?? null,
    p_next_slug: next?.slug ?? null,
    p_next_title: next?.title ?? null,
    p_next_number: next?.number ?? null,
    p_next_summary: next?.summary ?? null,
    p_done: done.size,
    p_total: chapters.length,
  };
}

export type EnableResult = { ok: true } | { ok: false; reason: "denied" | "failed" | Support };

export async function enableReminders(
  goal: string,
  hour: number,
  currentSlug?: string,
): Promise<EnableResult> {
  const support = reminderSupport();
  if (support !== "ok") return { ok: false, reason: support };
  if (!supabase || !config.vapidPublicKey) return { ok: false, reason: "off" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };
  try {
    const reg = await serviceWorker();
    if (!reg) return { ok: false, reason: "failed" };
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(config.vapidPublicKey),
      }));
    const j = sub.toJSON();
    if (!j.endpoint || !j.keys?.["p256dh"] || !j.keys["auth"])
      return { ok: false, reason: "failed" };
    const { data, error } = await supabase.rpc("reminder_subscribe", {
      p_endpoint: j.endpoint,
      p_p256dh: j.keys["p256dh"],
      p_auth: j.keys["auth"],
      p_goal: goal.trim().slice(0, 80),
      p_hour: hour,
      p_time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    if (error || data !== true) return { ok: false, reason: "failed" };
    write({ endpoint: j.endpoint, goal: goal.trim(), hour });
    await supabase.rpc("reminder_touch", {
      p_endpoint: j.endpoint,
      ...readingContext(currentSlug),
    });
    // One confirmation notification, so the reader sees it works.
    void supabase.functions.invoke("reminders", { body: { welcome: j.endpoint } }).catch(() => {});
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function disableReminders() {
  const prefs = read();
  write(null);
  if (prefs && supabase) await supabase.rpc("reminder_unsubscribe", { p_endpoint: prefs.endpoint });
  try {
    const reg = await serviceWorker();
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
  } catch {
    /* already gone */
  }
}

let lastTouch = "";
/** Resets the reminder clock whenever the reader reads. Cheap: at most once per lesson per visit. */
export async function touchReminders(currentSlug?: string, force = false) {
  const prefs = read();
  if (!prefs || prefs.lost || !supabase || !import.meta.env.PROD) return;
  const ctx = readingContext(currentSlug);
  const sig = `${ctx.p_last_title}|${ctx.p_next_slug}|${ctx.p_done}`;
  if (!force && sig === lastTouch) return;
  lastTouch = sig;
  const { data, error } = await supabase.rpc("reminder_touch", {
    p_endpoint: prefs.endpoint,
    ...ctx,
  });
  // The subscription was removed (notifications blocked, or the browser renewed it): offer to turn it back on.
  if (!error && data === false) write({ ...prefs, lost: true });
}
