function isRefusedContext() {
  if (!import.meta.env.PROD || typeof window === "undefined") return true;
  if (window.self !== window.top) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }
  const host = window.location.hostname.toLowerCase();
  if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(host.split(".")[0] ?? "")) {
    if (host.endsWith(".lovable.app") || host.endsWith(".gpt-eng.com") || host.endsWith(".gptengineer.run")) return true;
  }
  if (/^project--.+-dev$/.test(host.split(".")[0] ?? "") && (host.endsWith(".lovable.app") || host.endsWith(".gpt-eng.com") || host.endsWith(".gptengineer.run"))) return true;
  return host === "lovableproject.com" || host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev");
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.filter((r) => new URL(r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "", window.location.origin).pathname === "/sw.js").map((r) => r.unregister()));
}

/** The only app-shell service-worker registrar. Preview, development and ?sw=off always opt out. */
export function registerOfflineReading() {
  if (isRefusedContext()) { void unregisterAppWorkers(); return; }
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => { /* Offline support remains optional. */ });
}
