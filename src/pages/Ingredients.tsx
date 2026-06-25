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
      name: "ROSEHIP OIL",
      origin: "Chilean/European origin, cold-pressed from seeds",
      function:
        "Essential fatty acids (the building blocks your skin uses to maintain itself) support barrier function. Contains vitamin A precursors. Used extensively in formulations for environmentally exposed skin.",
      why: "Primary active ingredient at clinical dose. High concentration of barrier-supporting lipids (your skin's natural oils that hold its protective layer together). Addresses cumulative environmental damage from prolonged outdoor exposure.",
    },
    {
      name: "JOJOBA OIL",
      origin: "Australian-grown, Western Australia/South Australia/NSW",
      function:
        "Structurally similar to human sebum (your skin's natural oil). Helps regulate skin's natural oil balance. Lightweight, non-comedogenic (won't clog pores) wax ester.",
      why: "Australian-sourced at clinical dose. Closely mimics skin's natural oil. Ideal for outdoor workers and athletes who sweat — helps maintain balanced skin without heaviness. One of our Australian-grown oils.",
    },
    {
      name: "HEMP SEED OIL",
      origin: "Tasmanian-grown, cold-pressed, THC-free",
      function:
        "Balanced anti-inflammatory oil containing both gamma-linolenic acid (GLA, omega-6) and alpha-linolenic acid (ALA, omega-3). Optimal 3:1 ratio of omega-6 to omega-3 fatty acids helps regulate inflammation and support barrier function.",
      why: "Tasmanian-grown premium hemp. One of the few plant oils containing both omega-6 and omega-3 in balanced proportions. GLA provides anti-inflammatory support while omega-3 helps regulate sebum production (your skin's natural oil). Lighter texture than most seed oils — absorbs quickly without heaviness. Ideal for outdoor-exposed skin that needs inflammation control without excess oil. One of our Australian-grown oils.",
    },
    {
      name: "MACADAMIA OIL",
      origin: "Australian-grown, Queensland/Northern NSW",
      function:
        "Contains palmitoleic acid (omega-7, a fatty acid that naturally occurs in younger skin but decreases with age and sun exposure). Lightweight despite being nourishing.",
      why: "Australian native tree at clinically meaningful dose. Provides fatty acids that help maintain skin's lipid barrier (your skin's natural oil layer). Contains omega-7, found in few other plant sources. Addresses age-related lipid depletion accelerated by environmental exposure. One of our Australian-grown oils.",
    },
    {
      name: "MEADOWFOAM SEED OIL",
      origin: "Oregon, USA (only region where it grows)",
      function:
        "Exceptionally stable plant oil with long-chain fatty acids (meaning it doesn't break down or go rancid easily). Helps protect other oils from degradation. Forms a breathable protective layer on skin.",
      why: "Acts as natural stabilizer, extending product shelf life without synthetic additives. Helps formula remain stable under sun exposure and temperature changes. Critical for protecting the oxidation-prone oils in this formula from Australian sun.",
    },
    {
      name: "VITAMIN E",
      origin: "Natural d-alpha tocopherol, plant-derived",
      function:
        "Antioxidant (protects against damage from environmental exposure) that helps protect skin from environmental stressors. Supports skin's natural lipid barrier (your skin's natural oil layer). Helps maintain product stability.",
      why: "Natural form for better skin compatibility. Provides antioxidant protection without common allergen concerns. Works with Rosemary CO2 Extract and Meadowfoam to create a triple-layer antioxidant system for 12-18 month shelf life.",
    },
    {
      name: "ROSEMARY CO2 EXTRACT",
      origin: "Mediterranean origin, supercritical CO2 extraction",
      function:
        "Contains carnosic acid (a natural antioxidant compound) with natural antioxidant and antimicrobial (keeps bacteria/fungi from growing) properties. Helps prevent product oxidation (going rancid). Maintains freshness without synthetic preservatives.",
      why: "Natural preservation system. Minimal concentration means no detectable scent while effectively maintaining product integrity. Functionally active but undetectable. ECOCERT certified.",
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
      a: "Three of the seven oils are Australian-grown: Tasmanian Hemp, Australian Jojoba, Australian Macadamia. They're sourced locally, built for harsh Australian conditions, and support Australian agriculture.",
    },
    {
      q: "Is this anti-aging?",
      a: "No. This is barrier maintenance for environmental damage. If you regularly spend time outdoors (surfing, cycling, working outside), sun, wind and salt wear on your skin barrier. This addresses that — not chronological aging.",
    },
    {
      q: "How is this different from other face oils?",
      a: "Active oils at clinical dose (Rosehip and Hemp lead the formula), Australian-grown carriers (Jojoba and Macadamia), a natural antioxidant system instead of synthetic preservatives, an equipment-maintenance approach (not anti-aging or luxury), and essential-oil-free.",
    },
    {
      q: "Why only 7 ingredients?",
      a: "Each ingredient has a specific function. Rosehip and Hemp for barrier repair and inflammation. Australian Jojoba and Macadamia as carriers. Meadowfoam, Vitamin E, and Rosemary CO2 for stability. No fillers.",
    },
    {
      q: "Can I use this if I have oily skin?",
      a: "Not recommended for very oily or acne-prone skin. This is formulated for normal, dry, or mature skin that's been exposed to outdoor conditions for years. If you're uncertain, start with a little less than ≈0.4ml.",
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
        <title>Field Oil Ingredients — 7 Natural Barrier-Repair Oils</title>
        <meta
          name="description"
          content="Field Oil's 7 natural ingredients: Rosehip, Jojoba, Hemp Seed, Macadamia, Meadowfoam, Vitamin E, Rosemary CO2. Australian-grown Hemp, Jojoba and Macadamia."
        />
        <link rel="canonical" href="https://coastalendurance.com/ingredients" />
        <meta property="og:title" content="Field Oil Ingredients — 7 Natural Barrier-Repair Oils" />
        <meta property="og:description" content="Full ingredient breakdown: Rosehip, Jojoba, Hemp Seed, Macadamia, Meadowfoam, Vitamin E, Rosemary CO2. Australian-grown Hemp, Jojoba and Macadamia." />
        <meta property="og:url" content="https://coastalendurance.com/ingredients" />
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
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
            WHAT'S IN IT
          </p>
          <h1 className="text-4xl md:text-5xl font-typewriter uppercase">INGREDIENTS</h1>
        </div>
      </section>

      {/* Product Overview */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-lg md:text-xl font-body font-medium text-foreground leading-relaxed">
            100% Natural Ingredients. Zero Synthetic Ingredients. Zero Essential Oils. Zero Fragrance.
          </p>
          <p className="mt-4 font-body text-muted-foreground leading-relaxed text-[17px]">
            Built for men with significant outdoor exposure — those who've been doing the thing long enough that the environmental damage shows.
          </p>

          {/* Characteristics table */}
          <div className="mt-10 border-t border-border">
            {characteristics.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row py-3 border-b border-border text-sm">
                <span className="font-typewriter text-muted-foreground sm:w-36 flex-shrink-0 uppercase tracking-wider text-xs">
                  {item.label}
                </span>
                <span className="font-body text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Key stat callout */}
          <p className="mt-10 text-lg font-body font-medium text-foreground">
            Active barrier-repair oils, Australian-grown carriers. Not anti-aging — equipment maintenance.
          </p>
        </div>
      </section>

      {/* Ingredients List */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-typewriter uppercase mb-12">
            FULL INGREDIENT LIST (7 INGREDIENTS)
          </h2>

          <div className="space-y-0">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="py-10 border-t border-border first:border-t-0 first:pt-0"
              >
                <h3 className="text-xl md:text-2xl font-typewriter uppercase">{ingredient.name}</h3>
                <p className="mt-1 text-sm font-body text-muted-foreground">{ingredient.origin}</p>

                <div className="mt-6 space-y-5">
                  <div>
                    <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      FUNCTION
                    </h4>
                    <p className="font-body text-foreground leading-relaxed text-[17px]">
                      {ingredient.function}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      WHY WE USE IT
                    </h4>
                    <p className="font-body text-foreground leading-relaxed text-[17px]">
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
          <h2 className="text-xl font-typewriter uppercase mb-6">STORAGE & SHELF LIFE</h2>
          <div className="border-t border-border">
            {[
              { label: "Shelf life", value: "12-18 months from manufacture date" },
              { label: "Storage", value: "Below 25°C (77°F), away from direct sunlight" },
              { label: "Packaging", value: "Amber glass bottle with dropper provides UV protection" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row py-3 border-b border-border text-sm">
                <span className="font-typewriter text-muted-foreground sm:w-36 flex-shrink-0 uppercase tracking-wider text-xs">
                  {item.label}
                </span>
                <span className="font-body text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-body text-muted-foreground">Keep lid tightly closed after each use.</p>
        </div>
      </section>

      {/* Origin */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-3">ORIGIN</h2>
          <p className="text-lg font-body font-medium text-foreground">Australian-grown oils</p>
          <p className="mt-2 text-[17px] font-body text-muted-foreground">
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
          <h2 className="text-xl font-typewriter uppercase mb-3">BUILT FOR</h2>
          <p className="font-body text-muted-foreground leading-relaxed text-[17px]">
            Men with significant outdoor exposure — surfers, tradies, cyclists, and outdoor workers exposed to the elements.
          </p>
          <p className="mt-4 text-[17px] font-body font-medium text-foreground">
            Not anti-aging. Barrier maintenance for cumulative environmental damage from prolonged outdoor conditions.
          </p>
        </div>
      </section>

      {/* INCI List */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-4">FULL INCI LIST</h2>
          <p className="text-[17px] font-body text-muted-foreground leading-relaxed">
            Rosa Canina Fruit Oil (Rosehip), Simmondsia Chinensis Seed Oil (Jojoba), Cannabis Sativa Seed Oil (Hemp Seed), Macadamia Ternifolia Seed Oil (Macadamia), Limnanthes Alba Seed Oil (Meadowfoam), Tocopherol (Vitamin E), Rosmarinus Officinalis Leaf Extract (Rosemary)
          </p>
          <p className="mt-4 text-[17px] font-body font-medium text-foreground">
            Contains: Tree nut derivatives (Macadamia)
          </p>
        </div>
      </section>

      {/* What It Doesn't Contain */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-6">WHAT IT DOESN'T CONTAIN</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {excludedItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-[17px] font-body py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-6">FREQUENTLY ASKED QUESTIONS</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-[17px] font-body font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="font-body text-muted-foreground leading-relaxed text-[17px]">
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
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            This product is a cosmetic, not a therapeutic good. It is designed to support barrier function and help maintain skin's natural moisture barrier. It is not intended to diagnose, treat, cure, or prevent any disease. Australian Certified Organic ingredients where specified. For external use only.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8 border-t border-border">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-[17px] font-body text-muted-foreground">
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
