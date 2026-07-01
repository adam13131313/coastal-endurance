import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated, service role. Releases (or rejects) a batch.
//   decision 'release' → allowed ONLY if the batch's latest finished QC check exists,
//                        its result is pass, and every gating finished-QC item passed.
//                        Stamps best_before + records released_by/at (self-release: the
//                        signer may equal the operator, but it's always recorded).
//   decision 'reject'  → marks the batch rejected (e.g. finished QC failed).
// After either, the batch is read-only (record-batch / submit-batch-qc refuse it).
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
    const decision = body?.decision === "reject" ? "reject" : body?.decision === "release" ? "release" : "release";
    if (!batchId) return json({ error: "Missing batchId" }, 400);

    const { data: batch } = await admin.from("production_batches").select("*").eq("id", batchId).maybeSingle();
    if (!batch) return json({ error: "Unknown batch" }, 400);
    if (batch.status === "released" || batch.status === "rejected") return json({ error: `Batch is already ${batch.status}.` }, 409);

    if (decision === "reject") {
      const { data: updated } = await admin
        .from("production_batches")
        .update({ status: "rejected", released_at: new Date().toISOString(), released_by: email, notes: typeof body?.notes === "string" ? body.notes.slice(0, 1000) : batch.notes })
        .eq("id", batchId)
        .select("*")
        .maybeSingle();
      return json({ ok: true, batch: updated });
    }

    // Release gate: the latest finished QC check must be a pass with all gating passed.
    const { data: finished } = await admin
      .from("qc_checks")
      .select("id, result, performed_at, qc_check_items ( gating, passed )")
      .eq("subject_type", "batch")
      .eq("subject_id", batchId)
      .eq("type", "finished")
      .order("performed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!finished) return json({ error: "Record a finished QC check before releasing." }, 400);
    const gatingItems = (finished.qc_check_items ?? []) as { gating: boolean; passed: boolean | null }[];
    const allGatingPassed = gatingItems.filter((i) => i.gating).every((i) => i.passed === true);
    if (finished.result !== "pass" || !allGatingPassed) {
      return json({ error: "Finished QC has not passed; the batch cannot be released." }, 400);
    }

    const bestBefore = typeof body?.bestBefore === "string" && body.bestBefore ? body.bestBefore : null;
    const { data: updated, error: uErr } = await admin
      .from("production_batches")
      .update({ status: "released", released_at: new Date().toISOString(), released_by: email, best_before: bestBefore })
      .eq("id", batchId)
      .not("status", "in", "(released,rejected)") // guard against a race
      .select("*")
      .maybeSingle();
    if (uErr || !updated) {
      console.error("release-batch update failed", uErr);
      return json({ error: "Could not release the batch" }, 500);
    }
    return json({ ok: true, batch: updated });
  } catch (e) {
    console.error("release-batch error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
