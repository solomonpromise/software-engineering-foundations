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

Website: <https://softwareengineeringfoundations.lovable.app>

## Contribute

Improve a lesson, review a technical explanation, suggest a topic, recommend a resource, report an
error, help translate, or work on the website. Start with [CONTRIBUTING.md](CONTRIBUTING.md). The
project's direction is on the [roadmap](https://softwareengineeringfoundations.lovable.app/roadmap).

## Run it on your own computer

Needs [Node.js 20+](https://nodejs.org) (or [Bun](https://bun.sh)) and Git.

```bash
git clone https://github.com/solomonpromise/software-engineering-foundations.git
cd software-engineering-foundations
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open the address it prints (usually http://localhost:8080). Lessons, glossary, projects and progress
tracking work offline from your machine; progress is saved in your browser.

The lesson tutor uses each learner's own xAI (Grok) key, added in the tutor's settings. Accounts,
synced progress and the feedback forms need a Supabase project (see `.env` for the variable names and
`docs/database/` for extra tables).

```bash
npm test           # run the tests
npm run lint       # check code style
npm run build      # build for production
```

## Where things live

- `src/content/` — lessons, glossary, appendices, bibliography, projects, community page copy
- `src/config/community.ts` — project name, GitHub repository and license settings
- `src/routes/` — one file per page
- `src/lib/progress.ts` — reading progress (browser storage)
- `src/lib/appearance.ts` — themes and text size
- `docs/database/` — SQL for tables the site needs

## License

- Course content: [CC BY-NC-SA 4.0](LICENSE-CONTENT.md)
- Code: [MIT](LICENSE)
