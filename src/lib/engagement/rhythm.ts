/**
 * The weekly reading rhythm: which of the last few weeks the learner read in. Weeks, not days, on
 * purpose — a missed day never "breaks" anything, so there is no guilt, only a gentle record.
 */

export type Week = { start: string; read: boolean; current: boolean };
export type Rhythm = { weeks: Week[]; inLastFour: number; streak: number; thisWeek: boolean };

const day = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The Monday that starts the week containing `d`. */
function weekStart(d: Date) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return t;
}

export function weeklyRhythm(days: string[] | undefined, today = new Date(), count = 8): Rhythm {
  const read = new Set<string>();
  for (const s of days ?? []) {
    const [y, m, d] = s.split("-").map(Number);
    if (y && m && d) read.add(day(weekStart(new Date(y, m - 1, d))));
  }
  const current = weekStart(today);
  const weeks: Week[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const w = new Date(current);
    w.setDate(w.getDate() - i * 7);
    const start = day(w);
    weeks.push({ start, read: read.has(start), current: i === 0 });
  }
  const thisWeek = weeks[weeks.length - 1]!.read;
  let streak = 0;
  // Count back from this week, or from last week if this week hasn't happened yet.
  for (let i = weeks.length - (thisWeek ? 1 : 2); i >= 0 && weeks[i]!.read; i--) streak++;
  const inLastFour = weeks.slice(-4).filter((w) => w.read).length;
  return { weeks, inLastFour, streak, thisWeek };
}

export function rhythmMessage(r: Rhythm) {
  if (r.thisWeek && r.streak > 1) return `${r.streak} weeks in a row. That's how ideas stick.`;
  if (r.thisWeek) return "You've read this week. A steady rhythm beats a long sprint.";
  if (r.streak > 0) return `Read once this week to make it ${r.streak + 1} weeks in a row.`;
  return "Ten minutes, once a week, is enough to keep going.";
}
