import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet-async";
import coastalImage from "@/assets/coastal-landscape.jpg";
import sweepingPlains from "@/assets/sweeping-plains.jpg";
import ruggedCoast from "@/assets/rugged-coast.jpg";
import droughtAndRain from "@/assets/drought-and-rain.jpg";

const About = () => {
  return (
    <main id="top" className="pt-20">
      <Helmet>
        <title>About Coastal Endurance — Equipment Maintenance, Not Cosmetics | Australia</title>
        <meta name="description" content="Coastal Endurance makes barrier maintenance products for men with outdoor exposure. Founded in Australia. One product: Field Oil. 7 natural ingredients. No rituals, no vanity — just function." />
        <link rel="canonical" href="https://coastalendurance.com/about" />
      </Helmet>
      {/* Hero - Sweeping Plains */}
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
            We Don't Make Cosmetics.
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl">
            We make equipment maintenance. The difference matters.
          </p>
        </div>
      </section>

      {/* What We Believe */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-xl text-foreground font-display leading-relaxed">
            Nothing on the market worked for Australian outdoor conditions. So we built it.
          </p>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Your face is functional. It's exposed to UV, salt, wind, dust, chlorine—more than 
              any other part of you. Decades of that breaks down the barrier that keeps everything working.
            </p>
            <p>
              You maintain your tools. Your vehicle. Your gear. Your face is no different.
            </p>
            <p>
              The people who need this most are the least likely to buy face oil. Not because they 
              don't care—because nothing on the shelf is built for them.
            </p>
            <p className="text-foreground text-lg font-medium">
              Your skin does a job. We keep it doing that job.
            </p>
          </div>
        </div>
      </section>

      {/* Rugged Coast - Behind "How We're Different" */}
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
          <h2 className="text-3xl md:text-4xl font-display">How We're Different</h2>

          <div className="mt-12 space-y-10">
            <div>
              <h3 className="text-xl font-display">We don't sell self-care.</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                It's 60 seconds of maintenance after you've put your face through it. Apply it like 
                sunscreen—because it works, not because it feels indulgent.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't sell vanity.</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                Your skin is an organ. It protects you from UV, wind, pollution, water loss. 
                We maintain that function. Everything else is a side effect.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't manufacture a sourcing story.</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                Two ingredients from Australian soil—jojoba from WA, macadamia from Queensland. 
                The rest from wherever they grow best. Performance dictates sourcing.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't mass-produce.</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                Small batches. Tested and traceable. Every bottle carries its batch number and manufacture 
                date. If something's wrong, we trace every ingredient back to its origin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Make */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What We Make</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              One product: <strong className="text-foreground">Field Oil</strong>. A barrier oil using 
              bioidentical lipids—oils structurally identical to what your skin already produces.
            </p>
            <p>
              Jojoba mimics sebum (your skin's natural oil). Rosehip delivers fatty acids 
              your skin can't make. Macadamia provides omega-7. Meadowfoam locks in moisture.
            </p>
            <p>
              Seven ingredients. No fillers. No fragrance. No synthetic preservatives.
            </p>
            <p className="text-foreground text-lg font-medium">
              It's not magic. It's mechanical.
            </p>
          </div>
        </div>
      </section>

      {/* Drought and Rain - Behind "Why We Exist" */}
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
          <h2 className="text-3xl md:text-4xl font-display">Why We Exist</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Tradies, surfers, fishermen, sailors, farmers—the people who need this most aren't buying 
              face oil. Because nothing in the market speaks to them.
            </p>
            <p>Everything is either:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ritualistic (ten-step routines, spa ceremonies)</li>
              <li>Generic (black packaging, masculine names, mediocre formulas)</li>
              <li>Padded with non-functional ingredients (emulsifiers, thickeners, synthetic preservatives—needed for texture, not your skin)</li>
              <li>Not 100% natural (we are—every ingredient has a performance function, nothing else)</li>
            </ul>
            <p>
              That gap exists. Someone had to fill it.
            </p>
          </div>
        </div>
      </section>

      {/* What's Next */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What's Next</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              A cleanser. A mineral sunscreen. Maybe a post-shave oil. All small-batch, Australian-made, 
              function over form. But not yet. We'd rather do one thing well than ten things poorly.
            </p>
            <p>
              Until then: Field Oil. Take it or leave it.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Coastal Image - Behind "Who We Are" */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img
            src={coastalImage}
            alt="Australian coastline"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display">Who We Are</h2>
          <div className="mt-8 space-y-6 text-[17px]">
            <p className="text-muted-foreground leading-relaxed">
              Founded by Adam Hyde.
            </p>
            <blockquote className="border-l-2 border-primary pl-6 text-muted-foreground leading-relaxed italic">
              "Years in the great outdoors takes a toll. I tried the usual stuff—Aesop, Kiehl's, whatever 
              was at Mecca. It was either too expensive, too ritualistic, or included ingredients I didn't 
              want on my face—ingredients needed to enable moisturiser to retain its creaminess or preservatives 
              I'd rather avoid. So I built what I needed. It works for me, and I hope you find it works for you."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display">Questions?</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Email us at{" "}
              <a href="mailto:hello@coastalendurance.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.com
              </a>
              . We answer everything. We're not a corporation. We're a brand you can talk to.
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