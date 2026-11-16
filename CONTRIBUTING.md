# Contributing to Software Engineering Foundations

Thank you for helping. Software Engineering Foundations is an open learning resource that helps people
understand the principles, concepts and practices of software engineering needed to build reliable
software with AI. It is free to learn, open to contributions and improved by the community.

You don't need to be an expert to help. Reporting one confusing sentence is a real contribution.

## Ways to contribute

| You want to… | Do this |
| --- | --- |
| Fix a typo, error or outdated example | Open a **Content correction** issue, or send a pull request |
| Review a lesson's technical accuracy | Open a **Content correction** issue with your notes |
| Suggest a new topic, exercise or project | Open a **Topic suggestion** issue |
| Recommend a book, article or documentation | Open a **Resource recommendation** issue |
| Help translate | Start a discussion in the Translations category (or open a Topic suggestion) |
| Improve the website | Open a **Website bug** issue, or send a pull request |
| Share feedback privately | Use the form at `/contribute#feedback` on the website |

For anything larger than a small fix, please open an issue first so we can agree on the approach
before you spend time on it.

## Editorial and quality standards

Every change to the curriculum is checked against these standards:

- Every lesson teaches a meaningful software engineering concept.
- Explanations are accessible to beginners, with jargon defined when it first appears.
- Examples reflect practical, real-world software development.
- AI tools complement engineering knowledge; they never replace it.
- Technical explanations and code examples are reviewed before they are published.
- Content is revisited and updated when tools or good practice change.
- Contributors cite reliable references where appropriate.

## How review works

1. **Propose:** open an issue, a discussion, or a pull request.
2. **Discuss:** we talk through the idea and check it against the standards above.
3. **Review:** a maintainer reviews the change for accuracy, clarity and fit with the curriculum.
4. **Publish:** accepted changes are merged and become part of the official resource.

The founding maintainer, Solomon Promise, keeps editorial oversight. Anyone can propose a change;
changes are reviewed before they become part of the official learning resource.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content/parts12.json`, `parts34.json`, `parts56.json` | The 34 lessons, grouped by part (sections, key idea, walkthrough, mistakes, check questions, exercises) |
| `src/content/extras.json` | "Start here" pages, reference appendices and the bibliography |
| `src/content/projects.json` | The six hands-on projects |
| `src/content/figures.json` | Images used in lessons |
| `src/content/community.ts` | Copy for the Contribute, Roadmap and About pages |
| `src/config/community.ts` | Project name, GitHub repository and license settings |
| `src/routes/` | One file per page |
| `src/components/` | Shared interface pieces |

Lessons are JSON. When editing, keep the existing fields and structure, and check the page in the
browser afterwards.

## Working on the code

You need [Node.js 20+](https://nodejs.org) and Git.

```bash
npm install
npm run dev      # starts the site, usually at http://localhost:8080
npm test         # runs the tests
npm run lint     # checks code style
```

Pull request checklist:

- Keep each pull request focused on one change, and explain what changed and why.
- Run `npm test` and `npm run lint`, and check your change in the browser, including on a phone-sized screen.
- Don't commit secrets, API keys or personal data.
- Keep the site usable without an account and on slow connections.

## Licensing of contributions

By contributing, you agree that:

- Course content you contribute (lesson text, exercises, projects, reference material) is licensed
  under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), as described in
  [LICENSE-CONTENT.md](LICENSE-CONTENT.md).
- Code you contribute is licensed under the [MIT License](LICENSE).
- You have the right to submit it, and it doesn't copy material you aren't allowed to share.

## Community principles

Accessibility, collaboration, quality, openness, continuous learning and respect. Everyone should feel
welcome to learn, ask questions and contribute. Be kind, assume good intent, and critique ideas, not
people.
