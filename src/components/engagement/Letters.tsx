import { Link } from "@tanstack/react-router";
import { Feather, Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { chapters } from "@/content/lessons";
import { trackEvent } from "@/lib/analytics";
import {
  COURSE,
  letterSent,
  lettersEnabled,
  sendLetter,
  signature,
  timeAgo,
  useLetters,
  type Letter,
} from "@/lib/engagement/letters";

/** One letter, as a slightly tilted note on lined paper. */
export function PaperNote({
  letter,
  tilt = -1,
  lessonTag = false,
}: {
  letter: Letter;
  tilt?: number;
  lessonTag?: boolean;
}) {
  const lesson = chapters.find((c) => c.slug === letter.lesson_slug);
  return (
    <figure
      className="paper-note relative rounded-sm px-5 pb-4 pt-5"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-2 rounded-[2px] bg-[var(--tape)]"
      />
      <blockquote className="font-serif text-xl italic leading-[2rem]">
        &ldquo;{letter.message}&rdquo;
      </blockquote>
      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 text-sm opacity-80">
        <span>— {signature(letter)}</span>
        <span className="text-xs">{timeAgo(letter.approved_at)}</span>
      </figcaption>
      {lessonTag && (
        <p className="mt-3 border-t border-[var(--paper-line)] pt-2 text-xs">
          {lesson ? (
            <Link
              to="/learn/$slug"
              params={{ slug: lesson.slug }}
              className="font-semibold underline underline-offset-4"
            >
              Left at Lesson {lesson.number}: {lesson.title}
            </Link>
          ) : (
            "To someone just starting the course"
          )}
        </p>
      )}
    </figure>
  );
}

/** At the end of a lesson: a note from someone who finished it before you. */
export function LettersForLesson({ slug, course = false }: { slug: string; course?: boolean }) {
  const letters = useLetters(course ? COURSE : slug);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [slug]);
  if (!letters?.length) return null;
  const letter = letters[i % letters.length]!;
  return (
    <section aria-labelledby={`letters-${slug}`} className="mt-12 print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <Mail className="size-4" /> {course ? "Before you begin" : "A note left for you"}
          </p>
          <h2 id={`letters-${slug}`} className="mt-1 font-serif text-2xl">
            {course
              ? "From someone who finished the whole course"
              : "From someone who finished this lesson before you"}
          </h2>
        </div>
        {letters.length > 1 && (
          <button
            type="button"
            onClick={() => setI((x) => x + 1)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <RefreshCw className="size-3.5" /> Read another ({letters.length})
          </button>
        )}
      </div>
      <div className="mt-5 px-1">
        <PaperNote key={letter.id} letter={letter} tilt={i % 2 ? 0.8 : -0.8} />
      </div>
    </section>
  );
}

/** After finishing a lesson (or the course): write to whoever comes next. */
export function LeaveALetter({ slug, course = false }: { slug: string; course?: boolean }) {
  const key = course ? COURSE : slug;
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setSent(letterSent(key));
    setOpen(false);
    setMessage("");
    setError("");
  }, [key]);
  if (!lettersEnabled()) return null;

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="flex items-center gap-2 font-serif text-xl">
          <Feather className="size-5 text-accent" /> Your note is on its way
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {course
            ? "Once it's approved, it will greet people opening Lesson 1."
            : "Once it's approved, it will be waiting for the next person who finishes this lesson."}
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await sendLetter({ lesson: key, message, name, place });
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setSent(true);
    trackEvent(course ? "letter-sent/course" : "letter-sent/lesson", "Letter to the next reader");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-serif text-xl">
        <Feather className="size-5 text-accent" />{" "}
        {course ? "Write to someone just starting" : "Leave a note for the next reader"}
      </p>
      {!open ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {course
              ? "What would you tell yourself on day one? Your note can greet new readers at Lesson 1."
              : "What made this click for you? Someone who reads this lesson after you will find your note at the end."}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Write a note
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <label className="block text-sm font-semibold" htmlFor={`letter-${key}`}>
            Your note{" "}
            <span className="font-normal text-muted-foreground">({message.trim().length}/600)</span>
          </label>
          <textarea
            id={`letter-${key}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={600}
            rows={4}
            required
            className="paper-note w-full rounded-sm px-3 py-1.5 font-serif text-lg italic leading-[2rem]"
            placeholder={
              course
                ? "Take it one lesson at a time. By Part 3 it all starts connecting…"
                : "The restaurant example is what made it click for me…"
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              First name <span className="text-muted-foreground">(optional)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoComplete="given-name"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Where you read from <span className="text-muted-foreground">(optional)</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                maxLength={60}
                placeholder="e.g. Lagos"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Notes are read by the maintainer before they appear, and may be shown on this site.
            Please leave out links and contact details.
          </p>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Sending…" : "Leave this note"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-muted-foreground underline"
            >
              Not now
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
