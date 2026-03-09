import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet-async";
import sweepingPlains from "@/assets/sweeping-plains.jpg";
import ruggedCoast from "@/assets/rugged-coast.jpg";
import droughtAndRain from "@/assets/drought-and-rain.jpg";
import coastalImage from "@/assets/coastal-landscape.jpg";

const About = () => {
  return (
    <main id="top" className="pt-20">
      <Helmet>
        <title>Built Different — Field Oil by Coastal Endurance</title>
        <meta name="description" content="Field Oil is barrier maintenance for men serious about outdoor activity. 59% active barrier-repair oils. 59% Australian-grown. Seven ingredients, each with a purpose." />
        <link rel="canonical" href="https://coastalendurance.com/about" />
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={sweepingPlains}
            alt="Vast Australian outback"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30" />
        </div>
        <div className="container-narrow relative z-10 py-24 md:py-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            Built Different.
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl">
            Equipment maintenance for outdoor-exposed skin.
          </p>
        </div>
      </section>

      {/* Opening */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Field Oil is a barrier maintenance face oil for men who are serious about outdoor activity. 
              We position it as equipment maintenance — not anti-aging, not grooming, not luxury ritual.
            </p>
            <p>
              If you're spending serious time outdoors — surfing regularly, riding centuries, working in the sun — your 
              skin needs maintenance. Not when it's visibly damaged. Now. While you're still doing the thing.
            </p>
            <p className="text-foreground text-lg font-medium">
              59% barrier-repair oils. 59% Australian-grown. Seven ingredients, each with a purpose.
            </p>
          </div>
        </div>
      </section>

      {/* Why Field Oil Exists */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={droughtAndRain}
            alt="Cracked earth under approaching storm clouds"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display">Why Field Oil Exists</h2>

          <div className="mt-10">
            <h3 className="text-xl font-display">The Problem</h3>
            <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
              <p>Traditional skincare doesn't address active outdoor people.</p>
              <p>
                Most face oils target chronological aging ("look younger") or position themselves as luxury 
                rituals (10-step routines, aromatherapy, self-care). Neither works for men who are putting in 
                serious hours outdoors.
              </p>
              <p>
                If you're surfing daily, riding 12+ hours a week, or working outside year-round, your skin is 
                constantly exposed to sun, wind, and salt. You need maintenance to keep going — not repair after 
                things break down.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-display">The Solution</h3>
            <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
              <p>Field Oil positions barrier maintenance as equipment maintenance.</p>
              <p>
                Your wetsuit gets rinsed. Your bike gets serviced. Your skin needs the same approach — maintenance 
                while you're actively doing the thing, not repair after the fact.
              </p>
              <p>
                Clinical-dose actives (59% barrier-repair oils vs typical 20–40%). Australian ingredients built 
                for Australian conditions (59% Australian-grown: Tasmanian Hemp, Australian Jojoba, Australian 
                Macadamia). Function over ritual. 60 seconds, once daily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes It Different */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What Makes It Different</h2>

          <div className="mt-12 space-y-10">
            <div>
              <h3 className="text-xl font-display">1. Positioning: Equipment Maintenance</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                We frame skincare as functional maintenance, not beauty ritual. Your wetsuit gets rinsed. 
                Your bike gets serviced. Your skin needs the same approach — regular upkeep for gear that's 
                constantly exposed to harsh conditions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">2. Target: Active Outdoor People</h3>
              <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
                <p>
                  Built for men who are serious about their outdoor activity. Not for guys who used to surf 
                  or used to ride. For guys who are actively doing it — daily sessions, training rides, years 
                  on the tools — and want to keep doing it for decades more.
                </p>
                <p>
                  You don't need to wait until you see damage. If you're doing it seriously (10+ hours/week 
                  outdoors, year-round), maintenance matters now.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-display">3. Formula: Clinical-Dose Actives</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                59% active barrier-repair oils (Rosehip 35%, Hemp Seed 15%, Macadamia 9%). Most face oils 
                use 20–40% actives diluted with cheap carriers. We use clinical doses — concentrations shown 
                in research to support barrier function.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">4. Provenance: 59% Australian-Grown</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                Tasmanian Hemp Seed Oil. Australian Jojoba. Australian Macadamia. Sourced from Australian 
                farms, built for harsh Australian conditions. Not imported ingredients with "Australian brand" 
                marketing — actual Australian-grown ingredients at meaningful percentages.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">5. Approach: Function Over Form</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                Zero fragrance. Zero essential oils. 100% natural ingredients. No aromatherapy. No luxury 
                ritual. No 10-step routine. Apply 3–4 drops to damp skin once daily. Absorbs in 2 minutes. Done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={ruggedCoast}
            alt="Rugged Australian coastline"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display">Who It's For</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p className="text-foreground font-medium">Men who are serious about their outdoor activity:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Surfers paddling out regularly (not weekend warriors)</li>
              <li>Cyclists putting in serious miles (training rides, gran fondos, Masters racing)</li>
              <li>Outdoor workers who are out there daily (tradies, builders, farmers)</li>
              <li>Anyone spending 10+ hours a week outdoors, year-round</li>
            </ul>
            <p>
              <strong className="text-foreground">Defining characteristic:</strong> Activity level and outdoor 
              exposure, not age.
            </p>
            <p>
              The 35-year-old who's surfed daily since university needs this more than the 55-year-old who 
              works indoors. Cumulative exposure matters — this addresses that.
            </p>
            <p className="text-foreground font-medium">
              You don't need to wait for visible damage. If you're doing it seriously, maintenance keeps you going.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Active Outdoor People */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Not Retirement. Performance.</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              The 40-year-old still racing Masters. The 38-year-old surfing daily. The 42-year-old tradie 
              who's been at it for 15 years and plans to keep going for 30 more.
            </p>
            <p>
              You're not slowing down. You're maintaining your gear so you can keep doing the thing.
            </p>
            <p className="text-foreground font-medium">
              Field Oil is for people who are actively doing it — not people who used to. 
              Maintenance during the game, not repair after.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* When to Start */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">When to Start</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p className="text-foreground font-medium">Don't wait for visible damage.</p>
            <p>
              If you're putting in serious outdoor hours (10+ hours/week, year-round), maintenance matters 
              from day one.
            </p>
            <p>
              But realistically, most guys don't think about barrier maintenance until they've been doing it 
              for 10–15 years. By then, you've probably noticed your skin feels different than it used to — 
              tighter after sessions, rougher texture, slower recovery.
            </p>
            <p>
              That's not "old age." That's cumulative exposure. And it's the perfect time to start maintenance.
            </p>
            <div className="mt-6 space-y-3 text-[17px]">
              <p><strong className="text-foreground">Early:</strong> Started at 10 years of outdoor activity → still going strong at 40</p>
              <p><strong className="text-foreground">Smart:</strong> Started at 15–20 years → keeping things in check</p>
              <p><strong className="text-foreground">Never too late:</strong> Started after 25+ years → maintenance still matters</p>
            </div>
            <p className="text-foreground font-medium mt-6">
              The point: If you're actively doing the thing and want to keep doing it, maintenance keeps you going.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* What It Is (And Isn't) */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What It Is (And Isn't)</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-display text-foreground mb-4">Field Oil IS:</h3>
              <ul className="space-y-3 text-muted-foreground text-[17px] leading-relaxed">
                <li>Barrier maintenance for active outdoor people</li>
                <li>Equipment maintenance (functional approach)</li>
                <li>Clinical-dose actives (59% barrier-repair oils)</li>
                <li>Australian-made with Australian-grown ingredients (59%)</li>
                <li>Function-first, no-bullshit formulation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-display text-foreground mb-4">Field Oil IS NOT:</h3>
              <ul className="space-y-3 text-muted-foreground text-[17px] leading-relaxed">
                <li>Anti-aging (not targeting chronological aging)</li>
                <li>Luxury ritual (not aromatherapy or spa experience)</li>
                <li>General grooming (not for guys who work indoors)</li>
                <li>For weekend warriors (built for serious outdoor people)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Formula */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={coastalImage}
            alt="Australian coastline"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display">The Formula</h2>
          <p className="mt-4 text-foreground font-medium text-[17px]">Seven ingredients. Each with a purpose.</p>

          <div className="mt-10 space-y-8">
            <div>
              <h3 className="text-lg font-display text-foreground">The Actives (50%)</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground text-[17px] leading-relaxed">
                <li><strong className="text-foreground">Rosehip Oil 35%</strong> — Barrier repair, essential fatty acids</li>
                <li><strong className="text-foreground">Tasmanian Hemp Seed Oil 15%</strong> — Anti-inflammatory, balanced omega ratio</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-display text-foreground">The Australian Carriers (59%)</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground text-[17px] leading-relaxed">
                <li><strong className="text-foreground">Australian Jojoba 35%</strong> — Sebum regulation, skin-identical structure</li>
                <li><strong className="text-foreground">Australian Macadamia 9%</strong> — Omega-7, lipid support for active skin</li>
                <li><strong className="text-foreground">Tasmanian Hemp 15%</strong> — Part of Australian-grown content</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-display text-foreground">The Stabilisers (6%)</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground text-[17px] leading-relaxed">
                <li><strong className="text-foreground">Meadowfoam Seed Oil 5%</strong> — UV protection, extreme oxidative stability</li>
                <li><strong className="text-foreground">Vitamin E 0.7%</strong> — Antioxidant</li>
                <li><strong className="text-foreground">Rosemary CO2 Extract 0.3%</strong> — Natural preservation system</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-muted-foreground text-[17px]">
            No synthetic ingredients. No essential oils. No added fragrance. Full ingredient details on 
            the <Link to="/ingredients" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">Ingredients page</Link>.
          </p>
        </div>
      </section>

      {/* Australian Provenance */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Australian Provenance</h2>
          <p className="mt-4 text-foreground font-medium text-[17px]">59% Australian-grown by volume.</p>

          <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed text-[17px]">
            <div>
              <h3 className="text-lg font-display text-foreground">Tasmanian Hemp Seed Oil (15%)</h3>
              <p className="mt-2">
                Sourced from Tasmanian hemp farms. Cold-pressed, THC-free. One of the few plant oils containing 
                both omega-6 and omega-3 in balanced proportions. Anti-inflammatory support for skin that's 
                constantly exposed to environmental stress.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-display text-foreground">Australian Jojoba (35%)</h3>
              <p className="mt-2">
                Grown in Western Australia, South Australia, and New South Wales. Structurally similar to human 
                sebum (your skin's natural oil). Helps regulate skin's natural oil balance without heaviness — ideal for men who 
                sweat from outdoor activity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-display text-foreground">Australian Macadamia (9%)</h3>
              <p className="mt-2">
                From Queensland and Northern NSW. Australian native tree. Contains palmitoleic acid (omega-7) 
                which helps maintain skin's lipid barrier under chronic environmental exposure.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-lg font-display text-foreground">Why Australian ingredients matter</h3>
              <p className="mt-2">
                Not just "Australian brand" marketing. Actual Australian-grown ingredients at meaningful 
                percentages (59% of the formula). Sourced from Australian farms, built for harsh Australian 
                conditions (intense UV, salt air, wind).
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Equipment Maintenance, Not Skincare */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Equipment Maintenance, Not Skincare</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p className="text-foreground text-lg font-medium">Your skin is gear.</p>
            <p>If you're doing it seriously, it needs maintenance.</p>
            <p>
              Your wetsuit gets rinsed after every session. Your bike gets serviced regularly. Your climbing 
              rope gets inspected. Your work boots get conditioned.
            </p>
            <p>
              Your skin — constantly exposed to sun, wind, and salt while you're actively doing the thing — 
              deserves the same functional approach.
            </p>
            <p className="text-foreground font-medium">
              Not anti-aging vanity. Not luxury ritual. Equipment maintenance so you can keep doing it.
            </p>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={ruggedCoast}
            alt="Rugged coastline at dusk"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display">How to Use</h2>
          <p className="mt-4 text-foreground font-medium text-[17px]">60 seconds. Once daily. That's it.</p>

          <ol className="mt-8 space-y-3 text-muted-foreground text-[17px] leading-relaxed list-decimal pl-6">
            <li>Cleanse face</li>
            <li>Apply 3–4 drops to damp skin (not dry)</li>
            <li>Press into face and neck</li>
            <li>Once daily (evening recommended)</li>
          </ol>

          <div className="mt-10">
            <h3 className="text-lg font-display text-foreground">What to expect</h3>
            <ul className="mt-3 space-y-2 text-muted-foreground text-[17px] leading-relaxed list-disc pl-6">
              <li>Natural plant oil aroma (grassy, nutty, earthy) — dissipates quickly</li>
              <li>Medium-weight texture, absorbs in approximately 2 minutes</li>
              <li>30ml bottle = approximately 2 months daily use</li>
            </ul>
            <p className="mt-4 text-muted-foreground text-[17px]">
              Less is more. Over-application may feel greasy.
            </p>
            <p className="mt-4 text-muted-foreground text-[17px]">
              <strong className="text-foreground">Not suitable for:</strong> Very oily or acne-prone skin.
            </p>
          </div>
        </div>
      </section>

      {/* The Category */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">The Category: Equipment Maintenance</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p className="text-foreground font-medium">We position skincare differently.</p>
            <p>Most men's skincare falls into three categories:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong className="text-foreground">Anti-aging:</strong> Fear-based marketing ("look younger," "turn back time")</li>
              <li><strong className="text-foreground">Luxury ritual:</strong> Spa experiences, aromatherapy, 10-step routines</li>
              <li><strong className="text-foreground">Basic grooming:</strong> Generic moisturisers, 3-in-1 products</li>
            </ol>
            <p className="text-foreground font-medium">
              None of these address active outdoor people who want to keep doing the thing.
            </p>
            <p>
              We created a fourth category: <strong className="text-foreground">Equipment maintenance.</strong>
            </p>
            <p>
              Function over form. Efficacy over ritual. Barrier maintenance for people who are serious about 
              their outdoor activity and want to keep going for decades more.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Not Anti-Aging */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Not Anti-Aging</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p className="text-foreground font-medium">This is not anti-aging.</p>
            <p>
              Field Oil addresses environmental exposure from active outdoor pursuits — sun, wind, salt. 
              It supports barrier function for skin that's constantly exposed.
            </p>
            <p>
              It's not designed to make you look younger. It's designed to maintain your skin barrier while 
              you're actively doing the thing — surfing, cycling, working outdoors.
            </p>
            <p>
              If you're putting in 15 hours a week outdoors, your skin needs different care than someone 
              the same age who works indoors. We address that difference.
            </p>
            <p className="text-foreground font-medium">
              Active outdoor exposure ≠ chronological aging.
            </p>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="bg-secondary/50 section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Specifications</h2>
          <dl className="mt-8 space-y-4 text-[17px]">
            {[
              ["Product", "Field Oil — Barrier Maintenance Face Oil"],
              ["Size", "30ml amber glass bottle with black glass dropper"],
              ["Price", "$85 AUD"],
              ["Formula", "7 natural ingredients, 59% active barrier-repair oils, 59% Australian-grown"],
              ["Shelf Life", "12–18 months from manufacture"],
              ["Storage", "Below 25°C, away from direct sunlight"],
              ["Made in", "Australia"],
              ["Suitable for", "Normal, dry, mature, outdoor-exposed skin"],
              ["Not suitable for", "Very oily or acne-prone skin"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col sm:flex-row sm:gap-4">
                <dt className="font-medium text-foreground sm:w-36 sm:flex-shrink-0">{label}</dt>
                <dd className="text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Compliance Note */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Field Oil is a cosmetic product designed to support barrier function and help maintain skin's 
            natural moisture barrier. It is not a therapeutic good and is not intended to diagnose, treat, 
            cure, or prevent any disease. For external use only. Contains tree nut derivatives (Macadamia).
          </p>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Closing / Mission + Contact */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display">Keep Doing the Thing.</h2>
          <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Barrier maintenance for men who are serious about outdoor activity.
            </p>
            <p>Not anti-aging. Not luxury ritual. Equipment maintenance.</p>
            <p className="mt-6">
              Questions about the product, ingredients, or approach?{" "}
              <a href="mailto:hello@coastalendurance.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.com
              </a>
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center mt-12 text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors"
          >
            Maintain Your Barrier
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default About;
