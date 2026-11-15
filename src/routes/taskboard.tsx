import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ExternalLink, Trash2, X } from "lucide-react";
import { chapters } from "@/content/lessons";
import { REPO, repoUrl } from "@/content/taskboard";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/taskboard")({
  head: () => ({
    meta: [
      { title: "Taskboard demo — Software Foundations" },
      { name: "description", content: "Try the course's Taskboard app in your browser, with labels linking each part to the lesson that explains it." },
      { property: "og:title", content: "Taskboard demo — Software Foundations" },
      { property: "og:description", content: "A working task tracker you can use while you read, annotated with the lessons behind each part." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskboardPage,
});

type Task = { id: string; title: string; due: string | null; done: boolean; label: string | null; createdAt: string };
const KEY = "sf:taskboard:v1";
const LABELS = ["Work", "Home", "Study"];

/** Same rule as backend/app/services/dates.py: overdue = not done and due before the user's local today. */
export function todayLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function isOverdue(t: Pick<Task, "due" | "done">, today = todayLocal()) {
  return !t.done && !!t.due && t.due < today;
}
/** Mirrors server-side validation: title required, 1–200 characters after trimming. */
export function validateTitle(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Give the task a title.";
  if (t.length > 200) return "Keep the title under 200 characters.";
  return null;
}

function Note({ n, file, children, show }: { n: number; file: string; children: React.ReactNode; show: boolean }) {
  const c = chapters.find((x) => x.number === n);
  if (!show || !c) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-dashed border-brass bg-secondary/40 px-3 py-1.5 text-xs">
      <BookOpen className="size-3.5 text-accent" />
      <span className="text-muted-foreground">{children}</span>
      <Link to="/learn/$slug" params={{ slug: c.slug }} className="font-semibold text-primary underline underline-offset-2">Lesson {n}: {c.title}</Link>
      <a href={repoUrl(file)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-primary">{file}<ExternalLink className="size-3" /></a>
    </div>
  );
}

function TaskboardPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  useEffect(() => {
    try { setTasks(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setTasks([]); }
  }, []);
  const save = (next: Task[]) => { setTasks(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full */ } };

  const today = useMemo(() => todayLocal(), []);
  const visible = (tasks ?? [])
    .filter((t) => filter === "all" || (filter === "done" ? t.done : !t.done))
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? "9999").localeCompare(b.due ?? "9999"));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const err = validateTitle(title);
    setError(err);
    if (err) return;
    save([...(tasks ?? []), { id: crypto.randomUUID(), title: title.trim(), due: due || null, done: false, label: label || null, createdAt: new Date().toISOString() }]);
    setTitle(""); setDue(""); setLabel("");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">The course's example app</p>
        <h1 className="mt-2 font-serif text-5xl">Taskboard</h1>
        <p className="mt-3 text-muted-foreground">A simple, reliable task tracker: capture tasks, set due dates, see what's next. This is a try-it version that saves only in your browser. The full app, with accounts, a database and tests, is <a href={REPO} target="_blank" rel="noopener noreferrer" className="text-accent underline">on GitHub</a>.</p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} className="accent-[var(--primary)]" />
          Show lesson labels
        </label>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={add} noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input aria-label="Task title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" maxLength={240} className="flex-1 rounded-md border border-input bg-background px-3 py-2" />
              <input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2" />
              <select aria-label="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2">
                <option value="">No label</option>
                {LABELS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <button className="rounded-md bg-primary px-5 py-2 font-semibold text-primary-foreground">Add</button>
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          </form>
          <Note show={showNotes} n={6} file="frontend/src/components/TaskForm.tsx">The form is the interface: it collects input and shows errors.</Note>
          <Note show={showNotes} n={3} file="docs/brief.md">"Title is required" is an acceptance criterion from the brief.</Note>
        </section>

        <div className="mt-8 flex gap-2 text-sm">
          {(["open", "done", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-1 capitalize ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{f}</button>
          ))}
        </div>

        <section className="mt-4">
          {tasks === null ? (
            <p className="py-10 text-center text-muted-foreground">Loading your tasks…</p>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-serif text-2xl">{tasks.length === 0 ? "No tasks yet" : "Nothing here"}</p>
              <p className="mt-1 text-muted-foreground">{tasks.length === 0 ? "Add your first task above." : "Try another filter."}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {visible.map((t) => {
                const late = isOverdue(t, today);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <button aria-label={t.done ? "Mark not done" : "Mark done"} onClick={() => save(tasks.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${t.done ? "border-primary bg-primary text-primary-foreground" : "border-brass"}`}>
                      {t.done && <Check className="size-3.5" />}
                    </button>
                    <div className="flex-1">
                      <p className={t.done ? "text-muted-foreground line-through" : ""}>{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.due ? <span className={late ? "font-semibold text-destructive" : ""}>{late ? "Overdue · " : "Due "}{t.due}</span> : "No due date"}
                        {t.label && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5">{t.label}</span>}
                      </p>
                    </div>
                    <button aria-label="Delete task" onClick={() => confirm(`Delete "${t.title}"?`) && save(tasks.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
          <Note show={showNotes} n={6} file="frontend/src/pages/TasksPage.tsx">The list has distinct screen states: loading, empty, filtered-empty and full.</Note>
          <Note show={showNotes} n={5} file="backend/app/services/dates.py">"Overdue" is one small function: not done and due before your local today.</Note>
          <Note show={showNotes} n={9} file="backend/app/models.py">Here tasks persist in your browser; the real app stores them in a database.</Note>
          <Note show={showNotes} n={10} file="backend/migrations/versions">Each task has an id, title, due date, done flag, label and creation time.</Note>
          <Note show={showNotes} n={11} file="backend/app/security.py">The real app adds accounts: you only ever see your own tasks.</Note>
        </section>

        {tasks && tasks.length > 0 && <button onClick={() => confirm("Remove all demo tasks?") && save([])} className="mt-6 text-sm text-muted-foreground underline">Clear all tasks</button>}

        <section className="mt-14 rounded-2xl bg-primary p-6 text-primary-foreground">
          <h2 className="font-serif text-2xl">Want the real thing?</h2>
          <p className="mt-2 text-primary-foreground/85">Run the full Taskboard on your own computer:</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-sidebar p-4 font-mono text-sm text-sidebar-foreground">{`git clone ${REPO}.git && cd taskboard
make install && make migrate && make dev`}</pre>
          <Link to="/projects/$slug" params={{ slug: "map-and-trace" }} className="mt-4 inline-block font-semibold text-brass underline">Use it in Project 2: Map and trace your application →</Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
