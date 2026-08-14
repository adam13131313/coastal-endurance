-- Add the Protective / Barrier Balm to the product-ideas board as an active
-- exploration (status 'exploring'), with a full brief covering the v0.3/v0.5
-- bench-trial formula and first-pass business analysis. Idempotent on title.
-- Distinct from the parked "Barrier Balm — elbows & knees" idea (shea-heavy,
-- earlier direction); this is a concrete, in-trial multi-butter formula.
INSERT INTO public.product_ideas (title, description, category, status, sort, brief)
SELECT
  $t$Protective Balm — anti-chafe & barrier (v0.3 / v0.5 trial)$t$,
  $d$An anhydrous, water-resistant barrier balm: beeswax and kokum set over macadamia, jojoba, meadowfoam and castor. Protects against chafe, salt, wind and cold for endurance/outdoor use, and doubles as an everywhere / lip balm. Currently in a two-variant bench trial (v0.3 / v0.5).$d$,
  $c$Body$c$,
  'exploring',
  5,
  $brief$# Protective Balm — anti-chafe & barrier (working name)
### Product Idea — Formulation in trial

| Field | Value |
|---|---|
| **Idea** | Protective / barrier balm (anti-chafe, weatherproof) |
| **Category** | Line extension — Body |
| **Status** | Exploring — bench trial underway (v0.3 / v0.5) |
| **Date logged** | 14 August 2026 |
| **Owner** | Adam Hyde |
| **One-liner** | An anhydrous, water-resistant barrier balm. Equipment maintenance for skin that takes friction, salt, wind and cold. |
| **Tags** | body, line-extension, balm, anti-chafe, barrier, anhydrous, in-trial |

---

## Concept

An anhydrous (water-free) protective balm — all wax, butter and oil, no water phase. It lays down a water-repellent, occlusive film that shields skin against **friction, salt water, wind and cold**, then doubles as a fragrance-free **everywhere / lip balm** off the same base. It sits squarely in the *Coastal Endurance* frame: equipment maintenance for the body's hardest-worked skin, not a cosmetic.

Unlike the parked "Barrier Balm — elbows & knees" idea (shea-heavy, earlier direction), this is a **concrete formula already in bench trial**, with the wax and structure questions resolved (see below).

## The formula (bench trial)

Two complete 150 g batches — **300 g of balm total** — made as an A/B trial. Steps 1–7 run once per variant, sequentially in the same pot on the same day (make v0.3, pour, wash/dry the beaker, make v0.5). The only shared component is the **antioxidant premix**, weighed once (2.7 g Vitamin E + 0.3 g rosemary CO2 = 3.0 g) and split 1.5 g into each batch at step 4 — pooled because 0.15 g of rosemary CO2 per batch is below reliable scale accuracy.

**Bench totals (both variants combined):**

| Ingredient | Total | % of blend | Function |
|---|---|---|---|
| Beeswax, white | 33.0 g | 11% | Structure / water-repellent barrier |
| Kokum butter | 45.0 g | 15% | Structure — hard, high-stearic; dry, non-greasy finish |
| Castor oil | 42.0 g | 14% | Gloss, tack and adhesion of the film |
| Macadamia oil | 84.0 g | 28% | Cushion; skin-mimicking (palmitoleic acid) |
| Jojoba | 66.0 g | 22% | Slip and stability (sebum-like wax ester) |
| Meadowfoam | 27.0 g | 9% | Occlusive, oxidatively very stable barrier |
| Vitamin E | 2.7 g | 0.9% | Antioxidant (oil protection) |
| Rosemary CO2 | 0.3 g | 0.1% | Antioxidant (oil protection) |

**Structure:** ~26% solids (11% wax + 15% hard butter), ~73% liquid oils, ~1% antioxidants. That ratio gives a **firm-but-spreadable set** — holds shape in a tin/jar, or works as a slightly-soft push-up stick. The modest 11% beeswax (rather than 20%+) plus kokum is a deliberate **warm-climate melt-point** choice: firm enough to hold in Australian heat without feeling waxy or draggy.

> Percentages are the blended average across both variants — only the combined bench totals are recorded here. **v0.3 and v0.5 are a hardness / skin-feel dial-in** (wax-and-butter ratio), so the two columns differ; paste the per-column split to compare firmness, slip and finish and to match each to a tin vs. a stick.

