import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { feedbackCategories } from "@/lib/community/feedback";

type Row = {
  id: string;
  category: string;
  name: string | null;
  email: string | null;
  related: string | null;
  message: string;
  created_at: string;
};

// community_feedback is created from docs/database/community_feedback.sql and is not in the generated
// types yet, so it is queried without them. Row-level security limits reads to admins.
const db = supabase as unknown as SupabaseClient;
const label = (c: string) => feedbackCategories.find((x) => x.value === c)?.label ?? c;

/** Community form messages for the maintainer. Shown only to admins on /feedback. */
export function CommunityMessages() {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  useEffect(() => {
    let alive = true;
    void db
      .from("community_feedback")
      .select("id,category,name,email,related,message,created_at")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error)
          setState(error.code === "PGRST205" || error.code === "42P01" ? "missing" : "error");
        else {
          setRows((data ?? []) as Row[]);
          setState("ready");
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section aria-labelledby="community-messages" className="mt-14 border-t border-border pt-10">
      <h2 id="community-messages" className="font-serif text-3xl">
        Community messages
      </h2>
      <p className="mt-2 text-muted-foreground">Sent from the form on the Contribute page.</p>
      {state === "loading" && (
        <p className="mt-6" role="status">
          Loading messages…
        </p>
      )}
      {state === "missing" && (
        <p className="mt-6 rounded-xl border border-border bg-card p-6">
          Not set up yet. Run <code>docs/database/community_feedback.sql</code> in the database to
          start collecting messages.
        </p>
      )}
      {state === "error" && (
        <p className="mt-6 text-destructive" role="alert">
          Messages could not be loaded. Please try again later.
        </p>
      )}
      {state === "ready" && rows.length === 0 && (
        <p className="mt-6 rounded-xl border border-border bg-card p-6 text-muted-foreground">
          No messages yet.
        </p>
      )}
      {state === "ready" && rows.length > 0 && (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold">
                  {label(r.category)}
                  {r.related ? ` · ${r.related}` : ""}
                </p>
                <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleString()}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{r.message}</p>
              {(r.name || r.email) && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {r.name ?? "Anonymous"}
                  {r.email && (
                    <>
                      {" "}
                      ·{" "}
                      <a href={`mailto:${r.email}`} className="underline underline-offset-2">
                        {r.email}
                      </a>
                    </>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
