import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

// Operational notifications go only to the assigned dispatch contact(s)
// (admins.notify_ops). Falls back to every admin if nobody is flagged, so
// alerts can never silently stop.
async function opsRecipients(client: ReturnType<typeof createClient>): Promise<string[]> {
  const { data: flagged } = await client.from("admins").select("email").eq("notify_ops", true);
  let rows = (flagged ?? []) as Array<{ email: string | null }>;
  if (rows.length === 0) {
    const { data: all } = await client.from("admins").select("email");
    rows = (all ?? []) as Array<{ email: string | null }>;
  }
  return rows.map((a) => a.email as string).filter(Boolean);
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_ADDRESS = "Coastal Endurance <noreply@coastalendurance.com>";
const LOW_STOCK_THRESHOLD = 10;

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
  pickup = false,
) {
  if (!RESEND_API_KEY || !to) return;
  const itemRows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.quantity} × ${i.product_name} (${i.variant_label})</td>` +
        `<td style="padding:4px 0;text-align:right">${formatPrice(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const schedule = pickup
    ? `<p style="font-size:14px;color:#333"><strong>Collecting in person.</strong> Nothing will ship. Reply to this email or write to hello@coastalendurance.com and we'll arrange a time for you to collect.</p>`
    : deliveries.length > 1
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

// Tell the customer their full refund has been processed (on-brand, matches the receipt).
async function sendRefundConfirmation(to: string, order: { total_cents: number; currency: string }) {
  if (!RESEND_API_KEY || !to) return;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 28px">
      <p style="font-size:13px;font-weight:600;letter-spacing:3px;margin:0">COASTAL ENDURANCE</p>
      <hr style="border:none;border-top:1px solid #d6cfc4;margin:16px 0 24px"/>
      <h1 style="font-size:22px;margin:0 0 16px">Refund processed</h1>
      <p style="font-size:15px;color:#333;line-height:1.6">We've refunded <strong>${formatPrice(order.total_cents)} ${order.currency}</strong> to your original payment method. Your bank usually takes 5 to 10 business days to show it.</p>
      <p style="font-size:15px;color:#333;line-height:1.6">Any questions, find us at coastalendurance.com.</p>
      <p style="font-size:13px;color:#999;margin-top:24px">Coastal Endurance · Made in Australia</p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject: "Your Coastal Endurance refund", html }),
    });
    if (!res.ok) console.error("customer refund email failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("customer refund email error", e);
  }
}

// Notify the store's admins (from the public.admins allowlist) of a new paid order.
async function sendAdminNotification(
  supa: ReturnType<typeof createClient>,
  details: { orderId: string; email: string; totalCents: number; currency: string; shippingName: string | null; pickup?: boolean },
  items: Array<{ product_name: string; variant_label: string; quantity: number; unit_price_cents: number }>,
  deliveries: Array<{ scheduled_for: string; sequence: number }>,
) {
  if (!RESEND_API_KEY) return;
  const recipients = await opsRecipients(supa);
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
      ${details.pickup ? `<p style="font-size:14px;color:#b45309;font-weight:600">COLLECT IN PERSON — no shipment. Customer will contact you to arrange collection.</p>` : ""}
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

// Email admins when a product drops to/below the low-stock threshold.
async function sendLowStockAlert(
  supa: ReturnType<typeof createClient>,
  productId: string,
  remaining: number,
) {
  if (!RESEND_API_KEY) return;
  const { data: product } = await supa.from("products").select("name").eq("id", productId).maybeSingle();
  const recipients = await opsRecipients(supa);
  if (recipients.length === 0) return;
  const name = (product as { name?: string } | null)?.name ?? "a product";
  // Stock can go negative — sales are never gated on it — so below zero the
  // number is bottles owed, not bottles left.
  const owed = remaining < 0;
  const line = owed
    ? `<strong>${Math.abs(remaining)}</strong> ${Math.abs(remaining) === 1 ? "bottle is" : "bottles are"} owed on orders already paid for. Time to batch.`
    : `Only <strong>${remaining}</strong> left in stock. Time to restock.`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="font-size:18px;margin:0 0 12px">${owed ? "Bottles owed" : "Low stock"}: ${name}</h2>
      <p style="font-size:14px;color:#333">${line}</p>
    </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_ADDRESS, to: recipients, subject: owed ? `Bottles owed: ${Math.abs(remaining)}` : `Low stock: ${remaining} left`, html }),
    });
  } catch (e) {
    console.error("low stock email error", e);
  }
}

