import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

import fieldOilImage from "@/assets/field-oil-bottle.jpg";

const Home = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("newsletter_signups").insert({
      email: newsletterEmail,
      source: "homepage"
    });
    setIsSubscribing(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("You're subscribed. Updates only.");
    setNewsletterEmail("");
  };

  return (
    <main>
      <Helmet>
        <title>Field Oil: Daily Skin Maintenance</title>
        <meta name="description" content="A daily face oil for healthy skin. Seven natural oils, Rosehip and Hemp actives, Australian-grown carriers, zero fragrance. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/" />
        <meta property="og:title" content="Field Oil: Daily Skin Maintenance" />
        <meta property="og:description" content="A daily face oil for healthy skin. Seven natural oils, Rosehip and Hemp actives, Australian-grown carriers, zero fragrance. Made in Australia." />
        <meta property="og:url" content="https://coastalendurance.com/" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-background border-b border-border">
        <div className="container-wide relative z-10 pt-20">
          <div className="max-w-2xl">
            <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-4 animate-slide-up">
              100% NATURAL INGREDIENTS
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-typewriter uppercase leading-tight animate-slide-up text-foreground" style={{ animationDelay: "0.05s" }}>
              FIELD OIL: DAILY SKIN MAINTENANCE
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-typewriter animate-slide-up text-foreground" style={{ animationDelay: "0.08s" }}>
              For Sun, Salt, Wind, & Time
            </p>
            <p
              className="mt-6 text-lg font-body text-muted-foreground leading-relaxed animate-slide-up max-w-lg"
              style={{ animationDelay: "0.1s" }}>
              Field Oil maintains what the elements wear down.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/product" className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background font-typewriter text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                MAINTAIN YOUR BARRIER
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center px-6 py-3 border border-foreground text-foreground font-typewriter text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors">
                ABOUT US
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">
            FOR LIFE IN THE OUTDOORS
          </h2>
          <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed text-left">
            Field Oil is a daily face oil built for those who spend their days outside, surfers, runners, cyclists, builders, farmers, anyone who works and lives under the Australian sky.
          </p>
        </div>
      </section>

      {/* Product Introduction */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <span className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
                THE HERO PRODUCT
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-typewriter uppercase">
                FIELD OIL
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
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={fieldOilImage}
                  alt="Field Oil 30ml bottle"
                  className="w-full h-full object-cover"
                  loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Preview */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="max-w-[700px] mx-auto px-6 text-center">
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
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">
            UPDATES ONLY. NO NOISE.
          </h2>
          <p className="mt-4 text-[17px] font-body text-muted-foreground">
            New products, restocks, and nothing else.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email"
              aria-label="Email address for newsletter"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="input-field flex-1"
              required />
            <button type="submit" disabled={isSubscribing} className="btn-primary whitespace-nowrap disabled:opacity-50">
              {isSubscribing ? "..." : "SUBSCRIBE"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Home;
