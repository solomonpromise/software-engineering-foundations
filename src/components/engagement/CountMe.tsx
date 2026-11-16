import { useEffect, useState } from "react";
import { startCounting, stopCounting, useMe } from "@/lib/engagement/reader";

/** The reader's own switch for the anonymous reader count (on /about#privacy). */
export function CountMe() {
  const me = useMe();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  const on = !me.optOut;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <span className="text-foreground">
        {on
          ? me.number
            ? `This browser is counted as reader #${me.number.toLocaleString("en")}.`
            : "This browser is counted as a reader once you open a lesson."
          : "This browser isn't counted as a reader."}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          if (on) await stopCounting();
          else startCounting();
          setBusy(false);
        }}
        className="font-semibold text-primary underline underline-offset-4 disabled:opacity-60"
      >
        {on ? "Stop counting me and delete my record" : "Count me again"}
      </button>
    </div>
  );
}
