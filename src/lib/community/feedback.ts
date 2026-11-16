import { z } from "zod";

/** Kinds of message the community feedback form accepts. Keep in sync with docs/database/community_feedback.sql. */
export const feedbackCategories = [
  {
    value: "lesson-correction",
    label: "Lesson correction",
    hint: "Something in a lesson is wrong, unclear or out of date.",
  },
  {
    value: "topic-suggestion",
    label: "Suggest a new topic",
    hint: "A concept, lesson, exercise or project you'd like to see.",
  },
  {
    value: "resource",
    label: "Recommend a learning resource",
    hint: "A book, article, course or documentation page worth adding.",
  },
  {
    value: "experience",
    label: "Learning experience or testimonial",
    hint: "How the course helped, or where it lost you. We'd ask before quoting you anywhere.",
  },
  {
    value: "general",
    label: "General feedback",
    hint: "Anything else, including offers to translate or review.",
  },
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number]["value"];
const categoryValues = feedbackCategories.map((c) => c.value) as [
  FeedbackCategory,
  ...FeedbackCategory[],
];

export const isFeedbackCategory = (v: unknown): v is FeedbackCategory =>
  typeof v === "string" && (categoryValues as string[]).includes(v);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : null));

export const feedbackSchema = z.object({
  category: z.enum(categoryValues, {
    errorMap: () => ({ message: "Choose what your message is about." }),
  }),
  name: optionalText(100),
  email: z
    .string()
    .trim()
    .max(200, "Please keep this under 200 characters.")
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || z.string().email().safeParse(v).success,
      "That email address doesn't look right.",
    ),
  related: optionalText(160),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence (10 characters or more).")
    .max(4000, "Please keep your message under 4,000 characters."),
  /** Honeypot: hidden from people, so anything typed here came from a bot. */
  website: z.string().optional(),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;
export type FeedbackFieldErrors = Partial<Record<keyof FeedbackInput, string>>;

export function fieldErrors(error: z.ZodError): FeedbackFieldErrors {
  const out: FeedbackFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof FeedbackInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Responses from /api/community-feedback. */
export type FeedbackStatus = { ready: boolean };
export type FeedbackResult =
  { ok: true } | { ok: false; error: string; fields?: FeedbackFieldErrors; unavailable?: boolean };
