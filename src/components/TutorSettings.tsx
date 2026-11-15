import { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import { setGrokKey, useGrokKey } from "@/lib/tutorKey";

export function TutorSettings({ onDone }: { onDone?: () => void }) {
  const saved = useGrokKey();
  const [value, setValue] = useState("");
  const masked = saved ? `${saved.slice(0, 6)}…${saved.slice(-4)}` : "";
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2 font-semibold"><KeyRound className="size-4 text-accent" /> Use your own Grok key</div>
      <p className="text-muted-foreground">Paste a free API key from the Grok console, and the tutor will answer using your own account. The key stays in this browser only.</p>
      <a href="https://console.x.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">Get a free key at console.x.ai <ExternalLink className="size-3" /></a>
      {saved ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
          <span>Using your key <code className="text-xs">{masked}</code></span>
          <button onClick={() => setGrokKey("")} className="text-xs text-destructive underline">Remove</button>
        </div>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim()) { setGrokKey(value); setValue(""); onDone?.(); } }}>
          <input type="password" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} placeholder="xai-…" aria-label="Grok API key" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2" />
          <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">Save</button>
        </form>
      )}
      {!saved && <p className="text-xs text-muted-foreground">No key? The tutor uses the course's built-in AI instead.</p>}
    </div>
  );
}
