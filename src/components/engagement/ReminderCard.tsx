import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  HOURS,
  disableReminders,
  enableReminders,
  reminderSupport,
  useReminderPrefs,
  type Support,
} from "@/lib/engagement/reminders";

const FAIL: Record<string, string> = {
  denied:
    "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
  failed: "Reminders couldn't be switched on just now. Check your connection and try again.",
  unsupported:
    "This browser can't show reminders. Try Chrome, Edge or Firefox, or Safari on a Mac.",
  dev: "Reminders work on the live site only.",
};

/** "Remind me if I drift away": opt-in browser notifications, no email needed. */
export function ReminderCard({ slug, compact = false }: { slug?: string; compact?: boolean }) {
  const prefs = useReminderPrefs();
  const [support, setSupport] = useState<Support>("off");
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [hour, setHour] = useState(19);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setSupport(reminderSupport()), []);
  useEffect(() => {
    if (prefs) {
      setGoal(prefs.goal);
      setHour(prefs.hour);
    }
  }, [prefs]);

  if (support === "off") return null;
  const label =
    HOURS.find((h) => h.hour === (prefs?.hour ?? hour))?.label.toLowerCase() ?? "evening";

  if (prefs && !prefs.lost && !open) {
    return (
      <div className={`rounded-xl border border-border bg-card ${compact ? "p-5" : "p-5"}`}>
        <p className="flex items-center gap-2 font-serif text-xl">
          <BellRing className="size-5 text-accent" /> Reminders are on
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          If you&rsquo;re away for a day, you&rsquo;ll get one gentle note in the {label}
          {prefs.goal ? `, about building ${prefs.goal}` : ""}. At most three, then we wait for you.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => void disableReminders()}
            className="inline-flex items-center gap-1.5 text-muted-foreground underline underline-offset-4"
          >
            <BellOff className="size-3.5" /> Turn off
          </button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await enableReminders(goal, hour, slug);
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      trackEvent("reminders-on", "Reading reminders turned on");
    } else setError(FAIL[r.reason] ?? FAIL["failed"]!);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="flex items-center gap-2 font-serif text-xl">
        <BellRing className="size-5 text-accent" />{" "}
        {prefs?.lost ? "Turn reminders back on?" : "Remind me if I drift away"}
      </p>
      {support === "needs-home-screen" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          On iPhone and iPad, reminders work once this site is on your Home Screen: tap Share, then
          &ldquo;Add to Home Screen&rdquo;, and open the course from there.
        </p>
      ) : !open ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {prefs?.lost
              ? "This browser stopped accepting reminders. Switch them back on if you'd still like them."
              : "A gentle notification if you're away for a day, about where you left off. No email, no account. Never more than three."}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Set up reminders
          </button>
          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-4">
          <label className="block text-sm font-semibold">
            What do you want to build?{" "}
            <span className="font-normal text-muted-foreground">
              (optional, used in your reminders)
            </span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={80}
              placeholder="e.g. a booking app for my salon"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-normal"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">When do you like to read?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {HOURS.map((h) => (
                <button
                  key={h.hour}
                  type="button"
                  aria-pressed={hour === h.hour}
                  onClick={() => setHour(h.hour)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${hour === h.hour ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                >
                  {h.label} <span className="opacity-70">{String(h.hour).padStart(2, "0")}:00</span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">
            Your browser will ask to allow notifications. We keep only what&rsquo;s needed to send
            them: this browser&rsquo;s notification address, your goal, the hour and your time zone,
            and which lesson you&rsquo;re on.
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
              {busy ? "Switching on…" : prefs ? "Save" : "Turn on reminders"}
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
