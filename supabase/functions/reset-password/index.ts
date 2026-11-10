// SMISKEE password reset (Supabase Edge Function: "reset-password")
//
// Lets a person set a new password with their staff ID and recovery code,
// without an admin and without email. On success it returns a fresh recovery
// code (the old one stops working).
//
// Safety:
//   * codes are stored hashed; the check runs in the database (recovery_check)
//   * 5 wrong tries per staff ID per hour, then the ID is locked for the hour
//   * every reply for a wrong ID or code is the same, so IDs can't be probed
//
// Deploy with "Verify JWT" switched OFF (people calling it are signed out).

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return keys.default ?? Object.values(keys)[0] ?? "";
  } catch { return ""; }
}
function headers(): Record<string, string> {
  const key = serviceKey();
  const h: Record<string, string> = { "Content-Type": "application/json", apikey: key };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}
const base = () => Deno.env.get("SUPABASE_URL");

async function rpc(fn: string, args: Record<string, unknown>) {
  const res = await fetch(`${base()}/rest/v1/rpc/${fn}`, { method: "POST", headers: headers(), body: JSON.stringify(args) });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ code: "method", error: "Method not allowed." }, 405);

  let body: { staff_id?: string; code?: string; password?: string };
  try { body = await req.json(); } catch { return json({ code: "invalid", error: "Invalid request." }, 400); }
  const staff = String(body.staff_id ?? "").slice(0, 20);
  const code = String(body.code ?? "").slice(0, 40);
  const password = String(body.password ?? "");
  if (password.length < 8 || password.length > 72) {
    return json({ code: "weak", error: "Use 8 to 72 characters for the new password." }, 400);
  }

  try {
    let uid: string | null;
    try {
      uid = await rpc("recovery_check", { p_staff: staff, p_code: code });
    } catch (e) {
      if (String(e).includes("Too many attempts")) {
        return json({ code: "locked", error: "Too many attempts. Try again in an hour." }, 429);
      }
      throw e;
    }
    if (!uid) return json({ code: "wrong", error: "Staff ID or recovery code is incorrect." }, 400);

    const res = await fetch(`${base()}/auth/v1/admin/users/${uid}`, {
      method: "PUT", headers: headers(), body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      console.log("password update failed", res.status, (await res.text()).slice(0, 300));
      return json({ code: "failed", error: "The password couldn't be changed. Please try again." }, 500);
    }
    const newCode = await rpc("recovery_rotate", { p_user: uid });
    return json({ ok: true, new_code: newCode });
  } catch (e) {
    console.log("reset-password error", String(e));
    return json({ code: "failed", error: "Something went wrong. Please try again." }, 500);
  }
});
