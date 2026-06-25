import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";

const DAYS_AHEAD = 7;

function roleFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const parts = header.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const claims = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, "=")));
    return typeof claims?.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Only the scheduled job (service role) may trigger this.
  if (roleFromAuth(req.headers.get("Authorization")) !== "service_role") {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json" } });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() + DAYS_AHEAD * 86400000).toISOString().slice(0, 10);

  const { data: rows, error } = await admin
    .from("order_deliveries")
    .select("id, sequence, scheduled_for, orders!inner ( email, shipping_name, status )")
    .eq("status", "scheduled")
    .lte("scheduled_for", cutoff)
    .order("scheduled_for");

  if (error) {
    console.error("reminder query failed", error);
    return json({ error: "query failed" });
  }

  // Only paid/fulfilled orders (skip abandoned-checkout rows).
  const due = (rows ?? []).filter((r) => {
    const o = (r as { orders: { status: string } }).orders;
    return o && (o.status === "paid" || o.status === "fulfilled");
  });
  if (due.length === 0) return json({ sent: false, count: 0 });

  if (!RESEND_API_KEY) return json({ sent: false, reason: "no_resend_key", count: due.length });

  const { data: adminRows } = await admin.from("admins").select("email");
  const recipients = (adminRows ?? []).map((a) => a.email as string).filter(Boolean);
  if (recipients.length === 0) return json({ sent: false, reason: "no_admins", count: due.length });

  const name = (r: unknown) => {
    const o = (r as { orders: { email: string; shipping_name: string | null } }).orders;
    return o.shipping_name || o.email;
  };
  const li = (r: { sequence: number; scheduled_for: string }) =>
    `<li>${r.scheduled_for} — ${name(r)} (shipment ${r.sequence})</li>`;

  const overdue = due.filter((r) => r.scheduled_for < today);
  const soon = due.filter((r) => r.scheduled_for >= today);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="font-size:18px;margin:0 0 12px">Shipments to send</h2>
      ${overdue.length ? `<p style="font-size:14px;color:#b00"><strong>Overdue (${overdue.length})</strong></p><ul style="font-size:14px;color:#333">${overdue.map(li).join("")}</ul>` : ""}
      ${soon.length ? `<p style="font-size:14px;color:#333"><strong>Due in the next ${DAYS_AHEAD} days (${soon.length})</strong></p><ul style="font-size:14px;color:#333">${soon.map(li).join("")}</ul>` : ""}
      <p style="font-size:13px;color:#999;margin-top:20px">Dispatch them at https://coastalendurance.com/admin</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: recipients,
        subject: `${due.length} shipment${due.length === 1 ? "" : "s"} to send${overdue.length ? ` (${overdue.length} overdue)` : ""}`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("reminder email failed", res.status, await res.text().catch(() => ""));
      return json({ sent: false, reason: "email_failed", count: due.length });
    }
  } catch (e) {
    console.error("reminder email error", e);
    return json({ sent: false, reason: "email_error", count: due.length });
  }

  return json({ sent: true, count: due.length, overdue: overdue.length });
});
