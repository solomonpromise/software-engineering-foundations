import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { ActionLink } from "@/components/community/ActionLink";
import { FeedbackForm } from "@/components/community/FeedbackForm";
import {
  contributionWays,
  editorialStandards,
  reviewSteps,
  type ContributionWay,
} from "@/content/community";
import { github, githubLinks, githubRepoLabel, licenses, project } from "@/config/community";
import { isFeedbackCategory, type FeedbackCategory } from "@/lib/community/feedback";

type Search = { category?: FeedbackCategory; related?: string };

export const Route = createFileRoute("/contribute")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(isFeedbackCategory(s["category"]) ? { category: s["category"] } : {}),
    ...(typeof s["related"] === "string" && s["related"].trim()
      ? { related: s["related"].slice(0, 160) }
      : {}),
  }),
  head: () => {
    const t = `Contribute — ${project.name}`;
    const d =
      "Help build the future of software engineering education: improve lessons, review explanations, suggest topics, recommend resources and report errors.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Contribute,
});

function githubHref(g: NonNullable<ContributionWay["github"]>) {
  if ("issue" in g) return githubLinks.newIssue(g.issue);
  return {
    repo: githubLinks.repo,
    contributing: githubLinks.contributing,
    discussions: githubLinks.discussions,
  }[g.to];
}

