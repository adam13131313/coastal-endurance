import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated, service role. Owns the mutable part of a batch's life:
//   action 'create' → open a batch (status planning) + seed batch_components from
//                     the active formula (target grams from planned mass).
//   action 'blend'  → record actual grams + the released lot used per component;
//                     decrement each lot's qty_remaining (reversing any prior record).
//   action 'fill'   → record units filled (yield) + theoretical units.
// Released/rejected batches are read-only: every action is refused once released.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DENSITY_G_PER_ML = 0.9;
const BOTTLE_ML = 30;

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

type Admin = ReturnType<typeof createClient>;

async function nextBatchNumber(admin: Admin, provided: string | undefined): Promise<string> {
  if (provided && provided.trim()) return provided.trim().slice(0, 40);
  const d = new Date();
  const base = `FO-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const { data } = await admin.from("production_batches").select("batch_number").like("batch_number", `${base}%`);
  const existing = new Set((data ?? []).map((r: { batch_number: string }) => r.batch_number));
  if (!existing.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!existing.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now()}`;
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
    const action = body?.action;

    // ---- create -----------------------------------------------------------
    if (action === "create") {
      const plannedMassG = Number(body?.plannedMassG);
      if (!Number.isFinite(plannedMassG) || plannedMassG <= 0) return json({ error: "plannedMassG must be a positive number" }, 400);

      let formulaId = typeof body?.formulaId === "string" ? body.formulaId : "";
      if (!formulaId) {
        const { data: f } = await admin.from("formulas").select("id").eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!f) return json({ error: "No active formula" }, 400);
        formulaId = f.id;
      }
      const { data: comps } = await admin.from("formula_components").select("raw_material_id, percent_ww").eq("formula_id", formulaId);
      if (!comps?.length) return json({ error: "Formula has no components" }, 400);

      const batchNumber = await nextBatchNumber(admin, body?.batchNumber);
      const theoreticalUnits = Math.floor((plannedMassG / DENSITY_G_PER_ML) / BOTTLE_ML);
      const { data: batch, error: bErr } = await admin
        .from("production_batches")
        .insert({ batch_number: batchNumber, formula_id: formulaId, planned_mass_g: plannedMassG, theoretical_units: theoreticalUnits, status: "planning", operator: email })
        .select("*")
        .maybeSingle();
      if (bErr || !batch) {
        console.error("record-batch create failed", bErr);
        return json({ error: bErr?.code === "23505" ? "That batch number already exists." : "Could not create the batch" }, 400);
      }
      const rows = comps.map((c: { raw_material_id: string; percent_ww: number }) => ({
        batch_id: batch.id, raw_material_id: c.raw_material_id, target_g: (Number(c.percent_ww) / 100) * plannedMassG, actual_g: null, raw_material_lot_id: null,
      }));
      await admin.from("batch_components").insert(rows);
      return json({ ok: true, batch });
    }

    // For every other action the batch must exist and not be locked.
    const batchId = typeof body?.batchId === "string" ? body.batchId : "";
    if (!batchId) return json({ error: "Missing batchId" }, 400);
    const { data: batch } = await admin.from("production_batches").select("*").eq("id", batchId).maybeSingle();
    if (!batch) return json({ error: "Unknown batch" }, 400);
    if (batch.status === "released" || batch.status === "rejected") return json({ error: `Batch is ${batch.status} and read-only.` }, 409);

    // ---- blend: actual grams + lots, decrement lot qty_remaining ----------
    if (action === "blend") {
      const updates: { batchComponentId: string; actualG: number; rawMaterialLotId: string }[] = Array.isArray(body?.components) ? body.components : [];
      if (!updates.length) return json({ error: "No components supplied" }, 400);

      const { data: existing } = await admin.from("batch_components").select("*").eq("batch_id", batchId);
      const byId = new Map((existing ?? []).map((c: Record<string, unknown>) => [c.id as string, c]));

      // Validate all selected lots up front (must be released; material must match).
      for (const u of updates) {
        const comp = byId.get(u.batchComponentId);
        if (!comp) return json({ error: "Unknown batch component" }, 400);
        const { data: lot } = await admin.from("raw_material_lots").select("id, status, raw_material_id, qty_remaining").eq("id", u.rawMaterialLotId).maybeSingle();
        if (!lot) return json({ error: "Unknown lot selected" }, 400);
        if (lot.status !== "released") return json({ error: `A selected lot is ${lot.status}; only released lots can be used.` }, 400);
        if (lot.raw_material_id !== comp.raw_material_id) return json({ error: "A selected lot doesn't match its ingredient." }, 400);
        if (!Number.isFinite(Number(u.actualG)) || Number(u.actualG) < 0) return json({ error: "actualG must be a non-negative number" }, 400);
      }

      // Apply, reversing any prior decrement so re-recording is safe.
      const lotDelta = new Map<string, number>(); // lotId → grams to subtract (net)
      for (const u of updates) {
        const comp = byId.get(u.batchComponentId)!;
        const prevLot = comp.raw_material_lot_id as string | null;
        const prevActual = Number(comp.actual_g) || 0;
        if (prevLot) lotDelta.set(prevLot, (lotDelta.get(prevLot) ?? 0) - prevActual); // add back
        lotDelta.set(u.rawMaterialLotId, (lotDelta.get(u.rawMaterialLotId) ?? 0) + Number(u.actualG)); // take out
        await admin.from("batch_components").update({ actual_g: Number(u.actualG), raw_material_lot_id: u.rawMaterialLotId }).eq("id", u.batchComponentId);
      }
      for (const [lotId, delta] of lotDelta) {
        if (delta === 0) continue;
        const { data: lot } = await admin.from("raw_material_lots").select("qty_remaining").eq("id", lotId).maybeSingle();
        const remaining = Math.max(0, (Number(lot?.qty_remaining) || 0) - delta);
        await admin.from("raw_material_lots").update({ qty_remaining: remaining }).eq("id", lotId);
      }

      const patch: Record<string, unknown> = {};
      if (batch.status === "planning") patch.status = "blending";
      if (!batch.started_at) patch.started_at = new Date().toISOString();
      if (Object.keys(patch).length) await admin.from("production_batches").update(patch).eq("id", batchId);
      return json({ ok: true });
    }

    // ---- fill: yield + theoretical units ----------------------------------
    if (action === "fill") {
      const yieldUnits = Number(body?.yieldUnits);
      if (!Number.isFinite(yieldUnits) || yieldUnits < 0) return json({ error: "yieldUnits must be a non-negative number" }, 400);
      const theoretical = Number(body?.theoreticalUnits);
      const patch: Record<string, unknown> = {
        yield_units: Math.round(yieldUnits),
        filled_at: new Date().toISOString(),
        status: batch.status === "planning" ? "planning" : "qc",
      };
      if (Number.isFinite(theoretical) && theoretical > 0) patch.theoretical_units = Math.round(theoretical);
      await admin.from("production_batches").update(patch).eq("id", batchId);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("record-batch error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
