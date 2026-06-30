import { supabase } from "@/integrations/supabase/client";

export interface ProductVariant {
  id: string;
  slug: string;
  label: string;
  price_cents: number;
  bottles: number;
  deliveries_count: number;
  default_interval_months: number;
  is_bundle: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  stock_quantity: number;
  variants: ProductVariant[];
}

// Fetch an active product with its active variants (ordered). RLS already
// restricts both to active rows, so no extra filtering is needed.
export async function fetchProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, description, image_url, currency, stock_quantity,
       product_variants ( id, slug, label, price_cents, bottles, deliveries_count, default_interval_months, is_bundle, sort_order )`,
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  const variants = [...(data.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return { ...data, variants };
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Orders are open now, but the first physical shipments go out from this date.
// Keep in sync with FIRST_SHIP_DATE in supabase/functions/create-checkout.
export const FIRST_SHIP_DATE = "2026-08-18";

// The earliest a shipment can be scheduled: today, or the first-ship date if
// that's still in the future.
export function firstShipBase(): Date {
  const today = new Date();
  const first = new Date(FIRST_SHIP_DATE + "T00:00:00");
  return today > first ? today : first;
}

// Default delivery schedule for a bundle: first dispatch on/after the first-ship
// date, then spaced `intervalMonths` apart. Returns ISO date strings (yyyy-mm-dd).
export function defaultDeliveryDates(
  count: number,
  intervalMonths: number,
  from: Date = new Date(),
): string[] {
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + i * intervalMonths);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
