import { createFileRoute } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import {
  Download,
  Inbox,
  Loader2,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { chapters } from "@/content/lessons";
import { project } from "@/config/community";
import { feedbackCategories } from "@/lib/community/feedback";
import {
  adminAvailable,
  deleteFeedback,
  downloadCsv,
  getSession,
  isAdmin,
  loadFeedback,
  onSessionChange,
  signIn,
  signOut,
  type CommunityRow,
  type FeedbackTable,
  type LessonRow,
} from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Feedback inbox — ${project.name}` },
      { name: "description", content: "Private feedback inbox for the project's maintainers." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const lessonTitle = (slug: string) => {
  const c = chapters.find((x) => x.slug === slug);
  return c ? `${c.number}. ${c.title}` : slug;
};
const categoryLabel = (c: string) => feedbackCategories.find((x) => x.value === c)?.label ?? c;
const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

type Gate = "loading" | "unconfigured" | "signed-out" | "not-admin" | "admin";

function AdminPage() {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);

  const userId = useRef<string | null | undefined>(undefined);

  const check = useCallback(async (s: Session | null) => {
    userId.current = s?.user.id ?? null;
    setSession(s);
    if (!s) {
      setGate("signed-out");
      return;
    }
    setGate("loading");
    setGate((await isAdmin()) ? "admin" : "not-admin");
  }, []);

  useEffect(() => {
    if (!adminAvailable()) {
      setGate("unconfigured");
      return;
    }
    void getSession().then(check);
    // Token refreshes keep the same user; only re-check when someone signs in or out.
    return onSessionChange((s) => {
      if ((s?.user.id ?? null) !== userId.current) void check(s);
      else setSession(s);
    });
  }, [check]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Maintainers</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-4xl md:text-5xl">Feedback inbox</h1>
          {session && gate !== "signed-out" && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{session.user.email}</span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 hover:border-primary hover:text-primary"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </div>
          )}
        </div>

        {gate === "loading" && (
          <p className="mt-10 flex items-center gap-2 text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />{" "}
            Loading…
          </p>
        )}
        {gate === "unconfigured" && (
          <Notice>
            This copy of the site isn't connected to a database, so there is no feedback to show.
          </Notice>
        )}
        {gate === "signed-out" && <SignInForm />}
        {gate === "not-admin" && (
          <Notice>
            You're signed in, but this account isn't listed as a maintainer. Add it to the{" "}
            <code>admins</code> table (see <code>docs/database/schema.sql</code>), then reload this
            page.
          </Notice>
        )}
        {gate === "admin" && <Inboxes />}
      </main>
      <SiteFooter />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="mt-10 max-w-2xl rounded-xl border border-border bg-card p-6">{children}</p>;
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  };
  const field = "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-base";
  return (
    <form
      onSubmit={submit}
      className="mt-10 max-w-sm space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <p className="text-muted-foreground">Maintainers only. Sign in to read learner feedback.</p>
      <div>
        <label htmlFor="admin-email" className="font-semibold">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="font-semibold">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

type Data = { community: CommunityRow[]; lessons: LessonRow[] };

function Inboxes() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"community" | "lessons">("community");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loadFeedback());
    } catch {
      setError("Feedback could not be loaded. Check your connection and try again.");
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = async (table: FeedbackTable, id: string) => {
    if (!window.confirm("Delete this feedback permanently? This can't be undone.")) return;
    if (!(await deleteFeedback(table, id))) {
      setError("That item couldn't be deleted. Try again.");
      return;
    }
    setData(
      (d) =>
        d && {
          community:
            table === "community_feedback" ? d.community.filter((r) => r.id !== id) : d.community,
          lessons: table === "lesson_feedback" ? d.lessons.filter((r) => r.id !== id) : d.lessons,
        },
    );
  };

  if (!data) {
    return error ? (
      <Notice>{error}</Notice>
    ) : (
      <p className="mt-10 flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Loading
        feedback…
      </p>
    );
  }

  const helpful = data.lessons.filter((r) => r.helpful).length;
  const comments = data.lessons.filter((r) => r.comment.trim()).length;
  const tabs = [
    { id: "community", label: "Community messages", count: data.community.length },
    { id: "lessons", label: "Lesson ratings", count: data.lessons.length },
  ] as const;

  return (
    <>
      <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border grid-cols-2 lg:grid-cols-4">
        <Stat label="Community messages" value={String(data.community.length)} />
        <Stat label="Lesson ratings" value={String(data.lessons.length)} />
        <Stat
          label="Rated helpful"
          value={
            data.lessons.length ? `${Math.round((helpful / data.lessons.length) * 100)}%` : "—"
          }
        />
        <Stat label="Rating comments" value={String(comments)} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div role="tablist" aria-label="Feedback type" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label} <span className="font-normal text-muted-foreground">({t.count})</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="mb-2 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden
          />{" "}
          Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div role="tabpanel" className="mt-6">
        {tab === "community" ? (
          <CommunityInbox
            rows={data.community}
            onDelete={(id) => void remove("community_feedback", id)}
          />
        ) : (
          <LessonInbox rows={data.lessons} onDelete={(id) => void remove("lesson_feedback", id)} />
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="font-serif text-3xl text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
    >
      {children}
    </button>
  );
}

function SearchBox({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label className="relative ml-auto block w-full sm:w-64">
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm"
      />
    </label>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete"
      title="Delete"
      className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

function CsvButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm hover:border-primary hover:text-primary disabled:opacity-50"
    >
      <Download className="size-4" aria-hidden /> CSV
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-8 text-muted-foreground">
      <Inbox className="size-5" aria-hidden /> {children}
    </p>
  );
}

function CommunityInbox({
  rows,
  onDelete,
}: {
  rows: CommunityRow[];
  onDelete: (id: string) => void;
}) {
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (category === "all" || r.category === category) &&
        (!needle ||
          [r.message, r.name, r.email, r.related].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, category, q]);

  return (
    <>
      <Toolbar>
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          All ({rows.length})
        </Chip>
        {feedbackCategories.map((c) => {
          const n = rows.filter((r) => r.category === c.value).length;
          return (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label} ({n})
            </Chip>
          );
        })}
        <SearchBox value={q} onChange={setQ} label="Search community messages" />
        <CsvButton
          disabled={!shown.length}
          onClick={() => downloadCsv("community-feedback.csv", shown)}
        />
      </Toolbar>
      {shown.length === 0 ? (
        <Empty>
          {rows.length ? "No messages match these filters." : "No community messages yet."}
        </Empty>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {categoryLabel(r.category)}
                    {r.related && (
                      <span className="font-normal text-muted-foreground"> · {r.related}</span>
                    )}
                  </p>
                  <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                    {when(r.created_at)}
                  </time>
                </div>
                <DeleteButton onClick={() => onDelete(r.id)} />
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words">{r.message}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {r.name || "Anonymous"}
                {r.email && (
                  <>
                    {" · "}
                    <a
                      href={`mailto:${r.email}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {r.email}
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LessonInbox({ rows, onDelete }: { rows: LessonRow[]; onDelete: (id: string) => void }) {
  const [lesson, setLesson] = useState<string>("all");
  const [onlyComments, setOnlyComments] = useState(false);
  const [q, setQ] = useState("");

  const summaries = useMemo(() => {
    const by = new Map<string, { total: number; helpful: number }>();
    for (const r of rows) {
      const s = by.get(r.lesson_slug) ?? { total: 0, helpful: 0 };
      s.total += 1;
      if (r.helpful) s.helpful += 1;
      by.set(r.lesson_slug, s);
    }
    // Lessons with the lowest share of "helpful" first: they most need attention.
    return [...by.entries()]
      .map(([slug, s]) => ({ slug, ...s, pct: s.helpful / s.total }))
      .sort((a, b) => a.pct - b.pct || b.total - a.total);
  }, [rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (lesson === "all" || r.lesson_slug === lesson) &&
        (!onlyComments || r.comment.trim()) &&
        (!needle ||
          r.comment.toLowerCase().includes(needle) ||
          lessonTitle(r.lesson_slug).toLowerCase().includes(needle)),
    );
  }, [rows, lesson, onlyComments, q]);

  if (rows.length === 0) return <Empty>No lesson ratings yet.</Empty>;

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
      <section aria-labelledby="by-lesson">
        <h2 id="by-lesson" className="font-serif text-2xl">
          By lesson
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Least helpful first. Select one to filter.
        </p>
        <ol className="mt-4 space-y-2">
          {summaries.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                aria-pressed={lesson === s.slug}
                onClick={() => setLesson(lesson === s.slug ? "all" : s.slug)}
                className={`w-full rounded-lg border p-3 text-left ${lesson === s.slug ? "border-primary bg-secondary/50" : "border-border bg-card hover:border-primary"}`}
              >
                <span className="block text-sm font-semibold">{lessonTitle(s.slug)}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <ThumbsUp className="size-3.5" aria-hidden /> {s.helpful} of {s.total} helpful
                </span>
                <span className="mt-2 block h-1.5 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-brass"
                    style={{ width: `${s.pct * 100}%` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ratings">
        <h2 id="ratings" className="font-serif text-2xl">
          {lesson === "all" ? "All ratings" : lessonTitle(lesson)}
        </h2>
        <div className="mt-4">
          <Toolbar>
            {lesson !== "all" && (
              <Chip active={false} onClick={() => setLesson("all")}>
                Show all lessons
              </Chip>
            )}
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyComments}
                onChange={(e) => setOnlyComments(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Only with comments
            </label>
            <SearchBox value={q} onChange={setQ} label="Search lesson comments" />
            <CsvButton
              disabled={!shown.length}
              onClick={() =>
                downloadCsv(
                  "lesson-feedback.csv",
                  shown.map((r) => ({ ...r, lesson: lessonTitle(r.lesson_slug) })),
                )
              }
            />
          </Toolbar>
        </div>
        {shown.length === 0 ? (
          <Empty>No ratings match these filters.</Empty>
        ) : (
          <ul className="mt-6 space-y-3">
            {shown.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${r.helpful ? "text-primary" : "text-destructive"}`}
                      >
                        {r.helpful ? (
                          <ThumbsUp className="size-4" aria-hidden />
                        ) : (
                          <ThumbsDown className="size-4" aria-hidden />
                        )}
                        {r.helpful ? "Helpful" : "Not quite"}
                      </span>
                      {lesson === "all" && (
                        <span className="text-muted-foreground">{lessonTitle(r.lesson_slug)}</span>
                      )}
                    </p>
                    <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                      {when(r.created_at)}
                    </time>
                  </div>
                  <DeleteButton onClick={() => onDelete(r.id)} />
                </div>
                {r.comment.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap break-words">{r.comment}</p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquareText className="size-3.5" aria-hidden /> No comment
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
