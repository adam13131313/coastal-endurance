const Ingredients = () => {
  const ingredients = [
    {
      name: "Squalane",
      origin: "Olive-derived, European origin",
      function: "Bioidentical to human sebum (your skin's natural oil). Non-greasy, absorbs rapidly. Reef-safe. Restores barrier lipids (the fats that hold your skin's protective layer together).",
      why: "Identical to oil your skin already produces. Fastest-absorbing base in the formula. Works as the delivery vehicle for everything else.",
    },
    {
      name: "Jojoba Oil",
      origin: "Desert shrub, Australian-grown (SA/WA)",
      function: "Structurally similar to human sebum (your skin's natural oil). Non-comedogenic (won't clog pores). Regulates sebum production.",
      why: "The closest thing nature offers to your skin's own oils. Tells skin it doesn't need to overproduce oil. Exceptionally stable.",
    },
    {
      name: "Meadowfoam Seed Oil",
      origin: "Oregon Willamette Valley, USA (only place it grows)",
      function: "Exceptionally UV-stable. Creates moisture-lock layer. Functions as protective sealant against environmental exposure.",
      why: "Insanely stable in heat and UV. Protects other oils from degrading. Locks in the actives. Grows nowhere else on earth.",
    },
    {
      name: "Rosehip Oil",
      origin: "Cold-pressed, Chilean/European origin",
      function: "High in essential fatty acids (fats your body needs but can't make on its own). Supports skin exposed to sun and environmental stress.",
      why: "Highest essential fatty acid content. Natural vitamin A precursors (compounds your body converts into vitamin A). Your hardest-working repair oil.",
    },
    {
      name: "Macadamia Oil",
      origin: "Queensland-grown, Australian native",
      function: "Lightweight. High in palmitoleic acid (a fatty acid rare in plants, abundant in young human skin, that depletes with age).",
      why: "Australian native. Palmitoleic acid content directly addresses age-related skin lipid (fat) loss. Lightweight texture.",
    },
    {
      name: "Kakadu Plum Extract (oil-soluble)",
      origin: "Northern Territory/WA, Australian native, Indigenous-harvested",
      function: "Most potent Vitamin C source on earth. High in antioxidants (compounds that neutralize cell-damaging molecules from UV and pollution).",
      why: "100x more Vitamin C than oranges. Neutralizes free radicals (unstable molecules that damage skin cells) from UV exposure. Australian native hero ingredient.",
    },
    {
      name: "Bisabolol",
      origin: "Chamomile-derived, European/Brazilian origin",
      function: "Helps soothe skin and reduce the appearance of redness from wind and sun exposure. Enhances penetration (absorption) of other actives.",
      why: "Decades of research. Calms irritated skin. Amplifies the whole formula by improving absorption.",
    },
    {
      name: "Vitamin E (d-alpha tocopherol)",
      origin: "Natural, non-GMO, international supply",
      function: "Antioxidant (protects cells from environmental damage). Extends product stability and supports skin's natural defenses against environmental stress.",
      why: "Protects the formula from oxidation (breakdown caused by exposure to air). Protects your skin from UV damage. Non-negotiable for shelf life.",
    },
    {
      name: "Rosemary CO2 Extract",
      origin: "European origin",
      function: "Natural preservative. Prevents oil oxidation (breakdown from air exposure). Extends shelf life without synthetic preservatives.",
      why: "Works with Vitamin E to keep oils fresh. No synthetic preservatives needed. Formula stability insurance.",
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
            Squalane, Simmondsia Chinensis (Jojoba) Seed Oil, 
            Limnanthes Alba (Meadowfoam) Seed Oil, Rosa Canina (Rosehip) Seed Oil, 
            Macadamia Integrifolia Seed Oil, Terminalia Ferdinandiana (Kakadu Plum) Fruit Extract, 
            Bisabolol, Tocopherol (Vitamin E), Rosmarinus Officinalis (Rosemary) Leaf Extract.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Ingredients;