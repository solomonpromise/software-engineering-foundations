import type { FeedbackCategory } from "@/lib/community/feedback";
import type { IssueTemplate } from "@/config/community";

/** Copy for the community pages (/contribute, /roadmap, /about), kept apart from the layout. */

export type ContributionWay = {
  id: string;
  title: string;
  text: string;
  /** On-site action: opens the feedback form with this category (always available). */
  form?: { label: string; category: FeedbackCategory; related?: string };
  /** GitHub action: shown once the public repository is live. */
  github?: { label: string } & (
    { issue: IssueTemplate } | { to: "repo" | "contributing" | "discussions" }
  );
};

export const contributionWays: ContributionWay[] = [
  {
    id: "improve-lessons",
    title: "Improve existing lessons",
    text: "Rewrite an explanation that didn't click, tighten an example, or add the missing step that would have helped you.",
    form: { label: "Suggest an improvement", category: "lesson-correction" },
    github: { label: "Propose an edit", to: "contributing" },
  },
  {
    id: "review",
    title: "Review technical explanations",
    text: "Experienced engineers: check that lessons are accurate, current and match how good teams work in practice.",
    form: { label: "Send a review note", category: "lesson-correction" },
    github: { label: "Open a review issue", issue: "content-correction" },
  },
  {
    id: "exercises",
    title: "Contribute practical exercises and projects",
    text: "Design a hands-on task, a case study or a project step that turns a lesson's idea into practice.",
    form: {
      label: "Propose an exercise",
      category: "topic-suggestion",
      related: "Exercise or project idea",
    },
    github: { label: "Read how to contribute", to: "contributing" },
  },
  {
    id: "topics",
    title: "Suggest new topics",
    text: "Tell us which software engineering foundations people building with AI still struggle with.",
    form: { label: "Suggest a topic", category: "topic-suggestion" },
    github: { label: "Suggest it on GitHub", issue: "topic-suggestion" },
  },
  {
    id: "resources",
    title: "Recommend learning resources",
    text: "Point us to books, articles, documentation and courses that explain a concept well.",
    form: { label: "Recommend a resource", category: "resource" },
    github: { label: "Recommend it on GitHub", issue: "resource-recommendation" },
  },
  {
    id: "errors",
    title: "Report errors and outdated information",
    text: "Tools and practices change quickly. If something is wrong or out of date, let us know where.",
    form: { label: "Report an error", category: "lesson-correction" },
    github: { label: "Report it on GitHub", issue: "content-correction" },
  },
  {
    id: "translate",
    title: "Help translate the content",
    text: "Help more people learn in their own language. Tell us which language you can help with.",
    form: { label: "Offer to translate", category: "general", related: "Translation" },
    github: { label: "Discuss translations", to: "discussions" },
  },
  {
    id: "platform",
    title: "Contribute to the platform",
    text: "Improve the website itself: accessibility, performance, offline reading, bugs and new learning tools.",
    github: { label: "Report a website bug", issue: "bug-report" },
  },
];

export const editorialStandards = [
  "Every lesson teaches a meaningful software engineering concept.",
  "Explanations are accessible to beginners, with jargon defined when it first appears.",
  "Examples reflect practical, real-world software development.",
  "AI tools complement engineering knowledge; they never replace it.",
  "Technical explanations and code examples are reviewed before they are published.",
  "Content is revisited and updated when tools or good practice change.",
  "Contributors cite reliable references where appropriate.",
];

export const reviewSteps = [
  {
    title: "Propose",
    text: "Open an issue, start a discussion, send feedback here, or submit a pull request.",
  },
  {
    title: "Discuss",
    text: "We talk through the idea and check it against the editorial standards.",
  },
  {
    title: "Review",
    text: "A maintainer reviews the change for accuracy, clarity and fit with the curriculum.",
  },
  {
    title: "Publish",
    text: "Accepted changes become part of the official resource, with credit to the contributor.",
  },
];

export const principles = [
  {
    title: "Accessibility",
    text: "Learning resources should be accessible regardless of someone's financial background.",
  },
  {
    title: "Collaboration",
    text: "Software engineering education benefits from shared knowledge and experience.",
  },
  {
    title: "Quality",
    text: "Educational content should be accurate, practical, and technically sound.",
  },
  {
    title: "Openness",
    text: "People should be encouraged to suggest improvements and contribute.",
  },
  {
    title: "Continuous learning",
    text: "Software engineering evolves, and our learning resources should evolve with it.",
  },
  {
    title: "Respect",
    text: "Everyone should feel welcome to learn, ask questions, and contribute.",
  },
];

export type RoadmapPhase = {
  number: number;
  title: string;
  status?: "Done" | "In progress";
  items: string[];
};

export const roadmapPhases: RoadmapPhase[] = [
  {
    number: 1,
    title: "Initial release",
    status: "Done",
    items: [
      "Publish foundational software engineering lessons.",
      "Make the resource freely accessible.",
      "Establish the project's identity.",
    ],
  },
  {
    number: 2,
    title: "Community contributions",
    status: "In progress",
    items: [
      "Open the GitHub repository.",
      "Invite technical reviewers.",
      "Collect community feedback.",
      "Establish contribution guidelines.",
    ],
  },
  {
    number: 3,
    title: "Learning expansion",
    items: [
      "Introduce practical exercises.",
      "Add real-world case studies.",
      "Introduce collaborative projects.",
      "Expand the curriculum where necessary.",
    ],
  },
  {
    number: 4,
    title: "Community learning",
    items: [
      "Encourage community-led discussions.",
      "Introduce collaborative study activities.",
      "Encourage experienced engineers to support learners.",
    ],
  },
  {
    number: 5,
    title: "Continuous improvement",
    items: [
      "Regularly review existing lessons.",
      "Update outdated examples.",
      "Incorporate community contributions.",
      "Maintain the relevance and technical accuracy of the curriculum.",
    ],
  },
];
