// Runs after `vite build` to finish the static site in dist/client for GitHub Pages:
//  - 404.html: the client-rendered shell, so addresses that weren't prerendered still load the app
//  - .nojekyll: serve files and folders that start with "_" as they are
//  - folder/index.html copies where a page and a folder share a name (about.html + about/)
//  - sw.js: the offline-reading service worker (registered by src/lib/pwa.ts), which also loads
//    public/push-handler.js to show reading reminders
import { copyFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateSW } from "workbox-build";

const out = "dist/client";
const base = (process.env.BASE_PATH ?? "/software-engineering-foundations/").replace(/\/?$/, "/");

await copyFile(`${out}/_shell.html`, `${out}/404.html`);
await writeFile(`${out}/.nojekyll`, "");

// Pages are written as name.html. Where a folder of the same name also exists (about.html and
// about/maintainer.html), GitHub Pages may redirect /about to /about/, so give that folder an index.
async function addFolderIndexes(dir) {
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    if (!(await stat(path)).isDirectory()) continue;
    const page = `${path}.html`;
    if (await stat(page).catch(() => null)) await copyFile(page, join(path, "index.html"));
    await addFolderIndexes(path);
  }
}
await addFolderIndexes(out);

// Nothing large is precached: pages, code and images are cached as the learner opens them, so
// lessons they have read stay available offline without a big download on the first visit.
const { count, size, warnings } = await generateSW({
  globDirectory: out,
  globPatterns: ["manifest.webmanifest", "favicon.png", "icon-192.png"],
  modifyURLPrefix: { "": base },
  swDest: `${out}/sw.js`,
  importScripts: ["push-handler.js"],
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
