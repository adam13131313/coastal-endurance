-- Brand inspiration + competitive intelligence: competitor/inspiration profiles and
-- our positioning relative to each. Admin-only reference. Editable (markdown profiles).
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'competitor' CHECK (kind IN ('self', 'competitor', 'inspiration')),
  category text,
  url text,
  one_liner text,
  our_position text,          -- our position relative to them (short, ready-reference)
  profile text,               -- fuller markdown profile
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage competitors" ON public.competitors
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.competitors (name, kind, category, url, one_liner, our_position, profile, sort) VALUES

('Coastal Endurance — Field Oil', 'self', 'Our position', 'https://coastalendurance.com',
 'One 30 ml face oil. A$78 / £42. Equipment maintenance for a life in a sunburnt country.',
 'We own a lane no one else stands in: a single, fragrance-free, naturally-derived face oil positioned as equipment maintenance for weathered Australian men — not skincare, not a ritual, not a range.',
 $md$## Where we sit

**One product, one job, one story.** Field Oil is a 30 ml daily face oil — A$78 / £42, majority (65% by weight) Australian-grown, 100% naturally derived, zero fragrance. The whole brand rests on a reframe: *equipment maintenance, not skincare.*

**The map, in one line each:**
- vs **Aesop**: they sell a botanical, fragranced, genderless *ritual*; we sell a fragrance-free, single-purpose *tool* for men.
- vs **Capry**: same honest single-oil *format*, opposite *frame* — they solve a problem (flaky skin), we maintain an identity (a life outdoors).
- vs **Standard Procedure**: our nearest Australian sibling in spirit, different product (sun vs face) and register (nostalgic/accessible vs terse/premium).
- vs the **men's mainstream** (Bulldog, Hims, drugstore): we're the premium single tool with a story, not a cheap multi-step system.

**What only we say:** "We don't make skincare. We make equipment maintenance." · "For Sun, Salt, Wind, & Time." · "Field Oil maintains what the elements wear down."

**Our moat is discipline, not formula:** anyone can blend oils; few will refuse fragrance, refuse a second product, refuse ritual language, and hold a single premium price. The restraint *is* the brand.$md$, 0),

