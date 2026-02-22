const Ingredients = () => {
  const ingredients = [
    {
      name: "Rosehip Oil",
      origin: "Chilean/European origin, cold-pressed from seeds",
      function: "Essential fatty acids (the building blocks your skin uses to repair itself) support barrier function. Contains vitamin A precursors. Used extensively in formulations for environmentally exposed skin.",
      why: "Primary active ingredient. High concentration of barrier-supporting lipids (your skin's natural oils that hold its protective layer together). Used in cosmetic formulations worldwide for skin exposed to harsh conditions.",
    },
    {
      name: "Jojoba Oil",
      origin: "Australian-grown, Western Australia / South Australia / NSW",
      function: "Structurally similar to human sebum (your skin's natural oil). Helps regulate skin's natural oil balance. Lightweight, non-comedogenic (won't clog pores) wax ester.",
      why: "Australian-sourced. Closely mimics skin's natural oil. Ideal for outdoor workers who sweat — helps maintain balanced skin without heaviness.",
    },
    {
      name: "Evening Primrose Oil",
      origin: "North American/European origin, refined cold-pressed",
      function: "Contains gamma-linolenic acid (GLA, a beneficial omega-6 fatty acid your body can't make on its own). High in linoleic acid. Supports skin's natural barrier function and helps soothe visible redness.",
      why: "GLA is uncommon in plant oils and helps address skin exposed to wind, sun, and environmental stress. Refined (filtered for stability) while maintaining effectiveness.",
    },
    {
      name: "Squalane",
      origin: "Olive-derived, European origin",
      function: "Bioidentical to a component naturally found in human sebum (your skin's natural oil). Lightweight, fast-absorbing. Helps restore skin's natural moisture barrier (the protective layer that keeps water in and irritants out).",
      why: "Matches what your skin already produces. Fastest-absorbing carrier in the formula. Helps deliver other ingredients effectively.",
    },
    {
      name: "Macadamia Oil",
      origin: "Australian-grown, Queensland / Northern NSW",
      function: "Contains palmitoleic acid (omega-7, a fatty acid that naturally occurs in younger skin but decreases with age and sun exposure). Lightweight despite being nourishing.",
      why: "Australian native tree. Provides fatty acids that help maintain skin's lipid barrier (your skin's natural oil layer). Contains omega-7, found in few other plant sources.",
    },
    {
      name: "Meadowfoam Seed Oil",
      origin: "Oregon, USA (only region where it grows)",
      function: "Exceptionally stable plant oil with long-chain fatty acids (meaning it doesn't break down or go rancid easily). Helps protect other oils from degradation. Forms a breathable protective layer on skin.",
      why: "Acts as natural stabiliser, extending product shelf life without synthetic additives. Helps formula remain stable under sun exposure and temperature changes.",
    },
    {
      name: "Quandong Seed Oil",
      origin: "Australian native, Northern Territory / South Australia / Western Australia",
      function: "Contains rutin (a compound that helps strengthen tiny blood vessels near skin's surface), which helps reduce the appearance of redness. Phenolic compounds (plant antioxidants) provide antioxidant properties. Rich in oleic acid and vitamin E.",
      why: "Indigenous Australian ingredient from arid regions. Helps address visible redness and sensitivity from environmental exposure. Wild-harvested or sustainably cultivated.",
    },
    {
      name: "Vitamin E",
      origin: "Natural d-alpha tocopherol, plant-derived",
      function: "Antioxidant (protects against damage from environmental exposure) that helps protect skin from environmental stressors. Supports skin's natural lipid barrier (your skin's natural oil layer). Helps maintain product stability.",
      why: "Natural form for better skin compatibility. Provides antioxidant protection without common allergen concerns.",
    },
    {
      name: "Rosemary CO2 Extract",
      origin: "Mediterranean origin, supercritical CO2 extraction",
      function: "Contains carnosic acid (a natural antioxidant compound) with natural antioxidant and antimicrobial (keeps bacteria/fungi from growing) properties. Helps prevent product oxidation (going rancid). Maintains freshness without synthetic preservatives.",
      why: "Natural preservation system. Minimal concentration means no detectable scent while effectively maintaining product integrity. ECOCERT certified.",
    },
  ];

  const excludedIngredients = [
    {
      name: "Essential Oils",
      reason: "Common irritants and sensitizers. Provide no functional benefit beyond scent.",
    },
    {
      name: "Synthetic Fragrance",
      reason: "Unnecessary additives that can cause irritation and allergic reactions.",
    },
    {
      name: "Parabens",
      reason: "We use naturally stable ingredients that don't require harsh preservatives.",
    },
    {
      name: "Mineral Oil",
      reason: "Creates a barrier that can trap debris. We use oils that absorb and integrate.",
    },
    {
      name: "Fillers",
      reason: "Every ingredient earns its place. Nothing is added for volume or cost reduction.",
    },
  ];

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            9 Ingredients. Zero Compromises.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Every ingredient has a job. No marketing stories. No filler. 
            Just functional compounds chosen for performance.
          </p>
        </div>
      </section>

      {/* Ingredients List */}
      <section className="section-padding">
        <div className="container-wide">
          <h2 className="sr-only">What's In Field Oil</h2>
          <div className="space-y-12">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 border-b border-border last:border-0"
              >
                <div className="lg:col-span-3">
                  <h3 className="text-2xl font-display">{ingredient.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{ingredient.origin}</p>
                </div>
                <div className="lg:col-span-5">
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Function
                  </h4>
                  <p className="text-foreground leading-relaxed">{ingredient.function}</p>
                </div>
                <div className="lg:col-span-4">
                  <h4 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Why We Use It
                  </h4>
                  <p className="text-foreground leading-relaxed">{ingredient.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Australian Sourcing Callout */}
      <section className="py-8 bg-secondary">
        <div className="container-narrow text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            One-third Australian-grown by volume
          </p>
        </div>
      </section>

      {/* What We Leave Out */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            What We Leave Out
          </h2>
          <p className="mt-4 text-center text-primary-foreground/70 max-w-xl mx-auto">
            What's not in a product matters as much as what is.
          </p>
          <div className="mt-12 space-y-6">
            {excludedIngredients.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 pb-6 border-b border-primary-foreground/10 last:border-0"
              >
                <h3 className="font-medium md:w-48 flex-shrink-0">{item.name}</h3>
                <p className="text-primary-foreground/70">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Ingredient List */}
      <section className="section-padding">
        <div className="container-narrow">
          <h2 className="text-2xl font-display text-center mb-8">
            Full INCI List
          </h2>
          <p className="text-center text-muted-foreground text-sm leading-relaxed">
            Squalane, Simmondsia Chinensis (Jojoba) Seed Oil, 
            Oenothera Biennis (Evening Primrose) Oil,
            Rosa Canina (Rosehip) Seed Oil, 
            Macadamia Integrifolia Seed Oil, 
            Limnanthes Alba (Meadowfoam) Seed Oil,
            Santalum Acuminatum (Quandong) Seed Oil,
            Tocopherol (Vitamin E), 
            Rosmarinus Officinalis (Rosemary) Leaf Extract.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Ingredients;
