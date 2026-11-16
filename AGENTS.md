# Project notes for coding agents

Software Engineering Foundations is an open, community-driven learning site. The code lives at
<https://github.com/solomonpromise/software-engineering-foundations>.

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

- There are no accounts and no sign-in. Everything a learner does (progress, notes, bookmarks,
  practice answers, certificate name, tutor key and chats) stays in their own browser
  (`src/lib/progress.ts`, `src/lib/tutorKey.ts`). Don't add features that need a login.
- The lesson tutor works only with the learner's own xAI key, kept in their browser and sent only to
  api.x.ai (`src/lib/ai/tutor.ts`). The project has no shared AI cost and never sees the key.
- Supabase is used only to collect anonymous feedback (`lesson_feedback`, `community_feedback`).
  The public key may insert but never read; there are no SELECT policies, and the maintainer reads
  feedback in the Supabase dashboard. Schema lives in `docs/database/schema.sql`.
- Supabase values come from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (local `.env`,
  GitHub repository variables in CI). Never commit `.env` or any secret / service-role key.

## Offline reading

- `scripts/postbuild.mjs` generates the Workbox service worker (NetworkFirst for pages and images,
  StaleWhileRevalidate for code). `src/lib/pwa.ts` is the only registrar and must keep the
  development, iframe and `?sw=off` opt-outs.

## Community and licensing

- Repository links, project name and licenses are set in `src/config/community.ts`.
- Course content is CC BY-NC-SA 4.0 (`LICENSE-CONTENT.md`); code is MIT (`LICENSE`).
