import Markdown from "@/components/Markdown";

// Brand System reference — the resolved brand from the design pack (positioning,
// architecture, palette, type, voice, artefacts, blockers), plus the "field:"
// naming exploration it grew out of. Read-only reference; the full print-ready
// label/box/shipping specs live in the design-pack handoff docs.
const ACCENT = "#a9761f";

const PALETTE = [
  { name: "Stone", hex: "#F9F8F6", role: "Primary background — warm off-white" },
  { name: "Ink", hex: "#000000", role: "Body text · full-black panels" },
  { name: "Muted ink", hex: "#333333", role: "Secondary text" },
  { name: "Stone mid", hex: "#ECE7DF", role: "Panel / block fills" },
  { name: "Stone warm", hex: "#EEEBE8", role: "Alt block fills" },
  { name: "White", hex: "#FFFFFF", role: "Occasional contrast" },
];

const DOC = `## Positioning — field maintenance

**The idea.** You maintain your gear in the field; your skin is the gear that takes the most weather and gets the least care. The products are honestly skincare, framed and used like maintenance. One product, daily, no ritual.

**Say it's skincare; differentiate on approach.** Own the category and remove the reasons men avoid it (no ritual, no ten-step routine, sixty seconds). **Retire category denial** — "we don't make skincare" / "not skincare" is literally false and reads as spin. Keep it only as an internal north-star.

- ✅ "Skincare for men who don't do skincare." · "It's skincare. We just treat it like maintenance." · "The maintenance approach to skin."
- ❌ "We don't make skincare." · "Not skincare."

## Architecture — Coastal Endurance makes Field

- **Coastal Endurance** = the maker / endorsing name (the ethos, the name on the box, the trademarked brand).
- **Field** = the product system, numbered like kit: **Field Oil 001**, **Field Balm 002**, **Field Sun 003**, onward.
- **Lockup:** *"Field Oil 001 — by Coastal Endurance."* Two names, two jobs; don't let them compete. (This resolves the earlier A/B fork in favour of the endorsed structure.)

**The Field lexicon** (owned vocabulary, use consistently): Field Oil / Field Balm / Field Sun (products, numbered) · **Field Notes** (content) · **Field Team** (testers) · **Field Test** (validation batch) · **Field Kit** (bundle) · **Field Manual** (how-to insert/card) · **Field Report** (tester feedback).

## The range

- **Field Oil 001** — Daily skin barrier maintenance. *Live.*
- **Field Balm 002** — Protective, anti-chafe barrier. *In trial (v0.3/v0.5; recommended v0.6).*
- **Field Sun 003** — Mineral sunscreen. *Planned — and a separate, slower track: a sunscreen is a **TGA therapeutic good** in Australia (ARTG listing + AUST L number + SPF substantiation before sale). Do not batch or label it like the cosmetics. TGA is reforming sunscreen rules in 2026, so hold any fixed spec.*

## Wordmark

Identity is **purely typographic** — no logo image. Wordmark **COASTAL ENDURANCE** set in **IBM Plex Mono**, uppercase, wide tracking (~0.1em), black on stone. Product wordmark **FIELD OIL 001** / **FIELD BALM 002**, same family, larger as the hero.

*(The earlier "field:" colon treatment — mock-up linked below — was an exploration; the resolved design pack uses the plain wordmark. The colon remains an option if you want a typographic signature.)*

## Typography

- **Inter** — headings and body copy (anything that reads like a sentence).
- **IBM Plex Mono** — wordmark, nav, labels, tags, specs (anything that reads like a label/spec). Always **uppercase, tracked**. This mono treatment is the brand's signature.
- Print minimums: ingredients ≥ 6pt, directions ≥ 8pt.

## Voice

Function-first, direct, understated. No hype, no self-care/luxury/anti-aging language, no exclamation gush. Lines that define it:

- "For Sun, Salt, Wind, & Time"
- "Maintains what the elements wear down"
- "Function-first. Every ingredient earns its place."
- "One product. Daily. That's the routine."
- "Updates only. No noise."

Use "barrier maintenance / supports the skin barrier" (never "barrier repair" — therapeutic).

## Visual style

- **References:** Aesop, Muji, Patagonia gear tags, technical equipment packaging — minimal, typography-led, functional.
- **Materials:** stone paper, uncoated/kraft stock, matte, subtle deboss.
- **Photography:** rugged Australian coastline in real conditions, not glossy lifestyle.
- **Layout:** generous negative space, spec-sheet logic.
- **Avoid:** waves/mountains/surf illustrations, masculine clichés (axes, beards, leather), botanical drawings, decoration, gradients, metallics.

## What to design (artefacts)

| Artefact | Size | Product | Status |
|---|---|---|---|
| Field Oil 001 bottle label | 100 × 50 mm wrap | Oil | Design now (INCI/PAO pending batch worksheet) |
| Field Balm 002 band | 20 × ≤160 mm | Balm | Band = brand + name + net wt + pointer |
| Field Balm 002 hangtag / leaflet | ~A7 | Balm | Carries the full INCI + mandatory info |
| Marketing seal (box closer) | Round 75 mm | Both | Ready |
| Field card ("Field Manual") | A7 74 × 105 mm | Both | Ready (needs feedback URL) |
| Box compliance panel | 48 × 100 mm | Oil | Optional (if mailer hides the bottle) |
| Shipping label (mailer) | 100 × 150 mm | — | Ready / AusPost auto-gen |

**Field Balm INCI (confirmed, v0.6, descending):** Macadamia Integrifolia Seed Oil, Simmondsia Chinensis Seed Oil, Garcinia Indica Seed Butter, Cera Alba, Ricinus Communis Seed Oil, Limnanthes Alba Seed Oil, Tocopherol, Helianthus Annuus Seed Oil, Rosmarinus Officinalis Leaf Extract. *Contains tree nut derivatives (macadamia). Contains beeswax (not vegan).*

*(Full print-ready copy for every artefact lives in the design-pack handoff docs.)*

## Open items / blockers

1. **Batch worksheet (Field Oil)** — locks INCI descending order + any % claims. No hard % claims until confirmed.
2. **PAO value** — 12M is a placeholder for both; confirm from stability/chemist review (hemp PUFA drives shelf life).
3. **UK Responsible Person** — any unit shipping to a UK tester needs a UK RP name + address on the product label, plus SCPN notification. Legal; verify before UK sends.
4. **Field Balm details** — net weight, container (tin/jar/tube), directions wording, sunflower-carrier confirmation.
5. **Feedback URL / QR** — needed for the seal and the Field card (drives the Field Report).
6. **Macadamia INCI name** — confirm integrifolia vs ternifolia per supplier CoA (affects both products).
7. **Field Sun = TGA therapeutic good** — separate, slower regulatory workstream (see the range, above).`;

