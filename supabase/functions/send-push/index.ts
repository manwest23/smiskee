// SMISKEE push sender (Supabase Edge Function: "send-push")
//
// Called every minute by the database scheduler (job_flush_push) with a private
// header. It takes queued notifications from the database and delivers them as
// standard Web Push messages (VAPID + aes128gcm, RFC 8291 / RFC 8292), using only
// the built-in WebCrypto API. No third-party packages.
//
// The VAPID key pair is generated here on the first run and stored in the
// private app_secrets table, so no key ever has to be copied by hand.
//
// Deploy with "Verify JWT" switched OFF: access is checked with the
// x-smiskee-cron header against the secret in the database instead.

const SUBJECT = "mailto:smiskee@users.noreply.github.com";
const enc = new TextEncoder();

// ---------- helpers ----------
export const b64u = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const fromB64u = (s: string): Uint8Array => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, len * 8));
}

// ---------- VAPID ----------
export async function generateVapid(): Promise<{ publicKey: string; privateJwk: string }> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const publicKey = b64u(await crypto.subtle.exportKey("raw", kp.publicKey));
  const privateJwk = JSON.stringify(await crypto.subtle.exportKey("jwk", kp.privateKey));
  return { publicKey, privateJwk };
}

export async function vapidHeader(endpoint: string, vapid: { publicKey: string; privateJwk: string }, subject = SUBJECT): Promise<string> {
  const header = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })));
  const jwk = JSON.parse(vapid.privateJwk);
  delete jwk.key_ops;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${vapid.publicKey}`;
}

// ---------- message encryption (aes128gcm) ----------
export async function encryptPayload(p256dh: string, auth: string, payload: string): Promise<Uint8Array> {
  const uaPublic = fromB64u(p256dh);
  const authSecret = fromB64u(auth);
  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));

  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const plaintext = concat(enc.encode(payload), new Uint8Array([2])); // 0x02 = last record
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, plaintext));

  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concat(header, ciphertext);
}

export async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string,
                               vapid: { publicKey: string; privateJwk: string }): Promise<Response> {
  const body = await encryptPayload(sub.p256dh, sub.auth, payload);
  return fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "43200",
      "Urgency": "high",
      "Authorization": await vapidHeader(sub.endpoint, vapid),
    },
    body,
  });
}

// ---------- database calls (service role, server side only) ----------
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return keys.default ?? Object.values(keys)[0] ?? "";
  } catch { return ""; }
}

async function rpc(fn: string, args: Record<string, unknown> = {}) {
  const key = serviceKey();
  const headers: Record<string, string> = { "Content-Type": "application/json", apikey: key };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/${fn}`, {
    method: "POST", headers, body: JSON.stringify(args),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${fn} failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

// ---------- request handler ----------
export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const ok = await rpc("push_check_secret", { p_secret: req.headers.get("x-smiskee-cron") ?? "" });
    if (ok !== true) return new Response("Forbidden", { status: 403 });

    let v = await rpc("push_get_vapid");
    if (!v || !v.public) {
      const g = await generateVapid();
      await rpc("push_set_vapid", { p_public: g.publicKey, p_private: g.privateJwk });
      v = await rpc("push_get_vapid");
    }
    const vapid = { publicKey: v.public, privateJwk: v.private };

    const batch: Array<{ id: number; kind: string; title: string; body: string; url: string;
                         subs: Array<{ endpoint: string; p256dh: string; auth: string }> | null }> =
      (await rpc("push_claim_batch", { p_limit: 200 })) ?? [];

    const results: Array<{ id: number; status: string }> = [];
    const gone: string[] = [];
    let delivered = 0;

    await Promise.all(batch.map(async (n) => {
      const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.kind, id: n.id });
      let sent = false;
      for (const s of n.subs ?? []) {
        try {
          const r = await sendPush(s, payload, vapid);
          if (r.status === 404 || r.status === 410) gone.push(s.endpoint);
          else if (r.ok) sent = true;
          else console.log("push rejected", r.status, (await r.text()).slice(0, 200));
        } catch (e) {
          console.log("push error", String(e));
        }
      }
      if (sent) delivered++;
      results.push({ id: n.id, status: sent ? "sent" : (n.subs?.length ? "failed" : "skip") });
    }));

    await rpc("push_finish", { p_results: results, p_gone: gone });
    return Response.json({ claimed: batch.length, delivered, removedDevices: gone.length });
  } catch (e) {
    console.log("send-push error", String(e));
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// deno-lint-ignore no-explicit-any
if (typeof (globalThis as any).Deno !== "undefined") Deno.serve(handle);
