import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import sweepingPlains from "@/assets/sweeping-plains.jpg";
import ruggedCoast from "@/assets/rugged-coast.jpg";
import droughtAndRain from "@/assets/drought-and-rain.jpg";

const About = () => {
  return (
    <main id="top" className="pt-20">
      <Helmet>
        <title>About Field Oil | Coastal Endurance</title>
        <meta name="description" content="A daily face oil, naturally derived. Rosehip and Hemp actives, Australian-grown carriers, and a natural antioxidant system. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/about" />
        <meta property="og:title" content="About Field Oil | Coastal Endurance" />
        <meta property="og:description" content="Naturally derived oils, each with a purpose: active barrier-support oils, Australian-grown carriers, and a natural antioxidant system. Made in Australia." />
        <meta property="og:url" content="https://coastalendurance.com/about" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Field Oil",
          url: "https://coastalendurance.com/about",
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center">
        <div className="absolute inset-0">
          <img src={sweepingPlains} alt="Vast Australian outback" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30" />
        </div>
        <div className="container-narrow relative z-10 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-typewriter uppercase">
            ABOUT FIELD OIL
          </h1>
          <p className="mt-8 text-xl md:text-2xl font-body text-muted-foreground leading-relaxed max-w-3xl mx-auto md:whitespace-nowrap">
            Equipment maintenance for life in a sunburnt country.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase mb-8">How it started</h2>
          <div className="space-y-6 font-body text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Eleven years ago, when our daughter was born, we rubbed a little sunflower oil into her skin.
              I started using it on mine, too.
            </p>
            <p>
              My skin runs dry and sensitive, and it just worked. It's had a lot to put up with. I've surfed,
              skated and snowboarded, played rugby, hiked, and sat through more kids' sport on the sideline
              than I can count, with years of air-conditioned offices and air-conditioned planes in between.
              My skin has been taking a beating for a long time.
            </p>
            <p>
              These days I run marathons, one a year. It started simply enough, getting fit so I could be a
              good dad, and then it escalated; by 2019 I was running the distance. Long runs are hard on your
              skin: sun, wind, sweat, and the way training strips you down as you build through the phases. My
              skin needed all the help it could get.
            </p>
            <p>
              I'd tried moisturisers and lotions over the years and never got on with the feel of them: the
              film, the heaviness. And read the label on most of them and you see the other problem. To survive
              a warehouse, a shipping container, a shelf and a hot car, and to stay consistent for months at any
              temperature, a cream ends up carrying a long list of synthetics. It becomes a small pharmaceutical
              process to deliver something that should be simple.
            </p>
            <p>
              I use it every day. So the last thing I wanted anywhere near my skin was synthetics. It had to be natural.
            </p>
            <p className="text-foreground text-lg font-medium">
              So I asked a simpler question: what do you actually need?
            </p>
            <p>
              Naturally derived oils, many of them close to the oils your skin already makes. A couple of
              actives to do the work. Carriers to spread them light and even. And antioxidants to keep the
              whole thing stable and honest for as long as you'll use it: in your bag, at the beach, in the
              car, wherever it lives.
            </p>
            <p>
              You can do all of that with natural ingredients. No water, no emulsion, no cream. Field Oil is
              anhydrous. There's no water in it, so none of that complexity has to exist. The formula is short.
              You can read every line of it.
            </p>
            <p className="text-foreground text-lg font-medium">
              And honestly, it just feels better to rub a little oil into your skin than any of the other stuff.
            </p>
            <p className="pt-2 font-typewriter text-sm uppercase tracking-widest text-foreground">
              Adam Hyde, Founder
            </p>
          </div>
        </div>
      </section>

      {/* The long game */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img src={droughtAndRain} alt="Cracked earth under an approaching storm" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">The long game</h2>
          <div className="mt-8 space-y-6 font-body text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Most skincare waits for the damage, then sells you the rescue. Anti-ageing. Repair. A
              ten-step fix for a problem you didn't have yet.
            </p>
            <p>
              I don't think like that. If you train for anything, you already know the opposite is true:
              you look after the gear while it's still in the fight, so it stays in the fight. Small,
              daily, unglamorous. It's how you keep doing the thing for years instead of weeks.
            </p>
            <p className="text-foreground font-medium">
              Skin's no different. Sun, wind, salt, sweat, week after week. So the smart move is the dull
              one: look after it daily, before you're the one needing rescuing.
            </p>
          </div>
        </div>
      </section>

      {/* What's in it */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase mb-8">What's in it</h2>
          <div className="space-y-6 font-body text-muted-foreground leading-relaxed text-[17px]">
            <p>The formula is short, and you can read every line.</p>
            <p>
              Naturally derived oils, chosen for what they do, not what they smell like. Rosehip and hemp
              are the actives. Australian jojoba and macadamia carry them, light and clean. Vitamin E and
              rosemary keep the whole thing stable and honest.
            </p>
            <p className="text-foreground font-medium">
              Majority Australian-grown. Zero fragrance. Zero synthetics. No water, so no preservative
              circus. That's the lot.
            </p>
          </div>
          <Link
            to="/ingredients"
            className="inline-flex items-center mt-8 font-typewriter text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors"
          >
            Every oil, every reason
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Who it's for */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0">
          <img src={ruggedCoast} alt="Rugged Australian coastline" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">Who it's for</h2>
          <div className="mt-8 space-y-6 font-body text-muted-foreground leading-relaxed text-[17px]">
            <p>
              Men who've spent their lives outdoors and paid for it in weathered skin. Surfers and
              swimmers, riders and runners, tradies and dads on the sideline.
            </p>
            <p className="text-foreground font-medium">
              But honestly, if your skin has copped its share of sun, salt, wind and years, it's for you.
            </p>
            <p>
              You don't have to wait for the damage to show. If you're still out there, start looking
              after it now.
            </p>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">Look after the gear</h2>
          <div className="mt-8 space-y-4 font-body text-muted-foreground leading-relaxed text-[17px]">
            <p>One product. Once a day. Made properly, in Australia, for a life spent out in it.</p>
            <p>
              Questions about the oil, the ingredients, or the thinking?{" "}
              <a href="mailto:hello@coastalendurance.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.com
              </a>
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center mt-12 font-typewriter text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors"
          >
            Get Field Oil
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default About;
