// Runs after `vite build` to finish the static site in dist/client for GitHub Pages:
//  - 404.html: the client-rendered shell, so addresses that weren't prerendered still load the app
//  - .nojekyll: serve files and folders that start with "_" as they are
//  - sw.js: the offline-reading service worker (registered by src/lib/pwa.ts)
import { copyFile, writeFile } from "node:fs/promises";
import { generateSW } from "workbox-build";

const out = "dist/client";
const base = (process.env.BASE_PATH ?? "/software-engineering-foundations/").replace(/\/?$/, "/");

await copyFile(`${out}/_shell.html`, `${out}/404.html`);
await writeFile(`${out}/.nojekyll`, "");

// Nothing large is precached: pages, code and images are cached as the learner opens them, so
// lessons they have read stay available offline without a big download on the first visit.
const { count, size, warnings } = await generateSW({
  globDirectory: out,
  globPatterns: ["manifest.webmanifest", "favicon.png", "icon-192.png"],
  modifyURLPrefix: { "": base },
  swDest: `${out}/sw.js`,
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  sourcemap: false,
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" && url.origin === self.location.origin,
      handler: "NetworkFirst",
      options: {
        cacheName: "sf-lesson-pages",
        networkTimeoutSeconds: 3,
        cacheableResponse: { statuses: [200] },
        expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ request, url }) =>
        url.origin === self.location.origin &&
        ["script", "style", "font"].includes(request.destination),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "sf-code",
        cacheableResponse: { statuses: [200] },
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ request, url }) =>
        request.destination === "image" && url.origin === self.location.origin,
      handler: "NetworkFirst",
      options: {
        cacheName: "sf-lesson-images",
        cacheableResponse: { statuses: [200] },
        expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});
for (const w of warnings) console.warn(`[postbuild] ${w}`);
console.log(
  `[postbuild] 404.html, .nojekyll and sw.js written (${count} precached files, ${size} bytes)`,
);
