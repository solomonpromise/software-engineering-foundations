import { Check, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import type { Chapter } from "@/content/lessons";
import { setPracticeAnswer, togglePracticeTask, useProgress } from "@/lib/progress";

export function PracticeExercise({ chapter }: { chapter: Chapter }) {
  const { practice } = useProgress();
  const saved = practice?.[chapter.slug];
  const done = new Set(saved?.done ?? []);
  const [showModel, setShowModel] = useState(false);
  useEffect(() => setShowModel(false), [chapter.slug]);
  return (
    <section className="rounded-xl border border-brass/50 bg-card p-6 print:border-0 print:p-0" aria-labelledby={`practice-${chapter.slug}`}>
      <div className="flex items-center gap-3">
        <FlaskConical className="size-6 shrink-0 text-accent" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Practical exercise</p>
          <h2 id={`practice-${chapter.slug}`} className="mt-1 font-serif text-2xl">Put this lesson into practice</h2>
        </div>
      </div>
      <p className="mt-4 text-muted-foreground">Choose a task, try it in Taskboard or on paper, and record what you actually did. Tick each task you complete.</p>
      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">Practical tasks for {chapter.title}</legend>
        {chapter.tryIt.map((task, i) => (
          <label key={task} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${done.has(i) ? "border-primary/40 bg-secondary/50" : "border-border"}`}>
            <input type="checkbox" checked={done.has(i)} onChange={() => togglePracticeTask(chapter.slug, i)} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
            <span>{task}</span>
          </label>
        ))}
      </fieldset>
      <p className="mt-2 text-sm text-muted-foreground">{done.size} of {chapter.tryIt.length} tasks completed</p>

      <label htmlFor={`practice-answer-${chapter.slug}`} className="mt-5 block font-semibold">Your answer or evidence</label>
      <textarea
        id={`practice-answer-${chapter.slug}`}
        value={saved?.answer ?? ""}
        onChange={(e) => setPracticeAnswer(chapter.slug, e.target.value)}
        rows={5}
        maxLength={5000}
        placeholder="Describe what you made, what you observed, and anything that did not work…"
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-relaxed"
      />
      <p className="mt-1 text-xs text-muted-foreground">Saved as you write. Include a screenshot name, code excerpt, query or test result when useful.</p>

      <div className="mt-5 rounded-lg bg-secondary/60 p-4">
        <h3 className="font-semibold">Success criteria</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>You attempted the task before opening the model approach.</li>
          <li>Your answer names something concrete you produced, changed or observed.</li>
          <li>You checked a failure, edge case or permission boundary where one applies.</li>
          <li>You can explain how your result connects to this key idea: <em>{chapter.keyIdea}</em></li>
        </ul>
      </div>

      <button type="button" onClick={() => setShowModel(!showModel)} aria-expanded={showModel} className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary">
        <Check className="size-4" /> {showModel ? "Hide model approach" : "Show model approach"}
      </button>
      {showModel && (
        <div className="mt-4 border-l-4 border-brass pl-4">
          <h3 className="font-serif text-xl">{chapter.walkthrough.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">One sound way to approach the exercise. Your result can differ if it still meets the success criteria.</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">{chapter.walkthrough.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
      )}
    </section>
  );
}
