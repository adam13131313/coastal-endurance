import { Helmet } from "react-helmet-async";
import { Separator } from "@/components/ui/separator";

const FieldTeam = () => {
  return (
    <main className="pt-20">
      <Helmet>
        <title>Field Oil — Beta Testing Guide | Coastal Endurance</title>
        <meta
          name="description"
          content="Beta testing guide for Field Oil by Coastal Endurance. Instructions, ingredients, feedback schedule for the 30-person field test."
        />
        <link rel="canonical" href="https://coastalendurance.com/field-team" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Coastal Endurance
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display uppercase tracking-tight">
            Field Oil — Beta Testing Guide
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-display text-foreground">
            Thank You for Testing
          </p>
          <p className="mt-6 text-[17px] text-muted-foreground leading-relaxed">
            You're one of 30 people testing Field Oil before our public launch.
            Your feedback will shape the final product.
          </p>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* How to Use */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-8">
            How to Use
          </h2>
          <ol className="space-y-4 text-[17px] text-muted-foreground leading-relaxed">
            <li className="flex gap-4">
              <span className="text-foreground font-semibold shrink-0">1.</span>
              <span>Apply 3–4 drops to damp skin (not dry)</span>
            </li>
            <li className="flex gap-4">
              <span className="text-foreground font-semibold shrink-0">2.</span>
              <span>Press into face and neck</span>
            </li>
            <li className="flex gap-4">
              <span className="text-foreground font-semibold shrink-0">3.</span>
              <span>Once daily (evening recommended)</span>
            </li>
            <li className="flex gap-4">
              <span className="text-foreground font-semibold shrink-0">4.</span>
              <span>One 30ml bottle = ~2 months supply</span>
            </li>
          </ol>
          <div className="mt-8 border border-border rounded bg-secondary/50 p-5">
            <p className="text-[17px] text-foreground leading-relaxed">
              <strong>Important:</strong> Apply to damp skin, not dry. The oil
              absorbs better when your skin is slightly wet.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* What to Expect */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-8">
            What to Expect
          </h2>
          <div className="space-y-8 text-[17px] text-muted-foreground leading-relaxed">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-2">
                Scent
              </h3>
              <p>
                Natural plant aroma — grassy, earthy, slightly nutty. This is
                normal. We don't add fragrance or essential oils, so you're
                smelling the raw ingredients (rosehip, jojoba, hemp seed).
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-2">
                Texture
              </h3>
              <p>
                Medium-weight oil. Not as light as a serum, not as heavy as pure
                coconut oil. Absorbs in ~2 minutes on damp skin.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-2">
                Finish
              </h3>
              <p>
                Should absorb completely. If it feels greasy after 5 minutes,
                you've used too much — try 2–3 drops instead of 4.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* What This Is */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-8">
            What This Is
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed mb-6">
            Field Oil is a 100% natural barrier maintenance face oil built for
            men with significant outdoor exposure. Not anti-aging. Not a luxury
            ritual. Equipment maintenance for skin that's seen years of sun,
            salt, wind, and time.
          </p>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              100% natural ingredients
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              59% Australian-grown (Tasmanian Hemp, Australian Jojoba, Australian Macadamia)
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              Function-first formula (no added fragrance, no essential oils)
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              7 active barrier-repair oils
            </li>
          </ul>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Full Ingredients */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-8">
            Full Ingredients
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed">
            Rosa Canina Fruit Oil (Rosehip), Simmondsia Chinensis Seed Oil
            (Jojoba), Cannabis Sativa Seed Oil (Hemp Seed), Macadamia
            Ternifolia Seed Oil (Macadamia), Limnanthes Alba Seed Oil
            (Meadowfoam), Tocopherol (Vitamin E), Rosmarinus Officinalis Leaf
            Extract (Rosemary)
          </p>
          <div className="mt-8 border border-destructive/30 rounded bg-destructive/5 p-5 space-y-3">
            <p className="text-[17px] text-foreground leading-relaxed">
              <strong>Allergen Warning:</strong> Contains tree nut derivatives
              (Macadamia)
            </p>
            <p className="text-[17px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Not suitable for:</strong>{" "}
              Very oily or acne-prone skin
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Storage */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-8">
            Storage
          </h2>
          <ul className="space-y-3 text-[17px] text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              Store below 25°C (77°F)
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              Keep away from direct sunlight
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              Keep bottle tightly closed
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              Use within 6 months of opening (for beta testing)
            </li>
          </ul>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Feedback Schedule */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-6">
            Feedback Schedule
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed mb-8">
            I'll check in with you 3 times during the 30-day test:
          </p>

          <div className="space-y-6">
            {/* Checkpoint 1 */}
            <div className="border border-border rounded p-6 bg-secondary/30">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-4">
                Checkpoint 1: When It Arrives
              </h3>
              <ul className="space-y-2 text-[17px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Did packaging arrive intact?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  First impressions of the product?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Have you tried it yet?
                </li>
              </ul>
            </div>

            {/* Checkpoint 2 */}
            <div className="border border-border rounded p-6 bg-secondary/30">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-4">
                Checkpoint 2: Week 2
              </h3>
              <ul className="space-y-2 text-[17px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  How does it feel on your skin?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Absorption time — too slow, too fast, just right?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Any issues? (breakouts, greasiness, scent problems)
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Are you using it daily?
                </li>
              </ul>
            </div>

            {/* Checkpoint 3 */}
            <div className="border border-border rounded p-6 bg-secondary/30">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground mb-4">
                Checkpoint 3: Week 4 (Final)
              </h3>
              <ul className="space-y-2 text-[17px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Would you buy this at $68?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  Overall experience (website → delivery → product)
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  What worked?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  What didn't?
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                  What would make it better?
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border border-border rounded bg-secondary/50 p-5">
            <p className="text-[17px] text-foreground leading-relaxed font-semibold">
              Be brutally honest. I need to know what's actually happening —
              good and bad. Polite feedback doesn't help me build a better
              product.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Contact */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-6">
            Questions or Issues?
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed mb-4">
            Email me directly:{" "}
            <a
              href="mailto:adam@coastalendurance.com"
              className="text-foreground underline underline-offset-4 hover:text-accent transition-colors"
            >
              adam@coastalendurance.com
            </a>
          </p>
          <p className="text-[17px] text-muted-foreground leading-relaxed">
            If you experience any skin irritation, stop use immediately and let
            me know.
          </p>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Closing */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide mb-6">
            Thanks Again
          </h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed mb-8">
            Your time and honest feedback are shaping Field Oil into something
            that actually works for people who spend serious time outdoors.
          </p>
          <div className="text-[17px] text-foreground leading-relaxed">
            <p>— Adam Hyde</p>
            <p className="text-muted-foreground">
              Founder, Coastal Endurance
            </p>
            <a
              href="https://coastalendurance.com"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mt-1 inline-block"
            >
              coastalendurance.com
            </a>
          </div>
        </div>
      </section>

      <div className="py-8" />
    </main>
  );
};

export default FieldTeam;
