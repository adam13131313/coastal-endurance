import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function sendReceipt(
  to: string,
  order: { total_cents: number; currency: string },
  items: Array<{ product_name: string; variant_label: string; quantity: number; unit_price_cents: number }>,
  deliveries: Array<{ scheduled_for: string; sequence: number }>,
) {
  if (!RESEND_API_KEY || !to) return;
  const itemRows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.quantity} × ${i.product_name} (${i.variant_label})</td>` +
        `<td style="padding:4px 0;text-align:right">${formatPrice(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const schedule =
    deliveries.length > 1
      ? `<p style="font-size:14px;color:#333"><strong>Delivery schedule</strong><br/>${deliveries
          .sort((a, b) => a.sequence - b.sequence)
          .map((d) => `Bottle ${d.sequence}: ${d.scheduled_for}`)
          .join("<br/>")}</p>`
      : "";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
      <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
      <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
      <h1 style="font-size:22px;margin:0 0 16px">Order confirmed</h1>
      <p style="font-size:15px;color:#333;line-height:1.6">Thanks for your order. Here's your receipt.</p>
      <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;margin:16px 0">
        ${itemRows}
        <tr><td style="padding:8px 0;border-top:1px solid #d6cfc4"><strong>Total</strong></td>
        <td style="padding:8px 0;border-top:1px solid #d6cfc4;text-align:right"><strong>${formatPrice(order.total_cents)} ${order.currency}</strong></td></tr>
      </table>
      ${schedule}
      <p style="font-size:13px;color:#999;margin-top:24px">Coastal Endurance · Made in Australia</p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject: "Your Coastal Endurance order", html }),
    });
    if (!res.ok) console.error("receipt email failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("receipt email error", e);
  }
}

// Notify the store's admins (from the public.admins allowlist) of a new paid order.
async function sendAdminNotification(
  supa: ReturnType<typeof createClient>,
  details: { orderId: string; email: string; totalCents: number; currency: string; shippingName: string | null },
  items: Array<{ product_name: string; variant_label: string; quantity: number; unit_price_cents: number }>,
  deliveries: Array<{ scheduled_for: string; sequence: number }>,
) {
  if (!RESEND_API_KEY) return;
  const { data: adminRows } = await supa.from("admins").select("email");
  const recipients = (adminRows ?? []).map((a) => a.email as string).filter(Boolean);
  if (recipients.length === 0) return;

  const itemRows = items
    .map((i) => `<li>${i.quantity} × ${i.product_name} (${i.variant_label}), ${formatPrice(i.unit_price_cents * i.quantity)}</li>`)
    .join("");
  const schedule =
    deliveries.length > 1
      ? `<p style="font-size:14px"><strong>Delivery schedule:</strong> ${deliveries
          .sort((a, b) => a.sequence - b.sequence)
          .map((d) => d.scheduled_for)
          .join(", ")}</p>`
      : "";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px">
      <h2 style="font-size:18px;margin:0 0 12px">New order: ${formatPrice(details.totalCents)} ${details.currency}</h2>
      <p style="font-size:14px;color:#333">From <strong>${details.shippingName ?? details.email}</strong> (${details.email})</p>
      <ul style="font-size:14px;color:#333;line-height:1.6">${itemRows}</ul>
      ${schedule}
      <p style="font-size:12px;color:#999;margin-top:20px">Order ${details.orderId}. Manage at https://coastalendurance.com/admin</p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: recipients,
        subject: `New order: ${formatPrice(details.totalCents)} ${details.currency}`,
        html,
      }),
    });
    if (!res.ok) console.error("admin notification failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("admin notification error", e);
  }
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider);
  } catch (e) {
    console.error("signature verification failed", e);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("checkout.session.completed without order_id", session.id);
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Idempotency: only process a pending order once.
  const { data: order } = await admin
    .from("orders")
    .select("id, status, email, total_cents, currency")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    console.error("order not found for session", session.id, orderId);
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  }
  if (order.status !== "pending") {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { "Content-Type": "application/json" } });
  }

  // Shipping details location varies by API version — read defensively.
  const anySession = session as unknown as {
    shipping_details?: { name?: string; address?: unknown };
    collected_information?: { shipping_details?: { name?: string; address?: unknown } };
    customer_details?: { name?: string; email?: string; address?: unknown };
  };
  const shipping = anySession.shipping_details ?? anySession.collected_information?.shipping_details;
  const email = order.email || session.customer_details?.email || anySession.customer_details?.email || "";
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  await admin
    .from("orders")
    .update({
      status: "paid",
      email,
      stripe_payment_intent_id: paymentIntentId,
      shipping_name: shipping?.name ?? session.customer_details?.name ?? null,
      shipping_address: (shipping?.address ?? session.customer_details?.address ?? null) as never,
      total_cents: session.amount_total ?? order.total_cents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // Decrement inventory per product (atomic; guards against overselling).
  const { data: items } = await admin
    .from("order_items")
    .select("variant_id, bottles_each, quantity, product_name, variant_label, unit_price_cents")
    .eq("order_id", order.id);

  const bottlesPerProduct = new Map<string, number>();
  const variantIds = [...new Set((items ?? []).map((i) => i.variant_id).filter(Boolean))] as string[];
  if (variantIds.length > 0) {
    const { data: variants } = await admin
      .from("product_variants")
      .select("id, product_id")
      .in("id", variantIds);
    const productByVariant = new Map((variants ?? []).map((v) => [v.id, v.product_id]));
    for (const it of items ?? []) {
      const pid = it.variant_id ? productByVariant.get(it.variant_id) : undefined;
      if (!pid) continue;
      bottlesPerProduct.set(pid, (bottlesPerProduct.get(pid) ?? 0) + it.bottles_each * it.quantity);
    }
  }
  for (const [productId, bottles] of bottlesPerProduct) {
    const { error } = await admin.rpc("decrement_stock", { p_product_id: productId, p_bottles: bottles });
    if (error) {
      // Payment succeeded but stock couldn't be decremented — flag for manual review.
      console.error("stock decrement failed (needs review)", { orderId: order.id, productId, bottles, error });
    }
  }

  const { data: deliveries } = await admin
    .from("order_deliveries")
    .select("scheduled_for, sequence")
    .eq("order_id", order.id);

  await sendReceipt(email, { total_cents: session.amount_total ?? order.total_cents, currency: order.currency }, items ?? [], deliveries ?? []);
  await sendAdminNotification(
    admin,
    {
      orderId: order.id,
      email,
      totalCents: session.amount_total ?? order.total_cents,
      currency: order.currency,
      shippingName: shipping?.name ?? session.customer_details?.name ?? null,
    },
    items ?? [],
    deliveries ?? [],
  );

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
