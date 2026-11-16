import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { dueCards } from "@/lib/engagement/review";
import { rhythmMessage, weeklyRhythm, type Rhythm } from "@/lib/engagement/rhythm";
import { localDay, useProgress } from "@/lib/progress";

/** Eight weeks as eight lights: lit when you read that week. */
export function RhythmCard() {
  const { days } = useProgress();
  const [r, setR] = useState<Rhythm | null>(null);
  // Dates depend on the reader's clock, so this is worked out in the browser only.
  useEffect(() => setR(weeklyRhythm(days)), [days]);
  if (!r) return null;
  return (
    <div className="rounded-xl border border-border p-5">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Your reading rhythm
      </p>
      <div
        className="mt-3 flex items-end gap-1.5"
        role="img"
        aria-label={`You read in ${r.weeks.filter((w) => w.read).length} of the last ${r.weeks.length} weeks.`}
      >
        {r.weeks.map((w) => (
          <span
            key={w.start}
            title={`Week of ${w.start}`}
            className={`h-6 flex-1 rounded-full ${w.read ? "bg-brass" : "bg-secondary"} ${w.current ? "ring-2 ring-accent/50 ring-offset-2 ring-offset-card" : ""}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
        <span>8 weeks ago</span>
        <span>This week</span>
      </div>
      <p className="mt-3 text-sm">{rhythmMessage(r)}</p>
    </div>
  );
}

/** "3 ideas to refresh today" */
export function RefreshCard() {
  const progress = useProgress();
  const [due, setDue] = useState<number | null>(null);
  useEffect(() => setDue(dueCards(progress, localDay()).length), [progress]);
  if (due === null || progress.done.length === 0) return null;
  return (
    <Link
      to="/review"
      className="group flex flex-col justify-between rounded-xl border border-border p-5 hover:border-primary"
    >
      <span>
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          <Sparkles className="size-4 text-accent" /> Daily refresh
        </span>
        <span className="mt-2 block font-serif text-2xl">
          {due > 0
            ? `${due} ${due === 1 ? "idea" : "ideas"} to revisit today`
            : "All refreshed for today"}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {due > 0
            ? "Questions from lessons you've finished, right before you'd forget them."
            : "New ones come back tomorrow."}
        </span>
      </span>
      {due > 0 && (
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Start · about 2 minutes{" "}
          <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      )}
    </Link>
  );
}
