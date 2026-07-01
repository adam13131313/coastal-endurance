import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated, service role. Records an in-process or finished QC check against a
// batch. The check's result is pass only if every gating item passed; non-gating
// items (temperature, weight reconciliation, baseline lab values) are recorded but
// never flip the result. Refused once the batch is released/rejected (read-only).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null): boolean {
  return o != null && (ALLOWED_ORIGINS.includes(o) || /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o));
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
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const email = emailFromAuth(req.headers.get("Authorization"));
    if (!email) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const batchId = typeof body?.batchId === "string" ? body.batchId : "";
    const qcType = body?.qcType === "in_process" ? "in_process" : body?.qcType === "finished" ? "finished" : "";
    if (!batchId) return json({ error: "Missing batchId" }, 400);
    if (!qcType) return json({ error: "qcType must be 'in_process' or 'finished'" }, 400);
    const notes = typeof body?.notes === "string" ? body.notes.slice(0, 1000) : null;
    const items: ItemIn[] = Array.isArray(body?.items) ? body.items : [];

    const { data: batch } = await admin.from("production_batches").select("id, status").eq("id", batchId).maybeSingle();
    if (!batch) return json({ error: "Unknown batch" }, 400);
    if (batch.status === "released" || batch.status === "rejected") return json({ error: `Batch is ${batch.status} and read-only.` }, 409);

    const normItems = items
      .map((it) => ({
        parameter: typeof it?.parameter === "string" ? it.parameter.slice(0, 200) : "",
        value: it?.value == null ? null : String(it.value).slice(0, 500),
        expected: it?.expected == null ? null : String(it.expected).slice(0, 500),
        gating: it?.gating === true,
        passed: it?.passed === true ? true : it?.passed === false ? false : null as boolean | null,
      }))
      .filter((it) => it.parameter);

    // Result = pass only if every gating item passed.
    const gating = normItems.filter((i) => i.gating);
    const result = gating.length === 0 ? "pending" : gating.every((i) => i.passed === true) ? "pass" : "fail";

    const { data: check, error: cErr } = await admin
      .from("qc_checks")
      .insert({ type: qcType, subject_type: "batch", subject_id: batchId, result, performed_by: email, performed_at: new Date().toISOString(), notes })
      .select("id")
      .maybeSingle();
    if (cErr || !check) {
      console.error("submit-batch-qc insert failed", cErr);
      return json({ error: "Could not record QC" }, 500);
    }
    if (normItems.length) {
      await admin.from("qc_check_items").insert(
        normItems.map((i) => ({ qc_check_id: check.id, parameter: i.parameter, value: i.value, expected: i.expected, gating: i.gating, passed: i.passed })),
      );
    }
    // Nudge the batch into 'qc' once a check has been recorded (never downgrades).
    if (batch.status === "blending") await admin.from("production_batches").update({ status: "qc" }).eq("id", batchId);

    return json({ ok: true, result });
  } catch (e) {
    console.error("submit-batch-qc error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