const BrandStudy = () => (
  <div className="max-w-[820px] space-y-8">
    <div>
      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">Brand system · resolved from the design pack</p>
      <h2 className="mt-2 text-2xl font-typewriter uppercase">Brand System <span style={{ color: ACCENT }}>—</span> Coastal Endurance makes Field</h2>
      <p className="mt-3 text-sm font-body text-muted-foreground leading-relaxed">
        The resolved brand: positioning, architecture, palette, type, voice, and what to design. Coastal Endurance is the maker; Field is the numbered product system (Field Oil 001, Field Balm 002, Field Sun 003).
      </p>
    </div>

    {/* Palette swatches */}
    <section>
      <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Palette · monochrome stone &amp; black</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PALETTE.map((c) => (
          <div key={c.hex} className="border border-border flex items-stretch">
            <span className="w-12 shrink-0 border-r border-border" style={{ background: c.hex }} aria-hidden />
            <span className="px-3 py-2 min-w-0">
              <span className="block font-typewriter text-xs uppercase tracking-wider">{c.name}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">{c.hex}</span>
              <span className="block text-[11px] font-body text-muted-foreground leading-tight mt-0.5">{c.role}</span>
            </span>
          </div>
        ))}
      </div>
    </section>

    <Markdown>{DOC}</Markdown>

    <section className="border-t border-border pt-4">
      <p className="text-[13px] font-body text-muted-foreground">
        Naming exploration &amp; visual mock-up:{" "}
        <a href="https://claude.ai/code/artifact/a4d539e7-5189-49cc-8ff9-1707e557aa29" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:text-primary">the field: brand study →</a>
      </p>
    </section>
  </div>
);

export default BrandStudy;
