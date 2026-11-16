// Web Push for the "reminders" Edge Function, written with the standard Web Crypto API only, so it
// runs unchanged on Deno (Supabase) and in the project's tests.
//  - Payload encryption: RFC 8291 (Message Encryption for Web Push) with RFC 8188 "aes128gcm".
//  - Sender identification: RFC 8292 (VAPID), an ES256-signed token.
// Also holds the reminder wording ("smart templates"): personal, but written by hand, not by AI.

const enc = new TextEncoder();
type Bytes = Uint8Array<ArrayBuffer>;

export function fromB64url(s: string): Bytes {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function toB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

async function hmac(key: Bytes, data: Bytes): Promise<Bytes> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

/** Encrypts a push message for one browser subscription (RFC 8291, single aes128gcm record). */
export async function encryptPayload(
  p256dh: string,
  auth: string,
  plaintext: Uint8Array,
  salt: Bytes = crypto.getRandomValues(new Uint8Array(16)),
): Promise<Bytes> {
  const uaPublic = fromB64url(p256dh);
  const authSecret = fromB64url(auth);
  const local = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256),
  );

  const prkKey = await hmac(authSecret, shared);
  const ikm = await hmac(prkKey, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1])));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // 0x02 marks the last (and only) record; no extra padding.
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, concat(plaintext, new Uint8Array([2]))),
  );

  const header = new Uint8Array(21 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, cipher);
}

/** The VAPID Authorization header that tells the push service who is sending. */
export async function vapidHeader(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string,
  now = Date.now(),
): Promise<string> {
  const pub = fromB64url(publicKey);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: privateKey,
    x: toB64url(pub.slice(1, 33)),
    y: toB64url(pub.slice(33, 65)),
    ext: true,
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const part = (o: unknown) => toB64url(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({
    aud: new URL(endpoint).origin,
    exp: Math.floor(now / 1000) + 12 * 3600,
    sub: subject,
  })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned)));
  return `vapid t=${unsigned}.${toB64url(sig)}, k=${publicKey}`;
}

/** Only real browser push services (the database checks the same list). */
export function isPushEndpoint(endpoint: string) {
  return (
    endpoint.length <= 1000 &&
    /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)\//.test(
      endpoint,
    )
  );
}

export type Vapid = { publicKey: string; privateKey: string; subject: string };
export type Subscription = { endpoint: string; p256dh: string; auth: string };

/** Sends one notification. Returns the push service's HTTP status (404/410 = subscription gone). */
export async function sendPush(sub: Subscription, message: unknown, vapid: Vapid): Promise<number> {
  if (!isPushEndpoint(sub.endpoint)) return 410;
  const body = await encryptPayload(sub.p256dh, sub.auth, enc.encode(JSON.stringify(message)));
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidHeader(sub.endpoint, vapid.publicKey, vapid.privateKey, vapid.subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(60 * 60 * 20),
      Urgency: "normal",
    },
    body,
  });
  await res.body?.cancel();
  return res.status;
}

// ---------------------------------------------------------------------------------------------
// Reminder wording
// ---------------------------------------------------------------------------------------------

export type ReminderRow = {
  goal: string | null;
  last_lesson_title: string | null;
  next_lesson_slug: string | null;
  next_lesson_title: string | null;
  next_lesson_number: number | null;
  next_lesson_summary: string | null;
  lessons_done: number;
  lessons_total: number;
  reminders_sent: number;
};
export type Notice = { title: string; body: string; url: string };

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

/** Picks one of several phrasings, the same one each time for the same reader and reminder. */
function pick<T>(options: T[], seed: string): T {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return options[Math.abs(h) % options.length]!;
}

/**
 * The reminder a reader gets after 1, 4 or 11 days away (reminders_sent = 0, 1, 2). Personal to
 * what they were reading and, if they told us, what they want to build — never guilt-tripping.
 */
export function reminderMessage(r: ReminderRow, siteUrl: string, seed = ""): Notice {
  const site = siteUrl.replace(/\/$/, "");
  const next = r.next_lesson_title ? `“${clip(r.next_lesson_title, 60)}”` : null;
  const last = r.last_lesson_title ? `“${clip(r.last_lesson_title, 60)}”` : null;
  const goal = r.goal ? clip(r.goal.trim().replace(/[.!]+$/, ""), 50) : null;
  const summary = r.next_lesson_summary ? clip(r.next_lesson_summary, 110) : "";
  const url = r.next_lesson_slug
    ? `${site}/learn/${r.next_lesson_slug}?utm_source=reminder`
    : `${site}/?utm_source=reminder`;
  const progress = r.lessons_total > 0 ? `${r.lessons_done} of ${r.lessons_total} lessons` : null;
  const sameLesson = !!next && next === last;

  if (r.reminders_sent <= 0) {
    return pick<Notice>(
      [
        {
          title: next ? clip(`Ready for ${next}?`, 70) : "Your place is saved",
          body: [summary, goal ? `One step closer to ${goal}.` : ""].filter(Boolean).join(" ") ||
            "Ten minutes today keeps the ideas fresh.",
          url,
        },
        {
          title: "Your place is saved",
          body: sameLesson
            ? `You were partway through ${next}. A few more minutes finishes it.`
            : last && next
              ? `You last read ${last}. Next up: ${next}.`
              : "Pick up where you left off — ten minutes is enough.",
          url,
        },
      ],
      seed + "0",
    );
  }
  if (r.reminders_sent === 1) {
    return pick<Notice>(
      [
        {
          title: goal ? clip(`Still building ${goal}?`, 70) : "Ten minutes, one idea",
          body: `${progress ? `You've finished ${progress}. ` : ""}${next ? `${next} picks up right where you left off.` : "Your next lesson is waiting."}`,
          url,
        },
        {
          title: "Ten minutes, one idea",
          body: next ? clip(`${next}: ${summary || "the next step in the course."}`, 160) : "Your next lesson is waiting.",
          url,
        },
      ],
      seed + "1",
    );
  }
  return {
    title: "We kept your place",
    body: `${next ?? "Your next lesson"} is here whenever you're ready. This is our last reminder — come back any time.`,
    url,
  };
}
