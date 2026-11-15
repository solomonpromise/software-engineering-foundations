# Software Foundations for Vibe Coders — course site

A free learning site based on *Software Foundations for Vibe Coders* by Solomon Promise:
34 lessons, six projects, glossary, reference appendices, bibliography, progress tracking,
an AI lesson tutor and links into the companion app, [Taskboard](https://github.com/solomonpromise/taskboard).

## Run it on your own computer

Needs [Node.js 20+](https://nodejs.org) (or [Bun](https://bun.sh)) and Git.

```bash
git clone <this repository's URL> software-foundations
cd software-foundations
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open the address it prints (usually http://localhost:8080). Lessons, glossary, projects and
progress tracking all work offline from your machine; progress is saved in your browser.

The "Ask about this lesson" tutor calls an AI service and only works on the hosted site
(it needs a server key that isn't included in the code).

## Build for production

```bash
npm run build
```

## Where things live

- `src/content/` — lessons, glossary, appendices, bibliography, projects, Taskboard map
- `src/routes/` — one file per page
- `src/lib/progress.ts` — reading progress (browser storage)
- `src/lib/appearance.ts` — themes and text size
