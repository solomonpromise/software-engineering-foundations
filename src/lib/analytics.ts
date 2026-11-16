import { analytics } from "@/config/community";

/**
 * GoatCounter visitor statistics: no cookies and no personal data, so no consent banner is needed.
 * Runs only on the built site (not in development or inside an iframe). The site changes pages
 * without full reloads, so page views are sent from the router (see __root.tsx) rather than by
 * GoatCounter's own on-load count.
 */
type Count = { path: string; title?: string; event?: boolean };
declare global {
  interface Window {
    goatcounter?: { count?: (c: Count) => void };
  }
}

const base = import.meta.env.BASE_URL;
const queue: Count[] = [];
let started = false;

/** Pages that are never counted. */
const PRIVATE_PATHS = ["/admin"];

const enabled = () =>
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  window.self === window.top &&
  !!analytics.goatcounter;

/** "/software-engineering-foundations/learn/x" → "/learn/x", so reports read cleanly. */
function sitePath(pathname: string) {
  const b = base.replace(/\/$/, "");
  const p = b && pathname.startsWith(b) ? pathname.slice(b.length) : pathname;
  return p.replace(/\/$/, "") || "/";
}

function send(c: Count) {
  if (!enabled()) return;
  start();
  if (window.goatcounter?.count) window.goatcounter.count(c);
  else queue.push(c);
}

function start() {
  if (started || !analytics.goatcounter) return;
  started = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset["goatcounter"] = analytics.goatcounter;
  s.dataset["goatcounterSettings"] = JSON.stringify({ no_onload: true });
  s.onload = () => {
    for (const c of queue.splice(0)) window.goatcounter?.count?.(c);
  };
  document.head.append(s);
}

export function trackPageview(pathname: string) {
  const path = sitePath(pathname);
  if (PRIVATE_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return;
  send({ path, title: document.title });
}

/** A course event, e.g. "lesson-finished/what-software-is". Shown in GoatCounter as an event. */
export function trackEvent(name: string, title?: string) {
  send({ path: name, title: title ?? name, event: true });
}
