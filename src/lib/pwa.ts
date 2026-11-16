function isRefusedContext() {
  if (!import.meta.env.PROD || typeof window === "undefined") return true;
  if (window.self !== window.top) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.filter((r) => new URL(r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "", window.location.origin).pathname === `${import.meta.env.BASE_URL}sw.js`).map((r) => r.unregister()));
}

/** The only app-shell service-worker registrar. Development, embedded (iframe) views and ?sw=off always opt out. */
export function registerOfflineReading() {
  if (isRefusedContext()) { void unregisterAppWorkers(); return; }
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => { /* Offline support remains optional. */ });
}
