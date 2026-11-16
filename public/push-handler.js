// Loaded by the service worker (sw.js, see scripts/postbuild.mjs): shows reading reminders sent by
// the Supabase "reminders" function, and opens the right lesson when one is tapped.
/* global self, clients */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const scope = self.registration.scope;
  event.waitUntil(
    self.registration.showNotification(data.title || "Software Engineering Foundations", {
      body: data.body || "Your place in the course is saved.",
      icon: `${scope}icon-192.png`,
      badge: `${scope}favicon.png`,
      tag: "reading-reminder",
      data: { url: data.url || scope },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const target = event.notification.data && event.notification.data.url;
  const url = typeof target === "string" && target.startsWith(scope) ? target : scope;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((open) => {
      for (const c of open) {
        if (c.url.startsWith(scope) && "focus" in c) {
          return c.focus().then((w) => (w && "navigate" in w ? w.navigate(url) : w));
        }
      }
      return clients.openWindow(url);
    }),
  );
});
