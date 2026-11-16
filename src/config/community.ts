/**
 * Community and open-source settings, kept in one place.
 *
 * To go live on GitHub:
 *  1. Create the public repository named below and push this project to it.
 *  2. Turn on Issues and Discussions in the repository settings.
 *  3. Set `repositoryIsPublic` to true. Every GitHub button on the site then becomes a working link.
 */
export const project = {
  name: "Software Engineering Foundations",
  descriptor: "For the AI Building Era",
  description:
    "An open learning resource helping people understand the principles, concepts, and practices of software engineering required to build reliable software with AI.",
  /** Public address of the site, without a trailing slash (GitHub Pages project site). */
  siteUrl: "https://solomonpromise.github.io/software-engineering-foundations",
  book: { title: "Software Foundations for Vibe Coders", author: "Solomon Promise" },
  founder: { name: "Solomon Promise" },
} as const;

export const github = {
  owner: "solomonpromise",
  repo: "software-engineering-foundations",
  defaultBranch: "main",
  /** Leave false until the repository exists and is public, so no button points at a missing page. */
  repositoryIsPublic: true,
  /** Set true once Discussions are switched on in the repository settings. */
  discussionsEnabled: true,
} as const;

export const licenses = {
  content: {
    name: "CC BY-NC-SA 4.0",
    title: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  code: { name: "MIT", title: "MIT License", url: "https://opensource.org/license/mit" },
} as const;

/**
 * Turns a path from Vite (which already includes the base path, e.g. an imported image) into an
 * absolute URL, for metadata like og:image that must be absolute.
 */
export const absoluteUrl = (pathWithBase: string) =>
  new URL(pathWithBase, new URL(project.siteUrl).origin).toString();

const repoUrl = `https://github.com/${github.owner}/${github.repo}`;

export type IssueTemplate =
  "content-correction" | "topic-suggestion" | "resource-recommendation" | "bug-report";

/** Every GitHub address the site uses. Each is null while the repository is not public yet. */
export const githubLinks = {
  repo: github.repositoryIsPublic ? repoUrl : null,
  contributing: github.repositoryIsPublic
    ? `${repoUrl}/blob/${github.defaultBranch}/CONTRIBUTING.md`
    : null,
  issues: github.repositoryIsPublic ? `${repoUrl}/issues` : null,
  pulls: github.repositoryIsPublic ? `${repoUrl}/pulls` : null,
  discussions:
    github.repositoryIsPublic && github.discussionsEnabled ? `${repoUrl}/discussions` : null,
  /**
   * A new issue using one of the forms in .github/ISSUE_TEMPLATE. `fields` pre-fills form inputs by
   * their `id` (GitHub supports this for issue forms), plus `title`.
   */
  newIssue(template: IssueTemplate, fields: Record<string, string> = {}) {
    if (!github.repositoryIsPublic) return null;
    const q = new URLSearchParams({ template: `${template}.yml` });
    for (const [k, v] of Object.entries(fields)) if (v) q.set(k, v);
    return `${repoUrl}/issues/new?${q.toString()}`;
  },
  /** Opens GitHub's editor for a file in the repository, which guides a contributor to a pull request. */
  editFile(path: string) {
    return github.repositoryIsPublic ? `${repoUrl}/edit/${github.defaultBranch}/${path}` : null;
  },
};

/** The repository address as text, for places that explain where the project will live. */
export const githubRepoLabel = `github.com/${github.owner}/${github.repo}`;