// On a full refund: mark the order refunded, cancel pending shipments, restock.
async function handleRefund(charge: Stripe.Charge) {
  if (!charge.refunded || charge.amount_refunded < charge.amount) return; // full refunds only
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: order } = await admin
    .from("orders")
    .select("id, status, email, total_cents, currency")
    .eq("stripe_payment_intent_id", pi)
    .maybeSingle();
  if (!order || order.status === "refunded") return;

  await admin.from("orders").update({ status: "refunded", updated_at: new Date().toISOString() }).eq("id", order.id);
  await admin.from("order_deliveries").update({ status: "cancelled" }).eq("order_id", order.id).eq("status", "scheduled");

  // Restock bottles.
  const { data: items } = await admin.from("order_items").select("variant_id, bottles_each, quantity").eq("order_id", order.id);
  const variantIds = [...new Set((items ?? []).map((i) => i.variant_id).filter(Boolean))] as string[];
  const bottlesPerProduct = new Map<string, number>();
  if (variantIds.length > 0) {
    const { data: variants } = await admin.from("product_variants").select("id, product_id").in("id", variantIds);
    const productByVariant = new Map((variants ?? []).map((v) => [v.id, v.product_id]));
    for (const it of items ?? []) {
      const pid = it.variant_id ? productByVariant.get(it.variant_id) : undefined;
      if (pid) bottlesPerProduct.set(pid, (bottlesPerProduct.get(pid) ?? 0) + it.bottles_each * it.quantity);
    }
  }
  for (const [productId, bottles] of bottlesPerProduct) {
    const { error } = await admin.rpc("increment_stock", { p_product_id: productId, p_bottles: bottles });
    if (error) console.error("restock failed", { orderId: order.id, productId, bottles, error });
  }

  // Confirm the refund to the customer.
  await sendRefundConfirmation(order.email, { total_cents: order.total_cents, currency: order.currency });

  if (RESEND_API_KEY) {
    const recipients = await opsRecipients(admin);
    if (recipients.length) {
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="font-size:18px;margin:0 0 12px">Order refunded</h2>
          <p style="font-size:14px;color:#333">Order ${order.id} (${order.email}), ${formatPrice(order.total_cents)} ${order.currency}, was refunded. Bottles restocked and pending shipments cancelled.</p>
        </div>`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM_ADDRESS, to: recipients, subject: "Order refunded", html }),
        });
      } catch (e) {
        console.error("refund email error", e);
      }
    }
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

  if (event.type === "charge.refunded") {
    await handleRefund(event.data.object as Stripe.Charge);
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
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
    .select("id, status, email, total_cents, currency, fulfillment_method")
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

  // Best-effort: store the contact phone. The column may not exist until the
  // order_phone migration is applied, so a failure here is non-fatal.
  const phone = session.customer_details?.phone ?? null;
  if (phone) {
    const { error: phoneErr } = await admin.from("orders").update({ phone }).eq("id", order.id);
    if (phoneErr) console.warn("phone not stored (apply order_phone migration?)", phoneErr.message);
  }

  // CRM: upsert a contact for this customer and log the order on their timeline.
  // Best-effort — non-fatal if the CRM migration isn't applied yet.
  try {
    const addr = (shipping?.address ?? anySession.customer_details?.address ?? null) as { country?: string } | null;
    const { data: contactId } = await admin.rpc("upsert_contact_from_order", {
      p_email: email,
      p_name: shipping?.name ?? session.customer_details?.name ?? null,
      p_phone: phone,
      p_country: addr?.country ?? null,
      p_currency: order.currency,
    });
    if (contactId) {
      await admin.from("contact_events").insert({
        contact_id: contactId,
        type: "order_placed",
        meta: { order_id: order.id, total_cents: session.amount_total ?? order.total_cents, currency: order.currency },
        actor: "system",
      });

      // Field team: if this customer was issued a code and is still mid-pipeline,
      // this order is the redemption — advance them to "ordered" (code applied /
      // bottle ordered) and log it. Matches by order email; a guest checkout with
      // a different email won't match (advance manually in that case).
      try {
        const lc = (email || "").trim().toLowerCase();
        const { data: ftm } = lc
          ? await admin.from("approved_field_team_members").select("discount_code").eq("email", lc).maybeSingle()
          : { data: null };
        if (ftm) {
          const { data: pipe } = await admin.from("contact_pipelines")
            .select("id, stage").eq("contact_id", contactId).eq("pipeline", "field_team").maybeSingle();
          if (pipe && ["invited", "confirmed", "code_sent"].includes(pipe.stage as string)) {
            const now = new Date().toISOString();
            await admin.from("contact_pipelines")
              .update({ stage: "ordered", status: "active", stage_entered_at: now, updated_at: now })
              .eq("id", pipe.id);
            const amountDiscount = (session as unknown as { total_details?: { amount_discount?: number } }).total_details?.amount_discount ?? 0;
            await admin.from("contact_events").insert({
              contact_id: contactId,
              type: "redeemed",
              note: `Code applied / bottle ordered (order ${order.id})`,
              meta: { order_id: order.id, amount_discount: amountDiscount, discount_code: ftm.discount_code },
              actor: "system",
            });
          }
        }
      } catch (e) {
        console.warn("field-team advance skipped", e instanceof Error ? e.message : e);
      }
    }
  } catch (e) {
    console.warn("contact sync skipped (apply CRM migration?)", e instanceof Error ? e.message : e);
  }

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
    const { data: remaining, error } = await admin.rpc("decrement_stock", { p_product_id: productId, p_bottles: bottles });
    if (error) {
      // Stock going negative is allowed, so this now only fires on a genuine
      // fault (unknown product). Payment already succeeded — flag for review.
      console.error("stock decrement failed (needs review)", { orderId: order.id, productId, bottles, error });
    } else if (typeof remaining === "number" && remaining <= LOW_STOCK_THRESHOLD) {
      await sendLowStockAlert(admin, productId, remaining);
    }
  }

  const { data: deliveries } = await admin
    .from("order_deliveries")
    .select("scheduled_for, sequence")
    .eq("order_id", order.id);

  const pickup = (order as { fulfillment_method?: string }).fulfillment_method === "pickup";
  await sendReceipt(email, { total_cents: session.amount_total ?? order.total_cents, currency: order.currency }, items ?? [], deliveries ?? [], pickup);
  await sendAdminNotification(
    admin,
    {
      orderId: order.id,
      email,
      totalCents: session.amount_total ?? order.total_cents,
      currency: order.currency,
      shippingName: shipping?.name ?? session.customer_details?.name ?? null,
      pickup,
    },
    items ?? [],
    deliveries ?? [],
  );

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
