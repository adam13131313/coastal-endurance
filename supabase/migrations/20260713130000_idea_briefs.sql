-- Product ideas: attach a full exploration/discussion paper (markdown) to an idea.
-- The list stays a scannable card; the depth lives in the brief behind it.
ALTER TABLE public.product_ideas ADD COLUMN IF NOT EXISTS brief text;

-- Seed the first brief: Field Oil for Dogs (Adam's exploration paper, 13 Jul 2026).
UPDATE public.product_ideas
SET status = 'parked',
    brief = $brief$# Field Oil for Dogs (working name)
### Product Idea — Initial Exploration

| Field | Value |
|---|---|
| **Idea** | Field Oil for Dogs (working name) |
| **Category** | Line extension — Pets |
| **Status** | Parked — do not progress before Field Oil launch |
| **Date logged** | 13 July 2026 |
| **Owner** | Adam Hyde |
| **One-liner** | A coat and skin oil for working and outdoor dogs. Same brand promise, four legs. |
| **Tags** | pets, line-extension, natural-oil, coat-care, parked |

---

## Concept

A coat and skin oil for working and outdoor dogs — dry, weathered, sun-, salt- and sand-exposed coats. Rubbed into the coat and skin. 100% naturally derived, performance-optimised, zero fragrance. It carries the Coastal Endurance promise across to a second subject: not a beauty or grooming ritual, but maintenance for an animal that works and lives outdoors.

The positioning writes itself from the existing frame. The men Field Oil is built for are the same men who own these dogs, and the dogs take the same environmental beating: sun, salt, wind, sand, dryness. "Your dog is part of the crew" is a natural extension of equipment maintenance rather than a departure from it.

## Why it fits

The audience overlap is close to exact. Surfers, runners, cyclists, tradies, farmers and ex-service owners disproportionately own active, outdoor, weather-exposed dogs. The brand voice, the "maintenance not treatment" discipline, the natural-and-honest ingredient story, and the Australian provenance all transfer without contortion. It deepens the relationship with the existing customer rather than chasing a new one, and it is a credible reason for that customer to buy a second product without cannibalising the first.

## Nature of the opportunity

A premium, natural coat oil aimed specifically at the *working and adventure dog* is an underserved niche. The pet coat-care shelf is crowded at the cheap end (generic conditioning sprays) and at the medicated end (vet dermatology), but thin in the middle where a design-led, honest, natural product for the active-dog owner would sit. The same premium-natural gap Coastal Endurance is exploiting for men exists for their dogs.

The opportunity is best understood as a **relationship and brand-extension play**, not a standalone category bet. Its value is in widening the Coastal Endurance world for an already-acquired customer, and in the storytelling ("built for the same conditions, for the whole crew"), more than in capturing a large independent market on its own.

## What transfers, what changes

Transfers cleanly: the brand, voice and positioning frame; supplier relationships; the hemp / Tasmania provenance story; the zero-fragrance, zero-essential-oils discipline; and the existing Supabase / Vercel / Stripe stack. A name essentially proposes itself ("Field Coat" or similar).

Changes materially: the formula, the fill size, the unit economics and the price logic. This is deliberately **not** Field Oil in a larger bottle. The expensive cosmetic actives that justify a premium face oil do not survive contact with dog-product economics, and two of them raise safety questions on top (below). It shares the brand and the suppliers, not the product.

## Formulation direction — the constraint that changes everything

Dogs lick. Whatever is rubbed into a coat is ingested in meaningful quantity. This reframes the work from a *topical cosmetic* problem to a *food-safe topical* problem: every ingredient must be non-toxic when eaten, not merely non-irritating on skin. That single fact governs the whole formula.

Two current Field Oil inputs are flagged on this basis, and both happen to be among the pricier inputs — so the safety pressure and the cost pressure point the same way:

- **Macadamia** — macadamia *nuts* are genuinely toxic to dogs (mechanism not understood). Refined macadamia *oil* is likely a different story, but "likely" is not good enough for daily ingestion. Treat as drop-or-verify.
- **Jojoba** — fine topically, but contains simmondsin, which is not intended for ingestion. Same lick problem. Treat as drop-or-verify.

The friendlier side: hemp is already a hero ingredient in canine coat products; Vitamin E is beneficial; rosemary at antioxidant dose is used as a natural preservative in dog food; sunflower is safe. The existing no-essential-oils rule is a genuine asset here, because many essential oils are outright toxic to dogs.

Formula direction, in short: a simpler, cheaper, high-linoleic carrier base doing coat-conditioning and barrier-support work, with ingestion safety verified ingredient by ingredient. A canine formulation specialist or vet plays the gating role here that the cosmetic chemist plays for Field Oil.

An open formulation question is whether to bring in omega-3 / fish oil, which is the star of dog coat health but drags in smell, oxidative instability and a break from the vegan/plant story.

## Format and unit economics

The economics are pulled in two directions at once, which is the crux of the whole idea.

A dog has far greater surface area than a face, covered in hair rather than skin, so an application is millilitres rather than the 3–4 drops Field Oil uses. Field Oil's 30ml lasting three to four months is the benchmark to move away from entirely. A dog product likely needs a **100–250ml fill** to deliver a sensible number of applications, and it will still be consumed far faster.

That means cost per unit rises (more oil in the bottle) while acceptable price *per ml* falls (owners will not pay face-oil rates to slather a dog). Margin is squeezed from both ends simultaneously. This is precisely why the formula must be genuinely cheaper, not repackaged — the product cannot carry premium-active input costs at dog-product volumes.

*(All figures illustrative and unmodelled. A first-principles build — carrier cost per ml at the larger fill, realistic applications per bottle, target contribution margin — is required before any of this is treated as real, in the same way the batch worksheet gates Field Oil.)*

## Pricing logic

Price should read as *sensible-for-a-dog*, on a per-ml logic, not *premium-for-a-face*. The mental model an owner applies is closer to a quality pet-care product than to a $78 face oil. The right frame is a larger fill at a lower per-ml price, positioned as good value for a natural, honestly-made product, with the premium expressed through quality and brand rather than through a high absolute number. The exact ladder falls out of the economics above once modelled.

## Regulatory pathway

Different regime from Field Oil. In Australia a pet grooming/coat product making **no therapeutic claims** is light-touch. The moment it claims to *treat* anything — dermatitis, hot spots, itch, healing — it becomes a veterinary chemical product under the **APVMA**, a heavier pathway than the AICIS cosmetics route already familiar from Field Oil.

The existing "maintenance, not treatment" discipline is exactly what keeps this on the light side of that line, so the brand instinct and the regulatory interest are aligned. The current APVMA position on cosmetic vs therapeutic pet products should be confirmed before progressing.

## Key risks

The largest near-term risk is **focus and timing**. Field Oil has not launched, the confirmed batch worksheet is still outstanding, and a Father's Day campaign is due to run. A second product pre-launch is textbook founder shiny-object risk. This is the reason the idea is parked rather than progressed.

Secondary risks: ingestion-safety verification could remove enough of the current palette to force a near-total reformulation; the two-way margin squeeze could make the economics marginal at achievable volumes; and omega-3 inclusion trades coat performance against smell, shelf-life and the plant-based story.

## Open questions

1. What exactly is the opportunity that prompted this — a distribution channel, a collaborator, a specific buyer, or a self-spotted gap? This determines whether it stays parked or is worth moving on sooner.
2. Which current ingredients survive an ingestion-safety review, and which must be dropped or substituted?
3. Fish oil / omega-3: in or out, given the smell, oxidation and vegan-story trade-offs?
4. Target fill size — 100, 150 or 250ml — and applications per bottle at that fill?
5. Confirmed APVMA position on no-claims coat products.
6. Does the modelled contribution margin clear a worthwhile threshold at realistic volumes?

## Recommendation and next trigger

Park. Do not progress before Field Oil ships and the Father's Day launch is executed. Re-open when Field Oil is live and stable, or earlier only if the answer to open question 1 reveals a concrete, time-sensitive opportunity (a named channel, buyer or partner) that justifies moving out of sequence.

*Filed to product ideas backend as an initial exploration. Not a commitment to build.*$brief$,
    updated_at = now()
WHERE title = 'Field Oil for Dogs';
