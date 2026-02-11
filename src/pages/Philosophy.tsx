import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import coastalImage from "@/assets/coastal-landscape.jpg";

const Philosophy = () => {
  const principles = [
    {
      title: "Fewer products. Better outcomes.",
      description: "The skincare industry profits from complexity. We don't. One well-formulated product, used consistently, outperforms a cabinet full of mediocre ones. We make what works and nothing more.",
    },
    {
      title: "Designed for real environments.",
      description: "Most skincare is built for how your skin looks today. Ours is built to support its health over time — under constant exposure to the natural environment.",
    },
    {
      title: "Ingredient integrity.",
      description: "Every ingredient earns its place through function, not marketing. No fillers. No fragrance. No compounds added for sensory appeal at the expense of performance. If it doesn't work, it doesn't go in.",
    },
    {
      title: "Long-term resilience.",
      description: "We're not interested in temporary fixes or cosmetic tricks. Our focus is skin health — strengthening the barrier, supporting natural repair, building resilience that compounds over time.",
    },
  ];

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={coastalImage}
            alt="Australian coastline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>
        <div className="container-narrow relative z-10 text-center py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            Philosophy
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            What we believe about skincare. And what we refuse to accept.
          </p>
        </div>
      </section>

      {/* Opening Statement */}
      <section className="section-padding">
        <div className="container-narrow">
          <blockquote className="text-2xl md:text-3xl font-display text-center leading-relaxed">
            Built for the elements.
          </blockquote>
        </div>
      </section>

      {/* Principles */}
      <section className="section-padding bg-secondary">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {principles.map((principle, index) => (
              <div key={index}>
                <h2 className="text-2xl md:text-3xl font-display">
                  {principle.title}
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="section-padding">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            The Problem We Saw
          </h2>
          <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
            <p>
              The men's skincare market is split between two extremes. On one side, 
              mass-market products with cheap ingredients and aggressive marketing. 
              On the other, overpriced "luxury" products that prioritize packaging and 
              fragrance over function.
            </p>
            <p>
              Neither serves men who actually need performance. Men who spend real time 
              outside. Men whose skin faces genuine stress — not theoretical urban pollution, 
              but actual sun, salt, wind, and sweat. Every day.
            </p>
            <p>
              We built Coastal Endurance because we couldn't find what we needed. A serious 
              product. Functional ingredients. No marketing theater. Just skin that works 
              better under real conditions.
            </p>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Our Commitment
          </h2>
          <div className="mt-8 space-y-4 text-primary-foreground/80">
            <p>We will never release a product that doesn't outperform what exists.</p>
            <p>We will never add ingredients for marketing purposes.</p>
            <p>We will never complicate your routine to sell more products.</p>
            <p>We will always prioritize long-term skin health over short-term appearance.</p>
          </div>
          <Link to="/product" className="inline-flex items-center mt-12 text-sm uppercase tracking-wider border-b border-primary-foreground/50 pb-1 hover:border-primary-foreground transition-colors">
            See What We've Built
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Philosophy;