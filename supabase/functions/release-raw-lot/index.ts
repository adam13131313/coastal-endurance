import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated, service role. Records incoming QC for a quarantined raw-material lot
// and sets it released or rejected. Server is authoritative on the gates:
//   * every gating QC item must pass to release;
//   * a lot whose material has qc_spec.peroxide_value_max_meq_kg (hemp) cannot be
//     released unless a peroxide value is supplied and is within that ceiling.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null): boolean {
  return (
    o != null &&
    (ALLOWED_ORIGINS.includes(o) ||
      /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(o) ||
      /^http:\/\/localhost(:\d+)?$/.test(o))
  );
}
function cors(o: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(o) ? o! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
function emailFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const parts = header.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const c = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, "=")));
    return c?.role === "authenticated" && typeof c.email === "string" ? c.email : null;
  } catch {
    return null;
  }
}

type ItemIn = { parameter?: unknown; value?: unknown; expected?: unknown; gating?: unknown; passed?: unknown };

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const email = emailFromAuth(req.headers.get("Authorization"));
    if (!email) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const lotId = typeof body?.lotId === "string" ? body.lotId : "";
    const decision = body?.decision === "reject" ? "reject" : body?.decision === "release" ? "release" : "";
    if (!lotId) return json({ error: "Missing lotId" }, 400);
    if (!decision) return json({ error: "decision must be 'release' or 'reject'" }, 400);
    const notes = typeof body?.notes === "string" ? body.notes.slice(0, 1000) : null;
    const items: ItemIn[] = Array.isArray(body?.items) ? body.items : [];

    // Load the lot + its material (spec, to detect the hemp peroxide gate).
    const { data: lot } = await admin
      .from("raw_material_lots")
      .select("id, status, raw_material_id, raw_materials ( name, qc_spec )")
      .eq("id", lotId)
      .maybeSingle();
    if (!lot) return json({ error: "Unknown lot" }, 400);
    if (lot.status !== "quarantine") return json({ error: `Lot is already ${lot.status}; only quarantined lots can be released.` }, 409);

    const material = (lot as { raw_materials?: { name?: string; qc_spec?: Record<string, unknown> } }).raw_materials ?? {};
    const pvMax = Number(material?.qc_spec?.["peroxide_value_max_meq_kg"]);
    const hasPvGate = Number.isFinite(pvMax);

    // Normalise submitted QC items.
    const normItems = items
      .map((it) => ({
        parameter: typeof it?.parameter === "string" ? it.parameter.slice(0, 200) : "",
        value: it?.value == null ? null : String(it.value).slice(0, 500),
        expected: it?.expected == null ? null : String(it.expected).slice(0, 500),
        gating: it?.gating === true,
        passed: it?.passed === true ? true : it?.passed === false ? false : null as boolean | null,
      }))
      .filter((it) => it.parameter);

    // Hemp peroxide gate — server-enforced, independent of the client's flags.
    if (hasPvGate) {
      const pvRaw = body?.peroxideValue;
      const pv = Number(pvRaw);
      if (decision === "release") {
        if (pvRaw == null || pvRaw === "" || !Number.isFinite(pv)) {
          return json({ error: "A peroxide value is required to release this lot." }, 400);
        }
        if (pv > pvMax) {
          return json({ error: `Peroxide value ${pv} exceeds the ${pvMax} meq/kg ceiling; this lot cannot be released.` }, 400);
        }
      }
      // Always record the PV result on the check when supplied.
      if (pvRaw != null && pvRaw !== "" && Number.isFinite(pv)) {
        const idx = normItems.findIndex((i) => /peroxide/i.test(i.parameter));
        const pvItem = { parameter: "Peroxide value (meq O₂/kg)", value: String(pv), expected: `≤ ${pvMax}`, gating: true, passed: pv <= pvMax };
        if (idx >= 0) normItems[idx] = pvItem;
        else normItems.push(pvItem);
      }
    }

    // General gate: to release, every gating item must have passed === true.
    if (decision === "release") {
      const failed = normItems.filter((i) => i.gating && i.passed !== true);
      if (failed.length) {
        return json({ error: `Cannot release: gating check(s) not passed — ${failed.map((f) => f.parameter).join(", ")}.` }, 400);
      }
    }

    const nowIso = new Date().toISOString();
    const result = decision === "release" ? "pass" : "fail";

    // Record the QC check + items.
    const { data: check, error: cErr } = await admin
      .from("qc_checks")
      .insert({ type: "incoming", subject_type: "raw_lot", subject_id: lotId, result, performed_by: email, performed_at: nowIso, notes })
      .select("id")
      .maybeSingle();
    if (cErr || !check) {
      console.error("release-raw-lot qc_checks failed", cErr);
      return json({ error: "Could not record QC" }, 500);
    }
    if (normItems.length) {
      const { error: iErr } = await admin.from("qc_check_items").insert(
        normItems.map((i) => ({ qc_check_id: check.id, parameter: i.parameter, value: i.value, expected: i.expected, gating: i.gating, passed: i.passed })),
      );
      if (iErr) console.error("release-raw-lot qc_check_items failed", iErr);
    }

    // Flip the lot.
    const { data: updated, error: uErr } = await admin
      .from("raw_material_lots")
      .update({ status: decision === "release" ? "released" : "rejected", released_at: nowIso, released_by: email })
      .eq("id", lotId)
      .eq("status", "quarantine") // guard against a race
      .select("*")
      .maybeSingle();
    if (uErr || !updated) {
      console.error("release-raw-lot update failed", uErr);
      return json({ error: "Could not update the lot" }, 500);
    }

    return json({ ok: true, lot: updated });
  } catch (e) {
    console.error("release-raw-lot error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
