import { useRiver, type River } from "@/lib/engagement/reader";

/**
 * The reading river: how many readers made it to each part of this lesson. It narrows where
 * people stop, so a learner can see "212 readers got this far" right where they are.
 */

const MIN_READERS = 3;
const fmt = (n: number) => n.toLocaleString("en");

/** Readers who reached the point `pct` (0–1) down the page. */
function reachedAt(r: River, pct: number) {
  const i = Math.min(9, Math.max(-1, Math.floor(pct * 10) - 1));
  return i < 0 ? r.opened : (r.reached[i] ?? 0);
}

/** Width profile from top (everyone who opened) to bottom (everyone who read to the end). */
function profile(r: River) {
  return [r.opened, ...r.reached].map((n) => (r.opened ? n / r.opened : 0));
}

/** Fixed in the right margin on wide screens; follows your scroll position. */
export function MarginRiver({ slug, scroll }: { slug: string; scroll: number }) {
  const river = useRiver(slug);
  if (!river || river.opened < MIN_READERS) return null;
  const H = 300;
  const W = 44;
  const prof = profile(river);
  const step = H / (prof.length - 1);
  const half = (v: number) => 3 + v * (W / 2 - 4);
  const right = prof.map((v, i) => `${W / 2 + half(v)},${i * step}`);
  const left = prof.map((v, i) => `${W / 2 - half(v)},${i * step}`).reverse();
  const y = Math.min(H, Math.max(0, scroll * H));
  const here = reachedAt(river, scroll);
  return (
    <aside
      aria-label="How far other readers got in this lesson"
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden w-[92px] -translate-y-1/2 text-center 2xl:right-8 xl:block print:hidden"
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{fmt(river.opened)} opened</p>
      <svg
        viewBox={`-2 -2 ${W + 4} ${H + 4}`}
        width={W + 4}
        height={H + 4}
        className="mx-auto my-1.5"
        aria-hidden
      >
        <polygon
          points={[...right, ...left].join(" ")}
          fill="var(--brass)"
          fillOpacity=".22"
          stroke="var(--brass)"
          strokeOpacity=".5"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <line x1="0" x2={W} y1={y} y2={y} stroke="var(--accent)" strokeWidth="2" />
        <circle cx={W / 2} cy={y} r="4" fill="var(--accent)" />
      </svg>
      <p className="text-[11px] leading-tight text-muted-foreground">
        {fmt(river.finished)} finished
      </p>
      <p className="mt-3 rounded-md bg-card/90 px-1.5 py-1 text-[11px] leading-tight text-foreground shadow-sm">
        <span className="font-semibold">{fmt(here)}</span> {here === 1 ? "reader" : "readers"} got
        this far
      </p>
    </aside>
  );
}

/** Near the end of every lesson, on every screen size. */
export function RiverSummary({ slug }: { slug: string }) {
  const river = useRiver(slug);
  if (!river) return null;
  if (river.opened < MIN_READERS) {
    return (
      <p className="mt-10 text-center text-sm text-muted-foreground print:hidden">
        You&rsquo;re one of the first readers of this lesson. Thank you for being early.
      </p>
    );
  }
  const W = 600;
  const H = 46;
  const prof = profile(river);
  const step = W / (prof.length - 1);
  const top = prof.map((v, i) => `${i * step},${H / 2 - 2 - v * (H / 2 - 4)}`);
  const bottom = prof.map((v, i) => `${i * step},${H / 2 + 2 + v * (H / 2 - 4)}`).reverse();
  const toEnd = river.reached[8] ?? 0;
  return (
    <figure className="mt-12 rounded-2xl border border-border bg-card p-5 print:hidden">
      <figcaption className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{fmt(river.opened)} readers</span> opened
        this lesson. {fmt(toEnd)} read to the end and {fmt(river.finished)} marked it finished.
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-12 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polygon
          points={[...top, ...bottom].join(" ")}
          fill="var(--brass)"
          fillOpacity=".25"
          stroke="var(--brass)"
          strokeOpacity=".55"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        <span>Start</span>
        <span>End of lesson</span>
      </div>
    </figure>
  );
}
