// Field Team promo codes: what state is a code in, in Stripe?
//
// Deliberately dependency-free (no Stripe SDK types, no Deno APIs) so the same
// code runs in the field-team edge function and under vitest. The CRM uses it to
// flag a code that is spent or switched off before it goes out — Stripe shows
// "invalid" at checkout for both, so the member has no way to tell them apart.

export type PromoStatus = "active" | "redeemed" | "inactive" | "missing";

/** The slice of a Stripe promotion code we look at. */
export interface PromoLike {
  code: string;
  active: boolean;
  times_redeemed?: number | null;
}

/** Stripe treats codes case-insensitively, so we compare them that way too. */
export const normCode = (code: string): string => code.trim().toUpperCase();

/**
 * Field Team codes are single-use (max_redemptions: 1), so any redemption means
 * spent — Stripe also flips `active` off at that point, which is why redeemed is
 * checked first. "missing" is a code we hold that Stripe doesn't know about.
 */
export function classifyPromo(promo: PromoLike | null | undefined): PromoStatus {
  if (!promo) return "missing";
  if ((promo.times_redeemed ?? 0) > 0) return "redeemed";
  return promo.active ? "active" : "inactive";
}

/** Status of each requested code, looked up case-insensitively in `promos`. */
export function statusesFor(codes: string[], promos: PromoLike[]): Record<string, PromoStatus> {
  const byCode = new Map(promos.map((p) => [normCode(p.code), p]));
  const out: Record<string, PromoStatus> = {};
  for (const code of codes) out[code] = classifyPromo(byCode.get(normCode(code)));
  return out;
}
