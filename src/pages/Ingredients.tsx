const Ingredients = () => {
  const ingredients = [
    {
      name: "Jojoba Oil",
      origin: "Desert shrub, commonly sourced from Australia and USA",
      function: "Mimics the structure of human sebum. Absorbs quickly without leaving residue. Provides deep hydration while allowing skin to breathe.",
      why: "The closest thing nature offers to your skin's own oils. Non-comedogenic, stable, and effective.",
    },
    {
      name: "Australian Macadamia Oil",
      origin: "Native Australian nut tree",
      function: "High in palmitoleic acid — a fatty acid that decreases naturally as we age. Restores suppleness and barrier function.",
      why: "Replenishes what time and environment take away. Fast-absorbing and deeply nourishing.",
    },
    {
      name: "Meadowfoam Seed Oil",
      origin: "Pacific Northwest wildflower",
      function: "Forms a protective barrier that locks in moisture. Prevents transepidermal water loss (TEWL) without feeling heavy.",
      why: "Long-lasting protection for skin under constant environmental stress.",
    },
    {
      name: "Rosehip Oil",
      origin: "Wild rose seeds, typically Rosa canina",
      function: "Rich in vitamin A (retinoids) and essential fatty acids. Supports cell turnover and skin texture.",
      why: "Proven regenerative properties. Helps with sun damage, scarring, and uneven skin tone.",
    },
    {
      name: "Squalane",
      origin: "Plant-derived (olive or sugarcane)",
      function: "Lightweight lipid identical to one found naturally in human skin. Reinforces the moisture barrier.",
      why: "Exceptional compatibility with human skin. Non-greasy, stable, and effective at any age.",
    },
    {
      name: "Vitamin E (Tocopherol)",
      origin: "Derived from vegetable oils",
      function: "Potent antioxidant that neutralizes free radicals. Stabilizes other active ingredients in the formula.",
      why: "Protects both your skin and the product. Essential for any formula exposed to light and air.",
    },
    {
      name: "Kakadu Plum Extract",
      origin: "Native to Northern Australia",
      function: "Contains the world's highest known natural concentration of vitamin C. Brightens, evens skin tone, and supports collagen.",
      why: "Australian native with proven efficacy. Sourced sustainably from Indigenous communities.",
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
            Ingredients
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
          <div className="space-y-12">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 border-b border-border last:border-0"
              >
                <div className="lg:col-span-3">
                  <h2 className="text-2xl font-display">{ingredient.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{ingredient.origin}</p>
                </div>
                <div className="lg:col-span-5">
                  <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Function
                  </h3>
                  <p className="text-foreground leading-relaxed">{ingredient.function}</p>
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                    Why We Use It
                  </h3>
                  <p className="text-foreground leading-relaxed">{ingredient.why}</p>
                </div>
              </div>
            ))}
          </div>
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
            Simmondsia Chinensis (Jojoba) Seed Oil, Macadamia Integrifolia Seed Oil, 
            Limnanthes Alba (Meadowfoam) Seed Oil, Rosa Canina (Rosehip) Seed Oil, 
            Squalane, Tocopherol (Vitamin E), Terminalia Ferdinandiana (Kakadu Plum) Fruit Extract.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Ingredients;