**Brand note — wax choice:** this formula commits to **beeswax**, the first animal-derived ingredient in the range. That settles the vegan question in beeswax's favour (better set and water resistance than candelilla/carnauba at this level). If a plant-only range story is wanted, the wax is the one ingredient to revisit — a deliberate call, not a default.

## Why it fits

No new audience, no new frame, no new regulatory lane. The same customer who buys the flagship oil has exactly the skin this protects; the positioning language ("protection and maintenance for weathered, hard-worked skin") transfers word for word. It is a low-friction reason for the existing customer to buy a second product and opens an obvious **kit / cross-sell** (oil for the face, balm for the tough zones and the field).

The anti-chafe / weatherproof angle also gives *Coastal Endurance* a genuine **use-case wedge** — salt, wind, cold and friction from ocean and outdoor endurance — that the flagship oil does not directly own.

## Market

The balm shelf is polarised: cheap petroleum repair balms at one end, medicated anti-chafe sticks and fissure creams at the other, and little that is natural, honestly made and design-led aimed at the weathered outdoor/endurance user in the middle. A natural, fragrance-free, water-resistant barrier balm positioned as equipment maintenance sits cleanly in that gap. As with the other line extensions, the value is chiefly in **deepening an acquired relationship**, not winning a large standalone market — but this one shares the customer, the regulatory lane *and* much of the oil palette, which makes it cheaper and faster to a testable state.

## Unit economics (first-pass, illustrative)

Raw-material cost is oil-driven; **jojoba and meadowfoam are the cost levers**, castor and beeswax are cheap.

| Line (per 60 g tin) | Illustrative |
|---|---|
| Raw materials (~$4/100 g blend) | ~$2.50 |
| Tin + label + outer | ~$1.50–2.50 |
| Fill / labour / batch overhead | ~$1.00–2.00 |
| **Est. COGS** | **~$5–7** |
| Indicative retail (premium natural, 50–75 g) | ~$30–40 |
| **Implied contribution** | **healthy — well above the flagship's per-unit %** |

*(All figures illustrative and unmodelled. A proper first-principles build — real supplier prices at the chosen fill, tin/label/fill costs, uses-per-tin, target contribution — is required before any number is treated as real. Downgrading jojoba's share or swapping some meadowfoam is the obvious margin lever if needed.)*

## Format & fill

Sold by weight into a **tin or jar** (a 50–75 g fill is the likely target), with a push-up **stick** as a possible anti-chafe SKU off the same base at a slightly firmer ratio. Anhydrous means **no preservative system, low microbial risk, long shelf life and travel-friendly** — a real simplification versus any water-based cream.

## Risks & open questions

1. **Shipping/heat:** an oil-forward balm can soften or sweat in transit through hot climates — the melt-point (wax level) must survive a mailbox in summer. The v0.3/v0.5 trial should be judged partly on heat hold, not just skin-feel.
2. **Oxidation:** macadamia/meadowfoam/jojoba are relatively stable, but the antioxidant system and fill/lidding discipline still set the real shelf life for a tin opened repeatedly.
3. **Allergen:** macadamia carries a tree-nut declaration.
4. **Regulatory:** anti-chafe **protection** claims are cosmetic and fine under the AICIS pathway already understood from the flagship; avoid drifting into therapeutic (barrier-repair / medical) language.
5. **Format decision:** tin vs. stick changes firmness target, fill cost and price logic — resolve alongside the trial.

## Relationship to existing ideas

Supersedes the *direction* of the parked "Barrier Balm — elbows & knees" idea with a real, in-trial formula and a broader (anti-chafe / weatherproof + lip) use case. Keep both entries for now; if this progresses to planned, fold the parked idea into it or retire it.

## Recommendation & next trigger

Progress to **decision-ready** only after: (a) the v0.3/v0.5 trial picks a firmness/skin-feel winner that also survives a heat-hold test, (b) a first-principles cost build at the chosen fill, and (c) a tin-vs-stick format call. Not before the flagship's near-term commitments are clear — this is a fast follow, not a distraction.
$brief$
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_ideas
  WHERE title = $t$Protective Balm — anti-chafe & barrier (v0.3 / v0.5 trial)$t$
);
