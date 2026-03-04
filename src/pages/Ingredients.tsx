import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      why: "Australian-sourced. Closely mimics skin's natural oil. Ideal for outdoor workers and athletes who sweat — helps maintain balanced skin without heaviness. One-third of our Australian-grown content.",
    },
    {
      name: "Evening Primrose Oil",
      origin: "North American/European origin, refined cold-pressed",
      function:
        "Contains gamma-linolenic acid (GLA, a beneficial omega-6 fatty acid your body can't make on its own). High in linoleic acid. Supports skin's natural barrier function and helps soothe visible redness.",
      why: "GLA is uncommon in plant oils and helps address skin exposed to wind, sun, and environmental stress. Refined (filtered for stability) while maintaining effectiveness. Specifically targets inflammation from years of outdoor exposure.",
    },
    {
      name: "Squalane",
      origin: "Olive-derived, European origin",
      function:
        "Bioidentical to a component naturally found in human sebum (your skin's natural oil). Lightweight, fast-absorbing. Helps restore skin's natural moisture barrier (the protective layer that keeps water in and irritants out).",
      why: "Matches what your skin already produces. Fastest-absorbing carrier in the formula. Helps deliver other ingredients effectively. Critical for men who need quick absorption (90-120 seconds) without greasy residue.",
    },
    {
      name: "Macadamia Oil",
      origin: "Australian-grown, Queensland/Northern NSW",
      function:
        "Contains palmitoleic acid (omega-7, a fatty acid that naturally occurs in younger skin but decreases with age and sun exposure). Lightweight despite being nourishing.",
      why: "Australian native tree. Provides fatty acids that help maintain skin's lipid barrier (your skin's natural oil layer). Contains omega-7, found in few other plant sources. Addresses age-related lipid depletion accelerated by environmental exposure.",
    },
    {
      name: "Meadowfoam Seed Oil",
      origin: "Oregon, USA (only region where it grows)",
      function:
        "Exceptionally stable plant oil with long-chain fatty acids (meaning it doesn't break down or go rancid easily). Helps protect other oils from degradation. Forms a breathable protective layer on skin.",
      why: "Acts as natural stabilizer, extending product shelf life without synthetic additives. Helps formula remain stable under sun exposure and temperature changes. Critical for protecting the 50% oxidation-prone oils in this formula from Australian sun.",
    },
    {
      name: "Australian Sandalwood Seed Oil",
      origin: "Australian native, Western Australia",
      function:
        "Contains beneficial fatty acids and phenolic compounds (plant antioxidants) with anti-inflammatory properties. Helps reduce the appearance of redness. Related to Desert Quandong (same botanical family, Santalum).",
      why: "Australian native ingredient. Provides anti-inflammatory support for skin exposed to harsh environmental conditions over decades. Sustainably grown in Western Australian plantations. Part of our 34% Australian-grown content.",
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
    "Gluten (wheat germ removed from formula)",
  ];

  const faqs = [
    {
      q: "Why does it have a scent if it's fragrance-free?",
      a: 'All plant oils have natural aromas. "Fragrance-free" means we don\'t add synthetic or natural fragrance compounds. The grassy, nutty, earthy scent you smell is from the plant oils themselves and dissipates within minutes.',
    },
    {
      q: "Is this suitable for sensitive skin?",
      a: "Field Oil is formulated with 100% natural ingredients and no common irritants (fragrance, essential oils). However, if you have very sensitive skin, we recommend patch testing first.",
    },
    {
      q: "Will this clog my pores?",
      a: "The formula has a low comedogenic rating (weighted average 1.4 on a 0-5 scale). However, it's not suitable for very oily or acne-prone skin. Best for normal, dry, or mature skin types.",
    },
    {
      q: "Why Australian ingredients?",
      a: "Australian-grown ingredients (Jojoba, Macadamia, Sandalwood) make up 34% of the formula. They're sourced locally, built for harsh Australian conditions, and support Australian agriculture.",
    },
    {
      q: "How long does 30ml last?",
      a: "Approximately 2 months with once-daily use (3-4 drops per application).",
    },
    {
      q: 'What does "clinical-dose actives" mean?',
      a: "We use 59% active barrier-repair oils (Rosehip 35%, Evening Primrose 15%, etc.). Most face oils use 20-40% actives. Clinical dose means we use concentrations shown effective in studies, not just token amounts.",
    },
  ];

  return (
    <main className="pt-20">
      {/* Full Ingredient List (9 Ingredients) */}
      <section className="section-padding">
        <div className="container-wide">
          <h1 className="text-3xl md:text-4xl font-display text-center mb-12">
            Full Ingredient List (9 Ingredients)
          </h1>
          <div className="space-y-12">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 border-b border-border last:border-0"
              >
                <div className="lg:col-span-3">
                  <h3 className="text-2xl font-display">{ingredient.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ingredient.origin}
                  </p>
                </div>
                <div className="lg:col-span-5">
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Function
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {ingredient.function}
                  </p>
                </div>
                <div className="lg:col-span-4">
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Why We Use It
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {ingredient.why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Characteristics */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow">
          <h2 className="text-2xl md:text-3xl font-display text-center mb-8">
            Product Characteristics
          </h2>
          <p className="text-center font-medium text-foreground mb-6">
            100% Natural Ingredients. Zero Synthetic Ingredients. Zero Essential
            Oils. Zero Fragrance.
          </p>
          <p className="text-center text-muted-foreground mb-8">
            Made for a life in the great outdoors.
          </p>
          <div className="max-w-lg mx-auto space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-28 flex-shrink-0">
                Appearance:
              </span>
              <span className="text-muted-foreground">
                Clear to pale amber oil with golden hue
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-28 flex-shrink-0">
                Texture:
              </span>
              <span className="text-muted-foreground">
                Medium-weight, absorbs in 90-120 seconds
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-28 flex-shrink-0">
                Scent:
              </span>
              <span className="text-muted-foreground">
                Natural plant oil aroma (grassy, nutty, earthy) — dissipates
                quickly
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-28 flex-shrink-0">
                Suitable For:
              </span>
              <span className="text-muted-foreground">
                Normal, dry, mature, outdoor-exposed skin
              </span>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-foreground mt-8">
            59% active barrier-repair oils. 34% Australian-grown. Not
            anti-aging — equipment maintenance.
          </p>
        </div>
      </section>

      {/* Storage & Shelf Life */}
      <section className="py-12">
        <div className="container-narrow">
          <h2 className="text-2xl md:text-3xl font-display text-center mb-8">
            Storage & Shelf Life
          </h2>
          <div className="max-w-lg mx-auto space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-36 flex-shrink-0">
                Expected shelf life:
              </span>
              <span className="text-muted-foreground">
                12-18 months from manufacture date
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-36 flex-shrink-0">
                Storage:
              </span>
              <span className="text-muted-foreground">
                Below 25°C (77°F), away from direct sunlight
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-foreground w-36 flex-shrink-0">
                Packaging:
              </span>
              <span className="text-muted-foreground">
                Amber glass bottle with dropper provides UV protection
              </span>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-foreground mt-6">
            Keep lid tightly closed after each use
          </p>
        </div>
      </section>

      {/* Origin */}
      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="text-2xl md:text-3xl font-display mb-4">Origin</h2>
          <p className="font-medium text-foreground mb-2">
            One-third Australian-grown by volume
          </p>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Jojoba, Macadamia, and Australian Sandalwood sourced from Australian
            farms and sustainable cultivation.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="container-narrow">
        <hr className="border-border" />
      </div>

      {/* Built For */}
      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="text-2xl md:text-3xl font-display mb-4">Built For</h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Men with significant outdoor exposure — surfers with 15-20 years in
            salt water, tradies with decades on the tools, cyclists doing
            serious miles, outdoor workers exposed to the elements.
          </p>
          <p className="text-sm font-medium text-foreground mt-6">
            Not anti-aging. Barrier maintenance for cumulative environmental
            damage from prolonged outdoor conditions.
          </p>
        </div>
      </section>

      {/* Full INCI List */}
      <section className="py-12 bg-secondary">
        <div className="container-narrow">
          <h2 className="text-2xl font-display text-center mb-6">
            Full INCI List
          </h2>
          <p className="text-center text-muted-foreground text-sm leading-relaxed">
            Rosa Canina Fruit Oil, Simmondsia Chinensis Seed Oil, Oenothera
            Biennis Oil, Squalane, Macadamia Ternifolia Seed Oil, Limnanthes
            Alba Seed Oil, Santalum Spicatum Seed Oil, Tocopherol, Rosmarinus
            Officinalis Leaf Extract
          </p>
          <p className="text-center text-sm font-medium text-foreground mt-4">
            Contains: Tree nut derivatives (Macadamia)
          </p>
        </div>
      </section>

      {/* What It Doesn't Contain */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center mb-8">
            What It Doesn't Contain
          </h2>
          <div className="max-w-md mx-auto space-y-3">
            {excludedItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="text-primary-foreground/50">✕</span>
                <span className="text-primary-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Cosmetic Use Disclaimer */}
      <section className="py-12 bg-secondary">
        <div className="container-narrow text-center">
          <h2 className="text-lg font-display mb-4">Cosmetic Use Only</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Field Oil is a cosmetic product. All claims relate to cosmetic
            benefits (supporting barrier function, maintaining skin's natural
            moisture barrier, providing essential fatty acids). This product does
            not treat, cure, or prevent any medical conditions.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            For external use only. If irritation occurs, discontinue use.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8">
        <div className="container-narrow text-center">
          <p className="text-sm text-muted-foreground">
            Questions?{" "}
            <a
              href="mailto:hello@coastalendurance.co"
              className="underline hover:text-foreground transition-colors"
            >
              hello@coastalendurance.co
            </a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Ingredients;
