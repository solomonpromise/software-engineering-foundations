import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { chapters } from "@/content/lessons";
import { githubLinks } from "@/config/community";
import {
  feedbackCategories,
  feedbackSchema,
  fieldErrors,
  type FeedbackCategory,
  type FeedbackFieldErrors,
} from "@/lib/community/feedback";
import { feedbackReady, sendFeedback } from "@/lib/community/feedback-client";
import { ActionLink } from "./ActionLink";

type Availability = "checking" | "ready" | "unavailable";
type Phase = "editing" | "sending" | "sent";

const field = "mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-base";

export function FeedbackForm({
  category,
  related,
}: {
  category?: FeedbackCategory | undefined;
  related?: string | undefined;
}) {
  const id = useId();
  const [availability, setAvailability] = useState<Availability>("checking");
  const [phase, setPhase] = useState<Phase>("editing");
  const [values, setValues] = useState({
    category: category ?? ("" as FeedbackCategory | ""),
    name: "",
    email: "",
    related: related ?? "",
    message: "",
    website: "",
  });
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [formError, setFormError] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Links like /contribute?category=resource#feedback pre-select the matching category.
  useEffect(() => {
    if (category || related)
      setValues((v) => ({ ...v, category: category ?? v.category, related: related ?? v.related }));
  }, [category, related]);

  useEffect(() => {
    let alive = true;
    feedbackReady()
      .then((ready) => alive && setAvailability(ready ? "ready" : "unavailable"))
      .catch(() => alive && setAvailability("ready")); // Offline or flaky: let them try; errors are handled on send.
    return () => {
      alive = false;
    };
  }, []);

  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k as keyof FeedbackFieldErrors]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const parsed = feedbackSchema.safeParse(values);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      setErrors(fe);
      const first = (["category", "name", "email", "related", "message"] as const).find(
        (k) => fe[k],
      );
      if (first) document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    setPhase("sending");
    try {
      const result = await sendFeedback(values);
      if (result.ok) {
        setPhase("sent");
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }
      if (result.unavailable) setAvailability("unavailable");
      setErrors(result.fields ?? {});
      setFormError(result.error || "Your message couldn't be sent. Please try again.");
    } catch {
      setFormError("Your message couldn't be sent. Check your internet connection and try again.");
    }
    setPhase("editing");
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  if (availability === "checking") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Loading
        the feedback form…
      </p>
    );
  }

  if (availability === "unavailable") {
    const issue = githubLinks.newIssue("content-correction");
    return (
      <div className="rounded-xl border border-border bg-card p-6" role="status">
        <p className="font-semibold">The feedback form isn't accepting messages yet.</p>
        <p className="mt-2 text-muted-foreground">
          We're setting up where messages are stored. Until then, you can rate any lesson with the
          &ldquo;Was this lesson helpful?&rdquo; box at the end of the lesson
          {issue ? ", or open an issue on GitHub" : ""}.
        </p>
        {issue && (
          <div className="mt-4">
            <ActionLink href={issue}>Open an issue on GitHub</ActionLink>
          </div>
        )}
      </div>
    );
  }

  if (phase === "sent") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-xl border border-accent/50 bg-card p-6 outline-none"
      >
        <p className="flex items-center gap-2 font-serif text-2xl">
          <CheckCircle2 className="size-6 text-accent" aria-hidden /> Thank you. Your message was
          sent.
        </p>
        <p className="mt-2 text-muted-foreground">
          It goes privately to the maintainers, who read every message.
          {values.email ? " If a reply would help, we'll use the email you gave." : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setValues((v) => ({ ...v, message: "", related: "" }));
            setPhase("editing");
          }}
          className="mt-4 text-sm font-semibold text-primary underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  const describe = (k: keyof FeedbackFieldErrors, extra?: string) =>
    [errors[k] ? `${id}-${k}-error` : "", extra ?? ""].filter(Boolean).join(" ") || undefined;
  const ErrorText = ({ k }: { k: keyof FeedbackFieldErrors }) =>
    errors[k] ? (
      <p id={`${id}-${k}-error`} className="mt-1 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;
  const border = (k: keyof FeedbackFieldErrors) =>
    errors[k] ? "border-destructive" : "border-input";
  const sending = phase === "sending";

  return (
    <form onSubmit={submit} noValidate className="space-y-6" aria-busy={sending}>
      <fieldset aria-describedby={describe("category")}>
        <legend className="font-semibold">
          What is your message about?{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {feedbackCategories.map((c, i) => (
            <label
              key={c.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${values.category === c.value ? "border-primary bg-secondary/50" : "border-border"}`}
            >
              <input
                type="radio"
                name={`${id}-category`}
                id={i === 0 ? `${id}-category` : undefined}
                value={c.value}
                checked={values.category === c.value}
                onChange={set("category")}
                className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
              />
              <span>
                <span className="block font-medium">{c.label}</span>
                <span className="block text-sm text-muted-foreground">{c.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <ErrorText k="category" />
      </fieldset>

      <div>
        <label htmlFor={`${id}-related`} className="font-semibold">
          Related lesson or topic{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id={`${id}-related`}
          list={`${id}-lessons`}
          value={values.related}
          onChange={set("related")}
          maxLength={160}
          placeholder="Start typing a lesson title, or describe the topic"
          aria-invalid={!!errors.related}
          aria-describedby={describe("related")}
          className={`${field} ${border("related")}`}
        />
        <datalist id={`${id}-lessons`}>
          {chapters.map((c) => (
            <option key={c.slug} value={`Lesson ${c.number}: ${c.title}`} />
          ))}
        </datalist>
        <ErrorText k="related" />
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="font-semibold">
          Your message{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </label>
        <textarea
          id={`${id}-message`}
          value={values.message}
          onChange={set("message")}
          rows={6}
          maxLength={4000}
          required
          aria-invalid={!!errors.message}
          aria-describedby={describe("message", `${id}-message-hint`)}
          placeholder="Be as specific as you can: what you read, what you expected, and what would make it better. Include links for resources."
          className={`${field} ${border("message")} leading-relaxed`}
        />
        <p id={`${id}-message-hint`} className="mt-1 text-xs text-muted-foreground">
          {values.message.trim().length} / 4,000 characters. Please don't include passwords or API
          keys.
        </p>
        <ErrorText k="message" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="font-semibold">
            Name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${id}-name`}
            value={values.name}
            onChange={set("name")}
            autoComplete="name"
            maxLength={100}
            aria-invalid={!!errors.name}
            aria-describedby={describe("name")}
            className={`${field} ${border("name")}`}
          />
          <ErrorText k="name" />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="font-semibold">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${id}-email`}
            type="email"
            value={values.email}
            onChange={set("email")}
            autoComplete="email"
            maxLength={200}
            aria-invalid={!!errors.email}
            aria-describedby={describe("email", `${id}-email-hint`)}
            className={`${field} ${border("email")}`}
          />
          <p id={`${id}-email-hint`} className="mt-1 text-xs text-muted-foreground">
            Only if you'd like a reply. It's never shown publicly or shared.
          </p>
          <ErrorText k="email" />
        </div>
      </div>

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input
          id={`${id}-website`}
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set("website")}
        />
      </div>

      {formError && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive outline-none"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {sending && (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          )}
          {sending ? "Sending…" : "Send feedback"}
        </button>
        <p className="text-xs text-muted-foreground">
          Messages go privately to the maintainers. They are not published.
        </p>
      </div>
    </form>
  );
}
