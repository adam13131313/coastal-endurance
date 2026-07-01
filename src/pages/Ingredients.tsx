import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Helmet } from "react-helmet-async";

const Ingredients = () => {
  // 8-ingredient anhydrous oil blend, listed in INCI order. Descriptions are the
  // approved plain-language ones (no supplier marketing, no therapeutic claims).
  const ingredients = [
    {
      name: "Australian Jojoba",
      inci: "Simmondsia Chinensis Seed Oil",
      note: "Australian-grown",
      description:
        "Golden and Australian-grown; a lightweight wax ester close to skin's own sebum. Absorbs cleanly and forms the stable base of the blend.",
    },
    {
      name: "Tasmanian Hemp Seed Oil",
      inci: "Cannabis Sativa Seed Oil",
      note: "Australian-grown",
      description:
        "Australian-grown hemp seed oil, rich in omega-3 and -6 essential fatty acids; a key barrier-support oil. Seed oil — contains no CBD.",
    },
    {
      name: "Rosehip",
      inci: "Rosa Canina Fruit Oil",
      note: "",
      description: "A source of the essential fatty acids skin uses to maintain its barrier.",
    },
    {
      name: "Australian Macadamia",
      inci: "Macadamia Integrifolia Seed Oil",
      note: "Australian-grown",
      description:
        "Australian-grown; rich, cushioning and stable, high in monounsaturated fatty acids.",
    },
    {
      name: "Meadowfoam",
      inci: "Limnanthes Alba Seed Oil",
      note: "",
      description: "Highly stable; forms a light protective layer that helps the skin hold moisture.",
    },
    {
      name: "Natural Vitamin E",
      inci: "Tocopherol",
      note: "",
      description: "An antioxidant that helps protect the oils and the skin.",
    },
    {
      name: "Sunflower",
      inci: "Helianthus Annuus Seed Oil",
      note: "carrier",
      description: "Natural carrier for the vitamin E and rosemary.",
    },
    {
      name: "Rosemary Antioxidant Extract",
      inci: "Rosmarinus Officinalis Leaf Extract",
      note: "",
      description: "A CO2 extract (not an essential oil) that helps keep the blend fresh.",
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
      a: "Natural plant oils have their own aroma (grassy, nutty, earthy). We don't add fragrance or essential oils. The scent you smell is the ingredients themselves, and it dissipates within minutes of application.",
    },
    {
      q: "Why Australian ingredients?",
      a: "The majority of the blend is Australian-grown: Tasmanian hemp, Australian jojoba, and Australian macadamia. They're sourced locally, suited to harsh Australian conditions, and support Australian agriculture.",
    },
    {
      q: "Is this anti-aging?",
      a: "No. This is barrier maintenance for environmental exposure. If you regularly spend time outdoors (surfing, cycling, working outside), sun, wind and salt wear on your skin's barrier. This is made to support that, not chronological aging.",
    },
    {
      q: "How is this different from other face oils?",
      a: "Active oils (Rosehip and Hemp lead the blend), Australian-grown carriers (jojoba and macadamia), a natural antioxidant system instead of synthetic preservatives, an equipment-maintenance approach (not anti-aging or luxury), and essential-oil-free.",
    },
    {
      q: "Why so few ingredients?",
      a: "Every ingredient has a job. Rosehip and hemp are the active barrier-support oils; Australian jojoba and macadamia are the carriers; meadowfoam, vitamin E, sunflower and rosemary keep the blend stable. No fillers.",
    },
    {
      q: "Can I use this if I have oily skin?",
      a: "Not recommended for very oily or acne-prone skin. This is made for normal, dry, or mature skin that's been exposed to outdoor conditions for years. If you're uncertain, start with 2–3 drops.",
    },
  ];

  const characteristics = [
    { label: "Appearance", value: "Clear to pale amber oil with a golden hue" },
    { label: "Texture", value: "Medium-weight, absorbs in approximately 2 minutes" },
    { label: "Scent", value: "Natural plant-oil aroma (grassy, nutty, earthy), dissipates quickly" },
    { label: "Suitable for", value: "Normal, dry, mature, outdoor-exposed skin" },
  ];

  return (
    <main className="pt-20">
      <Helmet>
        <title>Field Oil Ingredients: Naturally Derived Barrier-Support Oils</title>
        <meta
          name="description"
          content="Field Oil's naturally derived ingredients: Australian jojoba, Tasmanian hemp, rosehip, Australian macadamia, meadowfoam, vitamin E, sunflower, rosemary. Majority Australian-grown, made in Australia."
        />
        <link rel="canonical" href="https://coastalendurance.com/ingredients" />
        <meta property="og:title" content="Field Oil Ingredients: Naturally Derived Barrier-Support Oils" />
        <meta property="og:description" content="Full ingredient breakdown: Australian jojoba, Tasmanian hemp, rosehip, Australian macadamia, meadowfoam, vitamin E, sunflower, rosemary." />
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
            100% naturally derived. No synthetics. Zero essential oils. No added fragrance.
          </p>
          <p className="mt-4 font-body text-muted-foreground leading-relaxed text-[17px]">
            Built for men with significant outdoor exposure, those who've been doing the thing long enough that the environmental wear shows.
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
            Active barrier-support oils, Australian-grown carriers. Not anti-aging, equipment maintenance.
          </p>
        </div>
      </section>

      {/* Ingredients List */}
      <section className="pb-20 md:pb-32">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-typewriter uppercase mb-12">
            FULL INGREDIENT LIST
          </h2>

          <div className="space-y-0">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="py-10 border-t border-border first:border-t-0 first:pt-0"
              >
                <h3 className="text-xl md:text-2xl font-typewriter uppercase">{ingredient.name}</h3>
                <p className="mt-1 text-sm font-body text-muted-foreground">
                  {ingredient.inci}{ingredient.note ? ` · ${ingredient.note}` : ""}
                </p>
                <p className="mt-5 font-body text-foreground leading-relaxed text-[17px]">
                  {ingredient.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage & Shelf Life */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-6">STORAGE</h2>
          <div className="border-t border-border">
            {[
              { label: "After opening", value: "Use within 6 months of opening" },
              { label: "Storage", value: "Below 25°C (77°F), away from direct sunlight" },
              { label: "Packaging", value: "Amber glass bottle with dropper. The glass blocks UV; the dropper gives precise, mess-free application and the same dose every time." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row py-3 border-b border-border text-sm">
                <span className="font-typewriter text-muted-foreground sm:w-36 flex-shrink-0 uppercase tracking-wider text-xs">
                  {item.label}
                </span>
                <span className="font-body text-foreground mt-1 sm:mt-0">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-body text-muted-foreground">Keep the lid tightly closed after each use.</p>
        </div>
      </section>

      {/* Origin */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-3">AUSTRALIAN-GROWN &amp; MADE IN AUSTRALIA</h2>
          <p className="text-lg font-body font-medium text-foreground">The majority of the blend is Australian-grown.</p>
          <p className="mt-2 text-[17px] font-body text-muted-foreground">
            Tasmanian hemp, Australian jojoba, and Australian macadamia, sourced from Australian farms. Blended and bottled in Australia.
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
            Men with significant outdoor exposure, surfers, tradies, cyclists, and outdoor workers exposed to the elements.
          </p>
          <p className="mt-4 text-[17px] font-body font-medium text-foreground">
            Not anti-aging. Barrier maintenance for cumulative environmental exposure from prolonged outdoor conditions.
          </p>
        </div>
      </section>

      {/* INCI List */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-typewriter uppercase mb-4">FULL INCI LIST</h2>
          <p className="text-[17px] font-body text-muted-foreground leading-relaxed">
            Simmondsia Chinensis Seed Oil, Cannabis Sativa Seed Oil, Rosa Canina Fruit Oil, Macadamia Integrifolia Seed Oil, Limnanthes Alba Seed Oil, Tocopherol, Helianthus Annuus Seed Oil, Rosmarinus Officinalis Leaf Extract.
          </p>
          <p className="mt-4 text-[17px] font-body font-medium text-foreground">
            Contains tree nut derivatives (Macadamia).
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
            This product is a cosmetic, not a therapeutic good. It is made to support the skin's barrier and help maintain the skin's natural moisture barrier. It is not intended to diagnose, treat, cure, or prevent any disease. For external use only.
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
