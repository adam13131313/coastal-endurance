import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

import ruggedCoast from "@/assets/rugged-coast.jpg";
import heroLandscape from "@/assets/coastal-landscape.jpg";
import NewsletterSignup from "@/components/NewsletterSignup";
import Reveal from "@/components/Reveal";

const Home = () => {
  return (
    <main>
      <Helmet>
        <title>Field Oil: Daily Skin Maintenance</title>
        <meta name="description" content="A daily face oil for healthy skin. Naturally derived, Rosehip and Hemp actives, Australian-grown carriers, no added fragrance. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/" />
        <meta property="og:title" content="Field Oil: Daily Skin Maintenance" />
        <meta property="og:description" content="A daily face oil for healthy skin. Naturally derived, Rosehip and Hemp actives, Australian-grown carriers, no added fragrance. Made in Australia." />
        <meta property="og:url" content="https://coastalendurance.com/" />
      </Helmet>

      {/* Hero Section — image-led, cinematic. Landscape backdrop is a placeholder
          pending real photography; the layout swaps to any hero image cleanly. */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroLandscape}
            alt="Rugged Australian coastline at dusk, surf against cliffs"
            className="w-full h-full object-cover animate-hero-settle"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
        </div>
        <div className="container-wide relative z-10 pb-20 md:pb-28 pt-40">
          <div className="max-w-2xl text-background">
            <p className="font-typewriter text-xs uppercase tracking-[0.25em] text-background/70 mb-5 animate-slide-up">
              100% NATURALLY DERIVED
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-typewriter uppercase leading-[1.05] animate-slide-up" style={{ animationDelay: "0.05s" }}>
              FIELD OIL: DAILY SKIN MAINTENANCE
            </h1>
            <p className="mt-6 text-xl md:text-2xl font-typewriter text-background/90 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              For Sun, Salt, Wind, &amp; Time
            </p>
            <p
              className="mt-5 text-lg font-body text-background/75 leading-relaxed animate-slide-up max-w-lg"
              style={{ animationDelay: "0.15s" }}>
              Field Oil maintains what the elements wear down.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.25s" }}>
              <Link to="/product" className="group inline-flex items-center justify-center px-6 py-3 bg-background text-foreground font-typewriter text-sm uppercase tracking-wider hover:bg-background/90 transition-colors">
                MAINTAIN YOUR BARRIER
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center px-6 py-3 border border-background/60 text-background font-typewriter text-sm uppercase tracking-wider hover:bg-background hover:text-foreground transition-colors">
                ABOUT US
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Father's Day promo */}
      <Link
        to="/fathers-day"
        className="group block bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        <div className="container-wide py-5 md:py-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
          <span className="inline-flex items-center bg-background text-foreground font-typewriter text-[11px] uppercase tracking-widest px-2.5 py-1 animate-pulse">
            Father's Day
          </span>
          <span className="font-typewriter text-sm md:text-lg uppercase tracking-wider">
            Daily skin maintenance for Dad
          </span>
          <span className="hidden sm:inline font-body text-sm opacity-80">
            Order now, ships from 10 August, in time for 6 September
          </span>
          <span className="inline-flex items-center font-typewriter text-xs uppercase tracking-widest border-b border-background/50 pb-0.5 group-hover:border-background">
            Shop
            <ArrowRight className="ml-1.5 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      {/* Problem Section */}
      <section className="section-padding bg-secondary">
        <Reveal className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">
            FOR LIFE IN THE OUTDOORS
          </h2>
          <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed text-left">
            Field Oil is a daily face oil built for those who spend their days outside, surfers, runners, cyclists, builders, farmers, anyone who works and lives under the Australian sky.
          </p>
        </Reveal>
      </section>

      {/* Product Introduction */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal className="order-2 lg:order-1">
              <span className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
                THE HERO PRODUCT
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-typewriter uppercase">
                FIELD OIL 001
              </h2>
              <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed">
                A barrier oil that supports your skin's natural barrier. 
                Fast-absorbing, non-greasy, built for real conditions. 
                One product. Daily. That's the routine.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                "Supports and maintains the skin barrier",
                "Rosehip & Hemp actives, Australian-grown carriers",
                "No fragrance, no essential oils",
                "30ml, approximately 3 months supply"].
                map((feature, index) =>
                <li key={index} className="flex items-start gap-3 font-body text-muted-foreground text-[17px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
                    {feature}
                  </li>
                )}
              </ul>
              <Link to="/product" className="btn-primary mt-10 inline-flex">
                DISCOVER FIELD OIL
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Reveal>
            <Reveal className="order-1 lg:order-2" delay={0.1}>
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={ruggedCoast}
                  alt="Rugged Australian coastline, the conditions Field Oil is made for"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out hover:scale-[1.03]"
                  loading="lazy" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Philosophy Preview */}
      <section className="section-padding bg-primary text-primary-foreground">
        <Reveal className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">
            BETTER PERFORMANCE
          </h2>
          <p className="mt-6 text-[17px] font-body text-primary-foreground/80 leading-relaxed">
            Every ingredient earns its place.
          </p>
          <Link to="/about" className="inline-flex items-center mt-8 font-typewriter text-sm uppercase tracking-wider border-b border-primary-foreground/50 pb-1 hover:border-primary-foreground transition-colors">
            READ OUR STORY
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Reveal>
      </section>

      {/* Newsletter */}
      <NewsletterSignup source="homepage" />
    </main>
  );
};

export default Home;
