import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const SITE_FALLBACK = "https://coastal-endurance.vercel.app";

const ALLOWED_ORIGINS = [
  "https://coastalendurance.com",
  "https://www.coastalendurance.com",
];

function originAllowed(origin: string | null): boolean {
  return (
    origin != null &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin))
  );
}

function corsHeadersFor(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// Best-effort: pull the user id from the caller's Supabase JWT (if signed in).
function userIdFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
    return claims?.role === "authenticated" && typeof claims.sub === "string" ? claims.sub : null;
  } catch {
    return null;
  }
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
});

interface IncomingItem {
  variantId: string;
  quantity: number;
  deliveryDates?: string[];
}

const isIsoDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeadersFor(origin);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json().catch(() => ({}));
    const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
    const email: string | undefined =
      typeof body?.email === "string" && body.email.includes("@") ? body.email : undefined;
    const attr = body?.attribution && typeof body.attribution === "object" ? (body.attribution as Record<string, unknown>) : null;
    const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v.slice(0, 300) : null);

    if (rawItems.length === 0) return json({ error: "Your cart is empty." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Load authoritative variant + product data (never trust client prices).
    const variantIds = [...new Set(rawItems.map((i) => i.variantId))];
    const { data: variants, error: vErr } = await admin
      .from("product_variants")
      .select("id, label, price_cents, bottles, deliveries_count, default_interval_months, is_bundle, product_id, products(name, currency, stock_quantity, active)")
      .in("id", variantIds)
      .eq("active", true);

    if (vErr) {
      console.error("variant lookup failed", vErr);
      return json({ error: "Could not load products." }, 500);
    }

    const byId = new Map((variants ?? []).map((v) => [v.id, v]));

    // Build line items + tally bottles per product for the stock check.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const bottlesPerProduct = new Map<string, number>();
    type ResolvedItem = { incoming: IncomingItem; variant: NonNullable<ReturnType<typeof byId.get>> };
    const resolved: ResolvedItem[] = [];
    let subtotalCents = 0;

    for (const item of rawItems) {
      const variant = byId.get(item.variantId);
      const product = variant?.products;
      if (!variant || !product || !product.active) {
        return json({ error: "An item in your cart is no longer available." }, 400);
      }
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      subtotalCents += variant.price_cents * quantity;
      bottlesPerProduct.set(
        variant.product_id,
        (bottlesPerProduct.get(variant.product_id) ?? 0) + variant.bottles * quantity,
      );
      resolved.push({ incoming: { ...item, quantity }, variant });
      lineItems.push({
        quantity,
        price_data: {
          currency: (product.currency || "AUD").toLowerCase(),
          unit_amount: variant.price_cents,
          product_data: { name: `${product.name} — ${variant.label}` },
        },
      });
    }

    // Stock pre-check (final decrement happens atomically in the webhook).
    for (const [productId, needed] of bottlesPerProduct) {
      const product = (variants ?? []).find((v) => v.product_id === productId)?.products;
      if (!product || product.stock_quantity < needed) {
        return json({ error: "Sorry — there isn't enough stock for that order." }, 409);
      }
    }

    const currency = (resolved[0].variant.products?.currency || "AUD").toUpperCase();
    const userId = userIdFromAuth(req.headers.get("Authorization"));

    // Create a pending order; the webhook flips it to paid on payment success.
    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        email: email ?? "",
        status: "pending",
        currency,
        subtotal_cents: subtotalCents,
        total_cents: subtotalCents,
      })
      .select("id")
      .single();

    if (oErr || !order) {
      console.error("order insert failed", oErr);
      return json({ error: "Could not start checkout." }, 500);
    }

    // Best-effort attribution (columns exist after the order_attribution migration).
    if (attr) {
      const { error: attrErr } = await admin
        .from("orders")
        .update({
          utm_source: str(attr.utm_source),
          utm_medium: str(attr.utm_medium),
          utm_campaign: str(attr.utm_campaign),
          referrer: str(attr.referrer),
        })
        .eq("id", order.id);
      if (attrErr) console.warn("attribution not stored (apply order_attribution migration?)", attrErr.message);
    }

    // Order items.
    const { data: insertedItems, error: iErr } = await admin
      .from("order_items")
      .insert(
        resolved.map((r) => ({
          order_id: order.id,
          variant_id: r.variant.id,
          product_name: r.variant.products?.name ?? "Field Oil",
          variant_label: r.variant.label,
          quantity: r.incoming.quantity,
          unit_price_cents: r.variant.price_cents,
          bottles_each: r.variant.bottles,
        })),
      )
      .select("id, variant_id");

    if (iErr || !insertedItems) {
      console.error("order_items insert failed", iErr);
      return json({ error: "Could not start checkout." }, 500);
    }

    // Delivery schedule rows: bundles use the chosen/validated dates; singles ship once.
    const deliveries: Array<{
      order_id: string;
      order_item_id: string;
      sequence: number;
      scheduled_for: string;
    }> = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const r of resolved) {
      const itemRow = insertedItems.find((x) => x.variant_id === r.variant.id);
      if (!itemRow) continue;
      if (r.variant.is_bundle) {
        const provided = (r.incoming.deliveryDates ?? []).filter(isIsoDate);
        const dates =
          provided.length === r.variant.deliveries_count
            ? provided
            : defaultDates(r.variant.deliveries_count, r.variant.default_interval_months);
        dates.forEach((d, idx) =>
          deliveries.push({ order_id: order.id, order_item_id: itemRow.id, sequence: idx + 1, scheduled_for: d }),
        );
      } else {
        deliveries.push({ order_id: order.id, order_item_id: itemRow.id, sequence: 1, scheduled_for: today });
      }
    }
    if (deliveries.length > 0) {
      const { error: dErr } = await admin.from("order_deliveries").insert(deliveries);
      if (dErr) console.error("order_deliveries insert failed", dErr);
    }

    const siteBase = originAllowed(origin) ? origin! : SITE_FALLBACK;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email,
      success_url: `${siteBase}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteBase}/checkout/cancel`,
      shipping_address_collection: { allowed_countries: ["AU", "NZ", "GB", "US", "CA", "IE"] },
      phone_number_collection: { enabled: true },
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
    });

    await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return json({ url: session.url });
  } catch (e) {
    console.error("create-checkout error", e);
    return json({ error: "Unexpected error starting checkout." }, 500);
  }
});

function defaultDates(count: number, intervalMonths: number): string[] {
  const out: string[] = [];
  const from = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + i * intervalMonths);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
