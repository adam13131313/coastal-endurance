import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated (JWT verified at gateway → email re-checked vs admins), service role.
// Creates a raw-material lot in QUARANTINE. Nothing can use a lot until incoming QC
// releases it (release-raw-lot).
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
    const rawMaterialId = typeof body?.rawMaterialId === "string" ? body.rawMaterialId : "";
    const qtyReceived = Number(body?.qtyReceived);
    if (!rawMaterialId) return json({ error: "Missing rawMaterialId" }, 400);
    if (!Number.isFinite(qtyReceived) || qtyReceived <= 0) return json({ error: "qtyReceived must be a positive number" }, 400);

    // Confirm the material exists and is active.
    const { data: material } = await admin
      .from("raw_materials")
      .select("id, active, qc_spec")
      .eq("id", rawMaterialId)
      .maybeSingle();
    if (!material) return json({ error: "Unknown raw material" }, 400);
    if (material.active === false) return json({ error: "That raw material is inactive" }, 400);

    const supplier = typeof body?.supplier === "string" ? body.supplier.trim().slice(0, 200) : null;
    const supplierLotNumber = typeof body?.supplierLotNumber === "string" ? body.supplierLotNumber.trim().slice(0, 200) : null;
    const unit = typeof body?.unit === "string" && body.unit.trim() ? body.unit.trim().slice(0, 20) : "g";
    const receivedDate = typeof body?.receivedDate === "string" && body.receivedDate ? body.receivedDate : null;
    const bestBefore = typeof body?.bestBefore === "string" && body.bestBefore ? body.bestBefore : null;

    const { data: lot, error } = await admin
      .from("raw_material_lots")
      .insert({
        raw_material_id: rawMaterialId,
        supplier,
        supplier_lot_number: supplierLotNumber,
        qty_received: qtyReceived,
        qty_remaining: qtyReceived,
        unit,
        received_date: receivedDate,
        best_before: bestBefore,
        status: "quarantine",
      })
      .select("*")
      .maybeSingle();

    if (error || !lot) {
      console.error("receive-raw-lot insert failed", error);
      return json({ error: "Could not create the lot" }, 500);
    }
    return json({ ok: true, lot });
  } catch (e) {
    console.error("receive-raw-lot error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
