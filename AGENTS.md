# Project notes for coding agents

Software Engineering Foundations is an open, community-driven learning site. The code lives at
<https://github.com/solomonpromise/software-engineering-foundations> and is no longer connected to
Lovable: don't push to the old `lovable` remote.

## Hosting

- The site is fully static, hosted on GitHub Pages at
  <https://solomonpromise.github.io/software-engineering-foundations/>. `.github/workflows/deploy.yml`
  builds and deploys on every push to `main`.
- `npm run build` prerenders every page (TanStack Start `prerender` in `vite.config.ts`), then
  `scripts/postbuild.mjs` writes `404.html`, `.nojekyll` and the service worker into `dist/client`.
- There is no server at runtime. Don't add server routes (`server.handlers`) or server functions
  that pages depend on; do the work in the browser or at build time.
- The site lives under a base path (`BASE_PATH`, default `/software-engineering-foundations/`).
  Use TanStack `Link` for internal links, and `import.meta.env.BASE_URL` for files in `public/`.
  Never hard-code root paths like `/favicon.png`.

## Data and privacy

- Learner progress lives in localStorage (`src/lib/progress.ts`) and, when signed in, is merged
  (union) into `public.learner_progress` by `useProgressSync` in `__root` — local-first so the site
  works without an account.
- The lesson tutor works only with the learner's own xAI key, kept in their browser and sent only to
  api.x.ai (`src/lib/ai/tutor.ts`). The project has no shared AI cost and never sees the key.
- Lesson feedback and community feedback accept anonymous or signed-in submissions but are readable
  only by an admin role in `public.user_roles`; never expose them through public select policies.
- The Supabase project is still the one Lovable Cloud created. Schema changes go in
  `docs/database/` as SQL to apply by hand until the project has its own Supabase project and
  migration workflow. Don't edit `src/integrations/supabase/types.ts` or `client.ts` by hand
  (generated). Only publishable keys belong in the repo.

## Offline reading

- `scripts/postbuild.mjs` generates the Workbox service worker (NetworkFirst for pages and images,
  StaleWhileRevalidate for code). `src/lib/pwa.ts` is the only registrar and must keep the
  development, iframe, preview and `?sw=off` opt-outs.

## Community and licensing

- Repository links, project name and licenses are set in `src/config/community.ts`.
- Course content is CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`); code is MIT (`LICENSE`).
