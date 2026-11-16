// Supabase Edge Function "analytics": GoatCounter statistics for the site's /admin page.
//
// The GoatCounter API key is a secret (GOATCOUNTER_API_KEY), so it can't live in the static site.
// This function keeps it on Supabase's servers and answers only signed-in accounts that
// public.is_admin() approves. Deploy it from the Supabase dashboard (Edge Functions) or with
// `supabase functions deploy analytics`; see README "Analytics on /admin".
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = Deno.env.get("GOATCOUNTER_SITE") ?? "https://software-engineering-foundations.goatcounter.com";
const API_KEY = Deno.env.get("GOATCOUNTER_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type Hit = { path: string; title: string; event: boolean; count: number };
type Stat = { name: string; count: number };

async function goat<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`/api/v0/${path}`, SITE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`goatcounter ${path}: ${res.status}`);
  return (await res.json()) as T;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Only maintainers: check the caller's own session against public.is_admin().
  const authorization = req.headers.get("Authorization") ?? "";
  const apikey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, apikey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: admin } = await db.rpc("is_admin");
  if (admin !== true) return json({ error: "forbidden" }, 403);
  if (!API_KEY) return json({ error: "missing_api_key" }, 500);

  let days = 30;
  try {
    const body = await req.json();
    if ([7, 30, 90].includes(body?.days)) days = body.days;
  } catch { /* default range */ }

  const hour = 3600_000;
  const end = new Date(Math.ceil(Date.now() / hour) * hour);
  const start = new Date(end.getTime() - days * 24 * hour);
  const range = { start: start.toISOString(), end: end.toISOString() };

  try {
    // GoatCounter allows 4 requests a second, so these run one after another.
    const total = await goat<{ total: number; total_events: number; stats: { day: string; daily: number }[] }>(
      "stats/total",
      range,
    );
    const hits = await goat<{ hits: Hit[] }>("stats/hits", { ...range, limit: "100" });
    const refs = await goat<{ stats: Stat[] }>("stats/toprefs", { ...range, limit: "10" });
    const locations = await goat<{ stats: Stat[] }>("stats/locations", { ...range, limit: "10" });
    const sizes = await goat<{ stats: Stat[] }>("stats/sizes", { ...range, limit: "5" });
    const slim = (h: Hit) => ({ path: h.path, title: h.title, count: h.count });
    return json({
      days,
      start: range.start,
      end: range.end,
      total: total.total,
      totalEvents: total.total_events,
      daily: (total.stats ?? []).map((s) => ({ day: s.day, count: s.daily })),
      pages: (hits.hits ?? []).filter((h) => !h.event).map(slim),
      events: (hits.hits ?? []).filter((h) => h.event).map(slim),
      referrers: (refs.stats ?? []).map((s) => ({ name: s.name || "(direct or unknown)", count: s.count })),
      locations: (locations.stats ?? []).map((s) => ({ name: s.name || "Unknown", count: s.count })),
      devices: (sizes.stats ?? []).map((s) => ({ name: s.name || "Unknown", count: s.count })),
    });
  } catch (e) {
    console.error(e);
    return json({ error: "goatcounter_unavailable" }, 502);
  }
});