('Aesop — Fabulous Face Oil', 'competitor', 'Luxury apothecary (unisex)', 'https://www.aesop.com',
 'Melbourne luxury apothecary (est. 1987, now L''Oréal-owned). Fabulous Face Oil ~US$61 / 25 ml — botanical, fragranced, ritual-led.',
 'We are the anti-Aesop on ritual: they sell a genderless botanical *ritual* wrapped in fragrance; we sell a fragrance-free, single-purpose *maintenance tool* for men. We share the amber-bottle, ingredient-honest cues — and deliberately reject the spa register they own.',
 $md$## Profile

Australian icon (founded Melbourne, 1987; acquired by L'Oréal in 2023, ~US$2.5B). The reference point for design-led, ingredient-forward skincare and for *retail-as-theatre*. Certified B Corp, vegan, Leaping Bunny.

**Fabulous Face Oil** — ~US$61 / 25 ml. Botanical and openly fragranced: macadamia, sweet almond, camellia, evening primrose, hazelnut, sunflower, wheatgerm, plus **juniper, ylang ylang and jasmine** and the fragrance allergens that come with them (linalool, limonene, geraniol, eugenol, benzyl benzoate). Contains nut derivatives. Positioned for "dull and congested skin", "purifying, balancing, skin-softening".

## Contrast with us
- **Fragrance:** their hero cue is scent; our hard rule is zero fragrance. This is the cleanest single line of difference.
- **Gender & register:** genderless, intellectual, apothecary/ritual. We are men-specific and anti-ritual.
- **Range vs focus:** vast catalogue. We are one product.
- **Visual overlap:** amber glass, restrained typography, ingredient honesty — worth noting we swim in adjacent aesthetic waters, so our copy and use-context (equipment, outdoors, not bathroom shelf) must do the differentiating.

## What to learn / avoid
- **Learn:** design discipline, ingredient storytelling, packaging-as-object, price confidence.
- **Avoid:** fragrance, ritual language ("routine", "glow"), genderless neutrality, catalogue sprawl.$md$, 1),

('Capry', 'competitor', 'Functional single-oil (UK)', 'https://capry.co.uk',
 'UK single-oil brand. Caprylic-triglyceride + squalane + bisabolol + Vitamin E for flaky/dry scalp & skin. Founder-led, 90-day guarantee, 1,000+ 5-star reviews.',
 'Closest to us in FORMAT (one honest oil, few ingredients), opposite in FRAME: Capry solves a problem (dandruff/flakes) for everyone; we maintain an identity (a life outdoors) for a specific man. Their founder-story + guarantee + review-volume playbook is worth copying.',
 $md$## Profile

A focused UK DTC brand built on a single product, **Capry Oil** — coconut-derived caprylic triglyceride, squalane, bisabolol and natural Vitamin E, for flaky/dry scalp, face and body. Founder-led (Deion's own decade of dry, flaky skin → formulated the fix). Trust-builders: **90-day money-back guarantee**, 1,000+ 5-star reviews, plain "here's what it does" copy.

## Contrast with us
- **Problem-led vs identity-led:** Capry sells relief from a symptom (flakes, itch, dandruff). We sell membership in a life (weathered, outdoors). Theirs is universal and reason-to-buy-today; ours is aspirational and reason-to-belong.
- **Neutral vs rooted:** no gender, no place, no world-building. We are unmistakably male and unmistakably Australian.
- **Single-product kinship:** the one thing we clearly share — the discipline of one good product, not a range.

## What to learn / avoid
- **Learn:** the guarantee, the founder narrative, the review-volume flywheel, the refusal to expand the range.
- **Avoid:** leading with a problem/symptom (drags us toward "treatment" and away from maintenance-as-identity).$md$, 2),

('Standard Procedure', 'competitor', 'Australian sun & skin care', 'https://standardprocedure.com',
 'Sunshine Coast QLD suncare (est. 2020). Nostalgic surf heritage, family 40-yr factory, reef-friendly SPF 50+. "Serious about sunscreen, relaxed about the rest." Australian-made, accessible, now in Sephora AU.',
 'Our nearest Australian sibling in spirit — same sun/coast/outdoor world and Australian-made pride — but a different product (sunscreen vs face oil), a different register (nostalgic/accessible/fun vs terse/premium/equipment) and a different customer temperature (everyone vs the weathered man). The key tone-in-market benchmark, and the obvious collision point if we ever make sunscreen (see the Mineral Sunscreen idea brief).',
 $md$## Profile

Launched 2020 on the Sunshine Coast; suncare made in a solar-powered family factory with 40+ years of formulation heritage. Aesthetic is **sun-soaked nostalgia** — bygone Australian beach culture, bronzed and easy. Reef-friendly, "no nasties", native super-fruits + vitamins. Tone is warm, inclusive, a little playful: *"serious about sunscreen, relaxed about the rest."* Distribution has scaled into Sephora AU and design-led stockists.

## Contrast with us
- **Product:** sunscreen (prevention) vs face oil (maintenance) — adjacent, not overlapping *yet*.
- **Register:** their nostalgia/fun vs our terse, spec-led, equipment restraint. Both proudly Australian, very different voices.
- **Customer temperature:** "sunscreen is for everyone" (broad, accessible) vs our specific, weathered-man focus.

## Strategic note
The most useful *domestic* benchmark for tone, packaging and Australian-made storytelling. If the Mineral Sunscreen idea ever wakes up, Standard Procedure is the incumbent to out-position (they own nostalgic-accessible; the open lane is the visible-zinc, equipment-for-full-exposure register).

## What to learn / avoid
- **Learn:** Australian-made narrative, retail distribution path, an ownable single-category focus.
- **Avoid:** their broad-accessible tone (it would blur our premium, specific edge).$md$, 3),

('Atlantic Coastal Supplies', 'inspiration', 'Coastal equipment & apparel (UK)', 'https://atlanticcoastalsupplies.com',
 'Cornwall (UK) maker of "equipment & apparel for aquatic pursuits" — surf fins, wetsuits, watches, tees, bags. NOT skincare — a brand-world reference.',
 'A world, not a rival. This is what we want our AESTHETIC to feel like: coastal, functional, equipment-first, understated, community-led. Their sentence — "equipment & apparel for aquatic pursuits" — is a cousin of ours: "equipment maintenance for a life in a sunburnt country."',
 $md$## Why it inspires (not a competitor)

Atlantic Coastal Supplies makes gear and apparel for the sea — fins, wetsuits, watches, tees, blankets — from West Penwith, Cornwall. No skincare, no overlap on product. What we take from them is the **brand world**:

- **Equipment-first framing** — objects for a life on the water, presented as tools, not fashion. Direct cousin of our equipment-maintenance frame.
- **Coastal, understated, functional** aesthetic — muted, real, unfussy; product-as-object photography.
- **Community/lifestyle voice** — "stories, happenings, new products", not hype.

## What to borrow
Their product photography discipline (the object, honestly lit), their unfussy voice, and the way "supplies / equipment for [pursuit]" reads as quietly confident. **Ignore** that they sell gear — the lesson is tone and world, not category.$md$, 4),

('Men''s-skincare mainstream', 'competitor', 'Mass / DTC men''s (category foil)', NULL,
 'The mass end — drugstore and DTC functional men''s ranges (Bulldog, Hims, CeraVe-for-men, supermarket "for men" lines). Multi-step, cheap, problem/utility-led.',
 'The floor we price and position above. We are not a cheap multi-step "man wash + moisturiser" system; we are one premium tool with a story and a place. This category defines what we are NOT — its existence makes our restraint and price legible.',
 $md$## The category, not a single brand

A useful foil rather than a named rival: the broad men's-grooming shelf — Bulldog, Hims, drugstore and supermarket "for men" lines. Characteristics: functional/utility copy, multi-step ranges, low price, problem- or convenience-led ("2-in-1", "wake up your skin"), often gimmicky masculinity.

## How we use it
- **Price anchor:** our A$78 single bottle reads as considered, not expensive, against a category trained to be cheap and multi-SKU.
- **Positioning contrast:** we are the antithesis of the multi-step routine — one product, one job.
- **Voice contrast:** we avoid both drugstore gimmickry ("built tough") and the earnest cheapness of the mass end.

Keep an eye only for pricing/positioning drift — no need to profile individual mass brands unless one moves premium and Australian.$md$, 5);
