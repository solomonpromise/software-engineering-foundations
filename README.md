# Software Engineering Foundations

**For the AI Building Era.** An open learning resource helping people understand the principles,
concepts and practices of software engineering required to build reliable software with AI.

> AI is changing how we build software, but understanding the foundations of software engineering
> remains valuable and indispensable.

Free to learn · Open to contributions · Community-driven · Practical and accessible ·
Grounded in software engineering fundamentals · Continuously evolving

The site has 34 lessons in six parts, six hands-on projects, a glossary, reference appendices, a
bibliography, progress tracking, an optional AI lesson tutor, and links into the companion app,
[Taskboard](https://github.com/solomonpromise/taskboard). It grew out of the book
*Software Foundations for Vibe Coders* by Solomon Promise, the project's founding maintainer.

Website: <https://solomonpromise.github.io/software-engineering-foundations/>

## Contribute

Improve a lesson, review a technical explanation, suggest a topic, recommend a resource, report an
error, help translate, or work on the website. Start with [CONTRIBUTING.md](CONTRIBUTING.md). The
project's direction is on the [roadmap](https://solomonpromise.github.io/software-engineering-foundations/roadmap).

## Run it on your own computer

Needs [Node.js 20+](https://nodejs.org) (or [Bun](https://bun.sh)) and Git.

```bash
git clone https://github.com/solomonpromise/software-engineering-foundations.git
cd software-engineering-foundations
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open <http://localhost:8080/software-engineering-foundations/>. Lessons, glossary, projects and
progress tracking work from your machine; progress is saved in your browser.

There are no accounts: learners' progress, notes and settings stay in their own browser. The lesson
tutor uses each learner's own xAI (Grok) key and talks to xAI straight from the browser.

The feedback forms save anonymous messages to a Supabase database. To try them locally, copy
`.env.example` to `.env` and fill in a Supabase project's URL and publishable key, after running
`docs/database/schema.sql` in that project. Without a `.env`, everything else works and the forms
stay switched off.

Maintainers read feedback at `/admin` (not linked from the site). It signs in with a Supabase
account that is listed in the `admins` table; see the last section of `docs/database/schema.sql`.

```bash
npm test           # run the tests
npm run lint       # check code style
npm run build      # build the static site into dist/client
```

## How it's published

The site is static and hosted on GitHub Pages. Every push to `main` runs
`.github/workflows/deploy.yml`, which builds the site (every page prerendered to HTML) and deploys
it. To serve it from your own domain instead of the `github.io` sub-path, set the repository
variable `BASE_PATH` to `/`, add the domain in **Settings → Pages**, and update `siteUrl` in
`src/config/community.ts`. The feedback forms read the repository variables `VITE_SUPABASE_URL`
and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time.

## Where things live

- `src/content/` — lessons, glossary, appendices, bibliography, projects, community page copy
- `src/config/community.ts` — project name, GitHub repository and license settings
- `src/routes/` — one file per page
- `src/lib/progress.ts` — reading progress (browser storage)
- `src/lib/appearance.ts` — themes and text size
- `docs/database/` — SQL for tables the site needs
- `scripts/postbuild.mjs` — 404 page and offline service worker for GitHub Pages

## License

- Course content: [CC BY-NC-SA 4.0](LICENSE-CONTENT.md)
- Code: [MIT](LICENSE)
