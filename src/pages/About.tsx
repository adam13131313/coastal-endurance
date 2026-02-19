import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import coastalImage from "@/assets/coastal-landscape.jpg";

const About = () => {
  return (
    <main id="top" className="pt-20">
      {/* Hero */}
      <section className="min-h-[50vh] flex items-center bg-secondary">
        <div className="container-narrow py-24 md:py-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            We Don't Make Skincare.
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
            We make equipment maintenance. The difference matters.
          </p>
        </div>
      </section>

      {/* Origin + What We Believe */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="text-xl text-foreground font-display leading-relaxed">
            Coastal Endurance started with a simple problem: nothing on the market 
            actually worked for Australian outdoor conditions.
          </p>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Your face isn't decoration. It's functional. It's exposed to UV, salt, wind, dust, 
              chlorine—maybe more than any other part of you.
            </p>
            <p>
              Decades of that doesn't just tan you. It breaks down the barrier that keeps everything working.
            </p>
            <p>
              You maintain your tools. Your vehicle. Your gear. You do it because neglect has consequences. 
              Your face is no different.
            </p>
            <p>
              Coastal Endurance exists because the men who need this product the most are the least likely 
              to buy "skincare." Not because they don't care. Because skincare isn't built for them. It's 
              built for people who have time for ten-step routines and want to look younger.
            </p>
            <p className="text-foreground text-lg font-medium">
              That's not you.
            </p>
            <p>
              You don't need to look younger. You need your skin to keep working. That's what we're here for.
            </p>
          </div>
        </div>
      </section>

      {/* Image Break */}
      <section className="py-12">
        <div className="container-wide">
          <div className="aspect-[21/9] overflow-hidden">
            <img
              src={coastalImage}
              alt="Australian coastline"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">How We're Different</h2>

          <div className="mt-12 space-y-12">
            <div>
              <h3 className="text-xl font-display">We don't sell self-care.</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed text-[17px]">
                This isn't a ritual. It isn't "me time." It's 60 seconds of maintenance after you've put 
                your face through it. Apply it like you apply sunscreen—because it works, not because it 
                feels indulgent.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't sell vanity.</h3>
              <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
                <p>
                  You've earned every line. We're not here to erase them. We're here to help maintain 
                  barrier function for skin exposed to harsh outdoor conditions.
                </p>
                <p>
                  There's a difference between ageing and environmental wear. You can't stop the first. 
                  You can support your skin against the second.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't manufacture a sourcing story.</h3>
              <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
                <p>
                  Three of our nine ingredients are grown in Australian soil—jojoba from the WA desert, 
                  macadamia from Queensland, Kakadu plum from the NT. The rest comes from the only places 
                  on earth these plants naturally grow.
                </p>
                <p>
                  We source locally when Australian-grown meets our performance standard. When it doesn't 
                  exist here, we go to the source. Performance dictates sourcing. Not marketing.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't mass-produce.</h3>
              <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
                <p>
                  Every bottle is made in small batches in Australia. Each batch is tested and traceable. 
                  Your bottle carries its batch number and manufacture date.
                </p>
                <p>
                  If something's wrong, we know exactly which production run it came from and can trace 
                  every ingredient back to its origin. Mass production cuts corners. We don't.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-display">We don't apologise for being specific.</h3>
              <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed text-[17px]">
                <p>
                  This isn't for everyone. It's for men who spend more time outside than in. Men whose 
                  skin is working as hard as they are.
                </p>
                <p>
                  If you're not that person, there are a thousand other brands that will happily take your 
                  money. We'd rather be honest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* What We Make */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What We Make</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Right now, one product: <strong className="text-foreground">Field Oil</strong>.
            </p>
            <p>
              Field Oil helps maintain your skin's natural barrier using bioidentical lipids—oils 
              structurally identical or extremely similar to what your skin already produces.
            </p>
            <p>
              Squalane and jojoba mimic sebum (your skin's natural oil). Rosehip delivers essential 
              fatty acids your skin can't synthesise on its own. Kakadu plum provides antioxidant 
              (compounds that neutralise cell-damaging molecules) protection against UV-induced free 
              radical damage. Meadowfoam stabilises the formula and locks in moisture.
            </p>
            <p>
              Nine ingredients. Every one has a function. No fillers. No fragrance. No synthetic 
              preservatives. Nothing is in there because it looks good on a label.
            </p>
            <p className="text-foreground text-lg font-medium">
              It's not magic. It's mechanical.
            </p>
            <p>
              Environmental exposure wears down your barrier during the day. You maintain it after. Simple.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Why We Exist */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Why We Exist</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Because the men who need this most—tradies, surfers, fishermen, sailors, farmers, outdoor 
              workers, anyone who earns a living or spends their life exposed to the elements—aren't 
              buying face oil.
            </p>
            <p>
              Not because they don't need it. Because nothing in the market speaks to them.
            </p>
            <p>Everything is either:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ritualistic (ten-step routines, spa experiences, self-care ceremonies)</li>
              <li>Generic (men's grooming with black packaging and masculine names slapped on mediocre formulas)</li>
              <li>Inaccessible (luxury brands pricing at $200+ for status, not performance)</li>
            </ul>
            <p>
              We built Coastal Endurance because that gap exists. Someone had to fill it.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* What's Next */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What's Next</h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              More products, eventually. A cleanser. A mineral sunscreen. Maybe a post-shave oil. All 
              built the same way—small-batch, Australian-made, function over form.
            </p>
            <p>
              But not yet. We'd rather do one thing well than ten things poorly.
            </p>
            <p>
              When we're confident the next product earns its place, we'll make it. Until then: Field Oil. 
              Take it or leave it.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Who We Are */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">Who We Are</h2>
          <div className="mt-8 space-y-6 text-[17px]">
            <p className="text-muted-foreground leading-relaxed">
              Founded by Adam Hyde.
            </p>
            <blockquote className="border-l-2 border-primary pl-6 text-muted-foreground leading-relaxed italic">
              "Years in the great outdoors takes a toll. I tried the usual stuff—Aesop, Kiehl's, whatever was at Mecca. 
              It was either too expensive, too ritualistic, or included ingredients I didn't want on my 
              face—ingredients needed to enable moisturiser to retain its creaminess or preservatives I'd 
              rather avoid. So I built what I needed. It works for me, and I hope you find it works for you."
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
              <a href="mailto:hello@coastalendurance.co" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.co
              </a>
              . We answer everything.
            </p>
            <p>
              If you're not sure this is for you, ask. If you want ingredient sources, ask. If you think 
              this is overpriced, tell us—we'd rather have an honest conversation than a refund request.
            </p>
            <p>
              We're not a corporation. We're a brand you can talk to.
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
