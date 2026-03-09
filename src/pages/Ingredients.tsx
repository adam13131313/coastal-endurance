import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const Ingredients = () => {
  const ingredients = [
    {
      name: "Rosehip Oil",
      origin: "Chilean/European origin, cold-pressed from seeds",
      function:
        "Essential fatty acids (the building blocks your skin uses to maintain itself) support barrier function. Contains vitamin A precursors. Used extensively in formulations for environmentally exposed skin.",
      why: "Primary active ingredient at clinical dose. High concentration of barrier-supporting lipids (your skin's natural oils that hold its protective layer together). At 35%, this addresses cumulative environmental damage from prolonged outdoor exposure.",
    },
    {
      name: "Jojoba Oil",
      origin: "Australian-grown, Western Australia/South Australia/NSW",
      function:
        "Structurally similar to human sebum (your skin's natural oil). Helps regulate skin's natural oil balance. Lightweight, non-comedogenic (won't clog pores) wax ester.",
      why: "Australian-sourced at clinical dose. Closely mimics skin's natural oil. Ideal for outdoor workers and athletes who sweat — helps maintain balanced skin without heaviness. Primary component of our 59% Australian-grown content.",
    },
    {
      name: "Hemp Seed Oil",
      origin: "Tasmanian-grown, cold-pressed, THC-free",
      function:
        "Balanced anti-inflammatory oil containing both gamma-linolenic acid (GLA, omega-6) and alpha-linolenic acid (ALA, omega-3). Optimal 3:1 ratio of omega-6 to omega-3 fatty acids helps regulate inflammation and support barrier function.",
      why: "Tasmanian-grown premium hemp. One of the few plant oils containing both omega-6 and omega-3 in balanced proportions. GLA provides anti-inflammatory support while omega-3 helps regulate sebum production (your skin's natural oil). Lighter texture than most seed oils — absorbs quickly without heaviness. Ideal for outdoor-exposed skin that needs inflammation control without excess oil. Part of our 59% Australian-grown content.",
    },
    {
      name: "Macadamia Oil",
      origin: "Australian-grown, Queensland/Northern NSW",
      function:
        "Contains palmitoleic acid (omega-7, a fatty acid that naturally occurs in younger skin but decreases with age and sun exposure). Lightweight despite being nourishing.",
      why: "Australian native tree at clinically meaningful dose. Provides fatty acids that help maintain skin's lipid barrier (your skin's natural oil layer). Contains omega-7, found in few other plant sources. Addresses age-related lipid depletion accelerated by environmental exposure. Part of our 59% Australian-grown content.",
    },
    {
      name: "Meadowfoam Seed Oil",
      origin: "Oregon, USA (only region where it grows)",
      function:
        "Exceptionally stable plant oil with long-chain fatty acids (meaning it doesn't break down or go rancid easily). Helps protect other oils from degradation. Forms a breathable protective layer on skin.",
      why: "Acts as natural stabilizer, extending product shelf life without synthetic additives. Helps formula remain stable under sun exposure and temperature changes. Critical for protecting the 50% oxidation-prone oils in this formula from Australian sun.",
    },
    {
      name: "Vitamin E",
      origin: "Natural d-alpha tocopherol, plant-derived",
      function:
        "Antioxidant (protects against damage from environmental exposure) that helps protect skin from environmental stressors. Supports skin's natural lipid barrier (your skin's natural oil layer). Helps maintain product stability.",
      why: "Natural form for better skin compatibility. Provides antioxidant protection without common allergen concerns. Works with Rosemary CO2 Extract and Meadowfoam to create a triple-layer antioxidant system for 12-18 month shelf life.",
    },
    {
      name: "Rosemary CO2 Extract",
      origin: "Mediterranean origin, supercritical CO2 extraction",
      function:
        "Contains carnosic acid (a natural antioxidant compound) with natural antioxidant and antimicrobial (keeps bacteria/fungi from growing) properties. Helps prevent product oxidation (going rancid). Maintains freshness without synthetic preservatives.",
      why: "Natural preservation system. Minimal concentration means no detectable scent while effectively maintaining product integrity. At 0.3%, it's functionally active but undetectable — above 0.5% would smell herbal. ECOCERT certified.",
    },
  ];

  const excludedItems = [
    "Synthetic ingredients",
    "Essential oils",
    "Added fragrance",
    "Parabens",
    "Sulfates",
    "Phthalates",
    "Silicones",
    "Mineral oil",
  ];

  const faqs = [
    {
      q: "Why does it have a scent if it's fragrance-free?",
      a: "Natural plant oils have their own aroma (grassy, nutty, earthy). We don't add fragrance or essential oils. The scent you smell is the ingredients themselves — it dissipates within minutes of application.",
    },
    {
      q: "Why Australian ingredients?",
      a: "Australian-grown ingredients (Tasmanian Hemp, Australian Jojoba, Australian Macadamia) make up 59% of the formula. They're sourced locally, built for harsh Australian conditions, and support Australian agriculture.",
    },
    {
      q: "Is this anti-aging?",
      a: "No. This is barrier maintenance for environmental damage. If you've spent 15-30 years outdoors (surfing, cycling, working outside), your skin barrier has been compromised by sun, wind, salt. This addresses that — not chronological aging.",
    },
    {
      q: "How is this different from other face oils?",
      a: "Clinical-dose actives (59% barrier-repair oils vs typical 20-40%), Australian provenance (59% Australian-grown), equipment maintenance approach (not anti-aging or luxury), essential oil-free, built specifically for outdoor-exposed men.",
    },
    {
      q: "Why only 7 ingredients?",
      a: "Each ingredient has a specific function. Rosehip and Hemp for barrier repair and inflammation. Australian Jojoba and Macadamia as carriers. Meadowfoam, Vitamin E, and Rosemary CO2 for stability. No fillers.",
    },
    {
      q: "Can I use this if I have oily skin?",
      a: "Not recommended for very oily or acne-prone skin. This is formulated for normal, dry, or mature skin that's been exposed to outdoor conditions for years. If you're uncertain, start with 2 drops instead of 3-4.",
    },
  ];

  const characteristics = [
    { label: "Appearance", value: "Clear to pale amber oil with golden hue" },
    { label: "Texture", value: "Medium-weight, absorbs in approximately 2 minutes" },
    { label: "Scent", value: "Natural plant oil aroma (grassy, nutty, earthy) — dissipates quickly" },
    { label: "Suitable for", value: "Normal, dry, mature, outdoor-exposed skin" },
  ];

  return (
    <main className="pt-20">
      <Helmet>
        <title>Ingredients — 7 Natural Barrier-Repair Oils | Field Oil by Coastal Endurance</title>
        <meta
          name="description"
          content="Full ingredient breakdown for Field Oil. 7 natural ingredients: Rosehip, Jojoba, Hemp Seed, Macadamia, Meadowfoam, Vitamin E, Rosemary CO2. 59% active barrier-repair oils. 59% Australian-grown. Zero synthetics."
        />
        <link rel="canonical" href="https://coastalendurance.com/ingredients" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          })}
        </script>
      </Helmet>

      {/* Header */}
      <section className="section-padding border-b border-border">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
            What's In It
          </p>
          <h1 className="text-4xl md:text-5xl font-display">Ingredients</h1>
        </div>
      </section>

      {/* Product Overview */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
            100% Natural Ingredients. Zero Synthetic Ingredients. Zero Essential Oils. Zero Fragrance.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed text-[17px]">
            Built for men with significant outdoor exposure — those who've been doing the thing long enough that the environmental damage shows.
          </p>

          {/* Characteristics table */}
          <div className="mt-10 border-t border-border">
            {characteristics.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row py-3 border-b border-border text-sm">
                <span className="text-muted-foreground sm:w-36 flex-shrink-0 uppercase tracking-wider text-xs font-medium">
                  {item.label}
                </span>
                <span className="text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Key stat callout */}
          <p className="mt-10 text-lg font-medium text-foreground">
            59% active barrier-repair oils. 59% Australian-grown. Not anti-aging — equipment maintenance.
          </p>
        </div>
      </section>

      {/* Ingredients List */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-display mb-12">
            Full Ingredient List (7 Ingredients)
          </h2>

          <div className="space-y-0">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="py-10 border-t border-border first:border-t-0 first:pt-0"
              >
                <h3 className="text-xl md:text-2xl font-display">{ingredient.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{ingredient.origin}</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
                      Function
                    </h4>
                    <p className="text-foreground leading-relaxed text-[17px]">
                      {ingredient.function}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
                      Why We Use It
                    </h4>
                    <p className="text-foreground leading-relaxed text-[17px]">
                      {ingredient.why}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage & Shelf Life */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-6">Storage & Shelf Life</h2>
          <div className="border-t border-border">
            {[
              { label: "Shelf life", value: "12-18 months from manufacture date" },
              { label: "Storage", value: "Below 25°C (77°F), away from direct sunlight" },
              { label: "Packaging", value: "Amber glass bottle with dropper provides UV protection" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row py-3 border-b border-border text-sm">
                <span className="text-muted-foreground sm:w-36 flex-shrink-0 uppercase tracking-wider text-xs font-medium">
                  {item.label}
                </span>
                <span className="text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Keep lid tightly closed after each use.</p>
        </div>
      </section>

      {/* Origin */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-3">Origin</h2>
          <p className="text-lg font-medium text-foreground">59% Australian-grown by volume</p>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Tasmanian Hemp, Australian Jojoba, and Australian Macadamia sourced from Australian farms.
          </p>
        </div>
      </section>

      <div className="max-w-[700px] mx-auto px-6">
        <hr className="border-border" />
      </div>

      {/* Built For */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-3">Built For</h2>
          <p className="text-muted-foreground leading-relaxed text-[17px]">
            Men with significant outdoor exposure — surfers with 15+ years in the water, tradies with decades on the tools, cyclists doing serious miles, outdoor workers exposed to the elements.
          </p>
          <p className="mt-4 text-[17px] font-medium text-foreground">
            Not anti-aging. Barrier maintenance for cumulative environmental damage from prolonged outdoor conditions.
          </p>
        </div>
      </section>

      {/* INCI List */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-4">Full INCI List</h2>
          <p className="text-[17px] text-muted-foreground leading-relaxed">
            Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Cannabis Sativa Seed Oil, Macadamia Ternifolia Seed Oil, Limnanthes Alba Seed Oil, Tocopherol, Rosmarinus Officinalis Leaf Extract
          </p>
          <p className="mt-4 text-[17px] font-medium text-foreground">
            Contains: Tree nut derivatives (Macadamia)
          </p>
        </div>
      </section>

      {/* What It Doesn't Contain */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-6">What It Doesn't Contain</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {excludedItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-[17px] py-1">
                <span className="text-muted-foreground">❌</span>
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-display mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-[17px] font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed text-[17px]">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This product is a cosmetic, not a therapeutic good. It is designed to support barrier function and help maintain skin's natural moisture barrier. It is not intended to diagnose, treat, cure, or prevent any disease. Australian Certified Organic ingredients where specified. For external use only.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8 border-t border-border">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-[17px] text-muted-foreground">
            Questions?{" "}
            <a
              href="mailto:hello@coastalendurance.com"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              hello@coastalendurance.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Ingredients;
