// Supabase Edge Function "reminders": gentle reading reminders as browser notifications.
//
// Two callers:
//  - Supabase Cron, every hour, with the x-reminder-secret header: sends each reader who is due
//    (see public.reminders_due() in docs/database/engagement.sql) one personal reminder.
//  - The site, right after a reader turns reminders on, with { "welcome": <their push endpoint> }:
//    sends one confirmation so they see that it works. Only once, within 10 minutes of signing up.
//
// Deploy with "Verify JWT" turned OFF (the cron call has no user), and set these secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, REMINDER_SECRET (and optionally VAPID_SUBJECT, SITE_URL).
// Setup steps: README "Reading reminders".
import { createClient } from "npm:@supabase/supabase-js@2";
import { reminderMessage, sendPush, type ReminderRow, type Vapid } from "./push.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://solomonpromise.github.io/software-engineering-foundations";
const vapid: Vapid = {
  publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
  privateKey: Deno.env.get("VAPID_PRIVATE_KEY") ?? "",
  subject: Deno.env.get("VAPID_SUBJECT") ?? SITE_URL,
};
const SECRET = Deno.env.get("REMINDER_SECRET") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Row = ReminderRow & { endpoint: string; p256dh: string; auth: string; welcomed: boolean; created_at: string };

async function welcome(endpoint: string) {
  const { data } = await db.from("reading_reminders").select("*").eq("endpoint", endpoint).maybeSingle<Row>();
  if (!data || data.welcomed || Date.now() - Date.parse(data.created_at) > 10 * 60 * 1000) {
    return json({ ok: false });
  }
  await db.from("reading_reminders").update({ welcomed: true }).eq("endpoint", endpoint);
  const status = await sendPush(
    data,
    {
      title: "Reminders are on",
      body: "If you're away for a day, we'll save your place and send one gentle note. Never more than three.",
      url: `${SITE_URL.replace(/\/$/, "")}/`,
    },
    vapid,
  );
  return json({ ok: status >= 200 && status < 300, status });
}

async function sendDue() {
  const { data, error } = await db.rpc("reminders_due");
  if (error) return json({ error: "due_query_failed", detail: error.message }, 500);
  const rows = (data ?? []) as Row[];
  let sent = 0;
  let removed = 0;
  let failed = 0;
  for (const r of rows) {
    const status = await sendPush(r, reminderMessage(r, SITE_URL, r.endpoint.slice(-12)), vapid).catch(() => 0);
    if (status === 404 || status === 410) {
      // The reader turned notifications off or the browser dropped the subscription.
      await db.from("reading_reminders").delete().eq("endpoint", r.endpoint);
      removed++;
    } else if (status >= 200 && status < 300) {
      await db
        .from("reading_reminders")
        .update({ reminders_sent: r.reminders_sent + 1, last_reminded_at: new Date().toISOString() })
        .eq("endpoint", r.endpoint);
      sent++;
    } else {
      failed++;
    }
  }
  return json({ due: rows.length, sent, removed, failed });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!vapid.publicKey || !vapid.privateKey) return json({ error: "missing_vapid_keys" }, 500);

  let body: { welcome?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  if (typeof body.welcome === "string") return welcome(body.welcome);

  if (!SECRET || req.headers.get("x-reminder-secret") !== SECRET) return json({ error: "forbidden" }, 403);
  return sendDue();
});