function Contribute() {
  const { category, related } = Route.useSearch();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-5xl px-5 pb-12 pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Contribute</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.08] md:text-6xl">
            Help Build the Future of Software Engineering Education
          </h1>
          <div className="mt-6 max-w-2xl space-y-4 text-lg">
            <p>Software engineering is evolving, and so should the way we learn it.</p>
            <p className="text-muted-foreground">
              This resource was created to make essential software engineering foundations
              accessible to everyone building with AI. But it doesn&rsquo;t have to be a one-person
              effort.
            </p>
            <p className="text-muted-foreground">
              We welcome software engineers, AI engineers, technical educators, developers, and
              learners to help improve this resource. Whether you want to review a lesson, suggest a
              topic, report an error, contribute an exercise, or recommend a learning resource, your
              contribution is welcome.
            </p>
          </div>
          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2 text-sm">
            {[
              ["#ways", "Ways to contribute"],
              ["#github", "GitHub"],
              ["#guidelines", "Review standards"],
              ["#feedback", "Send feedback"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full border border-border px-3.5 py-1.5 hover:border-primary hover:text-primary"
              >
                {label}
              </a>
            ))}
          </nav>
        </section>

        <section
          id="ways"
          aria-labelledby="ways-title"
          className="mx-auto max-w-5xl scroll-mt-24 px-5 py-12"
        >
          <h2 id="ways-title" className="font-serif text-3xl md:text-4xl">
            Ways to contribute
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pick whatever fits your experience and time. Small contributions, like reporting one
            confusing sentence, are just as welcome as new lessons.
          </p>
          <ol className="mt-8 grid gap-x-12 md:grid-cols-2">
            {contributionWays.map((w, i) => {
              const ghHref = w.github ? githubHref(w.github) : null;
              const showGithub = w.github && (ghHref || !w.form);
              return (
                <li key={w.id} id={w.id} className="flex gap-4 border-t border-border py-6">
                  <span className="font-serif text-2xl leading-none text-brass" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl leading-snug">{w.title}</h3>
                    <p className="mt-1 text-muted-foreground">{w.text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                      {w.form && (
                        <Link
                          to="/contribute"
                          search={{
                            category: w.form.category,
                            ...(w.form.related ? { related: w.form.related } : {}),
                          }}
                          hash="feedback"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:text-foreground"
                        >
                          {w.form.label} <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      )}
                      {showGithub && w.github && (
                        <ActionLink href={ghHref} variant="text">
                          {w.github.label}
                        </ActionLink>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          id="github"
          aria-labelledby="github-title"
          className="scroll-mt-24 border-y border-border bg-card"
        >
          <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
                <Github className="size-4" aria-hidden /> Open source
              </p>
              <h2 id="github-title" className="mt-3 font-serif text-3xl md:text-4xl">
                Build With Us on GitHub
              </h2>
              <p className="mt-4 text-muted-foreground">
                This is an open educational resource. You can contribute to its development, improve
                existing lessons, suggest new topics, or help us maintain the quality of the
                curriculum. Explore the repository and become part of the community.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ActionLink href={githubLinks.repo} variant="primary">
                  View GitHub Repository
                </ActionLink>
                {githubLinks.contributing ? (
                  <ActionLink href={githubLinks.contributing}>Contribution Guidelines</ActionLink>
                ) : (
                  <a
                    href="#guidelines"
                    className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    Contribution Guidelines
                  </a>
                )}
                <ActionLink href={githubLinks.newIssue("content-correction")}>
                  Report an Issue
                </ActionLink>
                <ActionLink href={githubLinks.newIssue("topic-suggestion")}>
                  Suggest a Topic
                </ActionLink>
                {githubLinks.discussions && (
                  <ActionLink href={githubLinks.discussions}>Join the Discussions</ActionLink>
                )}
              </div>
              {!github.repositoryIsPublic && (
                <p className="mt-4 text-sm text-muted-foreground" role="note">
                  The public repository is being prepared at{" "}
                  <span className="break-words font-mono text-[0.8em] text-foreground">
                    {githubRepoLabel}
                  </span>
                  . These buttons switch on when it opens. Until then, use the{" "}
                  <a href="#feedback" className="text-primary underline underline-offset-4">
                    feedback form
                  </a>{" "}
                  for corrections and suggestions.
                </p>
              )}
            </div>
            <div>
              <h3 className="font-serif text-2xl">How contributions work</h3>
              <ol className="mt-4 space-y-4">
                {reviewSteps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brass font-serif text-lg text-primary">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{s.title}</span>
                      <span className="block text-sm text-muted-foreground">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm text-muted-foreground">
                Submitting code? Fork the repository, make your change on a branch, and open a pull
                request that explains what changed and why.
              </p>
            </div>
          </div>
        </section>

        <section
          id="guidelines"
          aria-labelledby="guidelines-title"
          className="mx-auto max-w-5xl scroll-mt-24 px-5 py-14"
        >
          <h2 id="guidelines-title" className="font-serif text-3xl md:text-4xl">
            Editorial and quality standards
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Every contribution to the curriculum is checked against these standards before it is
            published.
          </p>
          <ul className="mt-6 max-w-3xl space-y-3">
            {editorialStandards.map((s) => (
              <li key={s} className="flex gap-3">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brass" aria-hidden />
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-3xl border-l-4 border-brass pl-5">
            <p className="font-semibold">Editorial oversight</p>
            <p className="mt-1 text-muted-foreground">
              Anyone can propose a change. The founding maintainer, {project.founder.name}, keeps
              editorial oversight: proposals are reviewed before they become part of the official
              learning resource.
            </p>
          </div>
          <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
            By contributing, you agree that lesson content you submit is shared under{" "}
            <a
              href={licenses.content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {licenses.content.name}
            </a>{" "}
            and code under the{" "}
            <a
              href={licenses.code.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {licenses.code.name} license
            </a>
            , the same terms as the rest of the project. Please read our{" "}
            <Link
              to="/about"
              hash="principles"
              className="underline underline-offset-2 hover:text-foreground"
            >
              community principles
            </Link>
            .
          </p>
        </section>

        <section
          id="feedback"
          aria-labelledby="feedback-title"
          className="scroll-mt-24 border-t border-border bg-secondary/30"
        >
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 id="feedback-title" className="font-serif text-3xl md:text-4xl">
              Help Us Make This Resource Better
            </h2>
            <p className="mt-2 text-muted-foreground">
              Send a lesson correction, a topic idea, a resource you recommend, or tell us about
              your learning experience. No account needed.
            </p>
            <div className="mt-8">
              <FeedbackForm category={category} related={related} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
