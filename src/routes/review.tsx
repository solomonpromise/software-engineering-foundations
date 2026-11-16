import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { trackEvent } from "@/lib/analytics";
import { dueCards, grade, type Card } from "@/lib/engagement/review";
import { getProgress, localDay, recordReadingDay, setReview, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Daily refresh — Software Engineering Foundations" },
      {
        name: "description",
        content: "Three questions a day from lessons you've finished, timed so the ideas stick.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const progress = useProgress();
  const today = localDay();
  // Today's set is fixed when the page opens, so grading a card doesn't reshuffle the rest.
  const [cards, setCards] = useState<Card[] | null>(null);
  useEffect(() => setCards(dueCards(getProgress(), localDay())), []);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const finished = cards !== null && i >= cards.length;
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return dueCards(progress, localDay(d), 99).length;
  }, [progress]);

  const answer = (got: boolean) => {
    const card = cards![i]!;
    setReview(grade(getProgress().review, card.key, got, today));
    setResults((r) => [...r, got]);
    setShown(false);
    setI((x) => x + 1);
    if (i + 1 >= cards!.length) {
      recordReadingDay();
      trackEvent("daily-refresh-done", "Daily refresh finished");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-14">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-accent">
          <Sparkles className="size-4" /> Daily refresh
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Three ideas, two minutes.</h1>
        <p className="mt-3 text-muted-foreground">
          Questions come back from lessons you&rsquo;ve finished, just as you&rsquo;re about to
          forget them. Get one right and it returns later; miss it and you&rsquo;ll see it again
          tomorrow.
        </p>

        {cards === null ? null : progress.done.length === 0 ? (
          <Panel>
            <p className="font-serif text-2xl">Nothing to refresh yet</p>
            <p className="mt-2 text-muted-foreground">
              Finish a lesson and its questions will start coming back here.
            </p>
            <Link
              to="/curriculum"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              Go to the lessons <ArrowRight className="size-4" />
            </Link>
          </Panel>
        ) : cards.length === 0 || finished ? (
          <Panel>
            <CheckCircle2 className="size-10 text-accent" />
            <p className="mt-3 font-serif text-2xl">
              {results.length
                ? `Refreshed: ${results.filter(Boolean).length} of ${results.length} remembered.`
                : "All refreshed for today."}
            </p>
            <p className="mt-2 text-muted-foreground">
              {tomorrow > 0
                ? `${Math.min(3, tomorrow)} more ${Math.min(3, tomorrow) === 1 ? "idea comes" : "ideas come"} back tomorrow.`
                : "Come back tomorrow for the next ones."}
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold hover:border-primary"
            >
              Back to your learning
            </Link>
          </Panel>
        ) : (
          <div className="mt-10">
            <div
              className="flex items-center gap-2"
              aria-label={`Question ${i + 1} of ${cards.length}`}
            >
              {cards.map((c, n) => (
                <span
                  key={c.key}
                  className={`h-1.5 flex-1 rounded-full ${n < i ? "bg-accent" : n === i ? "bg-brass" : "bg-secondary"}`}
                />
              ))}
            </div>
            <CardView
              card={cards[i]!}
              shown={shown}
              onShow={() => setShown(true)}
              onAnswer={answer}
            />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">
      {children}
    </div>
  );
}

function CardView({
  card,
  shown,
  onShow,
  onAnswer,
}: {
  card: Card;
  shown: boolean;
  onShow: () => void;
  onAnswer: (got: boolean) => void;
}) {
  return (
    <article className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <Link
        to="/learn/$slug"
        params={{ slug: card.slug }}
        className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
      >
        From Lesson {card.lessonNumber}: {card.lessonTitle}
      </Link>
      <p className="mt-4 font-serif text-2xl leading-snug">{card.q}</p>
      {!shown ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">Answer it in your head first.</p>
          <button
            type="button"
            onClick={onShow}
            className="mt-5 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Show the answer
          </button>
        </>
      ) : (
        <>
          <p className="mt-5 border-l-4 border-accent pl-4 text-muted-foreground">{card.a}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onAnswer(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
            >
              <CheckCircle2 className="size-4" /> I remembered
            </button>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-semibold hover:border-primary"
            >
              <RotateCcw className="size-4" /> Not quite
            </button>
          </div>
        </>
      )}
    </article>
  );
}
