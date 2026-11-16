// Static build for GitHub Pages: every page is prerendered to HTML at build time, and the site
// is served from a sub-path (BASE_PATH). There is no server at runtime. scripts/postbuild.mjs then
// adds 404.html and the offline service worker.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

/** Where the site lives, e.g. "/software-engineering-foundations/" on GitHub Pages, or "/" for a custom domain. */
const base = (process.env["BASE_PATH"] ?? "/software-engineering-foundations/").replace(
  /\/?$/,
  "/",
);

export default defineConfig({
  base,
  server: { port: 8080, strictPort: true },
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      router: { basepath: base.replace(/\/$/, "") || "/" },
      prerender: {
        enabled: true,
        crawlLinks: true,
        // curriculum.html, not curriculum/index.html: GitHub Pages then serves /curriculum without a redirect.
        autoSubfolderIndex: false,
        failOnError: true,
        // Links like /contribute?category=… are the same page; prerendering them would overwrite it.
        filter: ({ path }) => !path.includes("?") && !path.includes("#"),
      },
      // Pages not reachable by following links from the home page.
      pages: [
        { path: "/sitemap.xml", prerender: { enabled: true, outputPath: "/sitemap.xml" } },
      ],
      // A client-rendered shell, copied to 404.html so unknown addresses still load the app.
      spa: { enabled: true },
      sitemap: { enabled: false },
    }),
    viteReact(),
  ],
});
