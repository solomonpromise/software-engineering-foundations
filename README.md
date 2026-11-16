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

## Analytics on /admin

The site counts visits with [GoatCounter](https://www.goatcounter.com) (no cookies). The **Site
analytics** tab on `/admin` shows the numbers without opening GoatCounter. Because the GoatCounter
API key must stay secret, the page fetches them through a small Supabase Edge Function,
`supabase/functions/analytics`, which only answers maintainers listed in the `admins` table.

One-time setup:

1. In GoatCounter: your username (top right) → **API** → create a key with **Read statistics**
   permission only. Copy it; don't commit it or share it.
2. In Supabase: **Edge Functions → Secrets** → add `GOATCOUNTER_API_KEY` with that key.
3. In Supabase: **Edge Functions → Deploy a new function → Via Editor**, name it `analytics`, paste
   the contents of `supabase/functions/analytics/index.ts`, and deploy. (Or, with the Supabase CLI:
   `supabase functions deploy analytics --project-ref <your-project-ref>`.)

## Reader counts, letters and reminders

These features drive engagement without accounts:

- **Reader counts**: the home page shows how many people have opened a lesson and how many are
  reading right now. Lessons show a "reading river" of how far other readers got, finishers see
  "you're the 418th reader to finish this lesson", and the certificate shows the reader's number.
- **Letters to the next reader**: notes readers leave after a lesson, published only after a
  maintainer approves them on `/admin` (**Readers & letters** tab).
- **Reading reminders**: opt-in browser notifications after 1, 4 and 11 days away, worded from
  the reader's own goal and next lesson. No email.
- **Daily refresh** (`/review`), **weekly rhythm** and **milestone share cards** run entirely in
  the browser and need no setup.

One-time setup in Supabase:

1. **SQL Editor**: run `docs/database/engagement.sql` (after `schema.sql`). Reader counts and letters
   work from this point.
2. **Edge Functions → Secrets**: add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and
   `REMINDER_SECRET`. The public key must match `reminders.vapidPublicKey` in
   `src/config/community.ts`. To make a new pair: `npx web-push generate-vapid-keys`; for
   `REMINDER_SECRET`, any long random string.
3. **Edge Functions → Deploy a new function → Via Editor**: name it `reminders`, add both files
   from `supabase/functions/reminders/` (`index.ts` and `push.ts`), turn **off** "Verify JWT", and
   deploy. (CLI: `supabase functions deploy reminders --no-verify-jwt`.)
4. **Integrations → Cron** (enable the `pg_cron` and `pg_net` extensions if asked), then run in the
   SQL Editor, with your project reference and secret:

   ```sql
   select cron.schedule('reading-reminders', '5 * * * *', $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/reminders',
       headers := jsonb_build_object('Content-Type', 'application/json',
                                     'x-reminder-secret', '<REMINDER_SECRET>'),
       body := '{}'::jsonb)
   $$);
   ```

   It runs hourly and reminds each reader at the hour they chose.

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
- `src/lib/engagement/` and `src/components/engagement/` — reader counts, letters, reminders, daily refresh, share cards
- `supabase/functions/` — Edge Functions (`analytics` for /admin, `reminders` for notifications)
- `src/lib/appearance.ts` — themes and text size
- `docs/database/` — SQL for tables the site needs
- `scripts/postbuild.mjs` — 404 page and offline service worker for GitHub Pages

## License

- Course content: [CC BY-NC-SA 4.0](LICENSE-CONTENT.md)
- Code: [MIT](LICENSE)
