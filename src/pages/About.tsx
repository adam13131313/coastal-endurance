import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet-async";
import sweepingPlains from "@/assets/sweeping-plains.jpg";
import ruggedCoast from "@/assets/rugged-coast.jpg";
import droughtAndRain from "@/assets/drought-and-rain.jpg";


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

      {/* Formula & Provenance CTA */}
      <section className="bg-secondary/50 section-padding">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-lg text-foreground font-medium">
            Seven ingredients. Each with a purpose.
          </p>
          <p className="mt-4 text-muted-foreground text-[17px] leading-relaxed">
            59% active barrier-repair oils. 59% Australian-grown. Zero synthetics, zero essential oils, zero fragrance.
          </p>
          <Link
            to="/ingredients"
            className="inline-flex items-center mt-8 text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors"
          >
            Full Ingredient Breakdown
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
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
