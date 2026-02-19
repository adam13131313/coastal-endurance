import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-product.jpg";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";

const Home = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Field Oil product on sand"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60 md:bg-gradient-to-r md:from-background/70 md:via-background/40 md:to-transparent" />
        </div>
        
        <div className="container-wide relative z-10 pt-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-medium leading-tight animate-slide-up">
              Built for sun, salt, wind, and time.
            </h1>
            <p
              className="mt-6 text-lg md:text-xl text-foreground md:text-foreground/80 leading-relaxed animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Field Oil rebuilds what the elements break down.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/product" className="btn-primary">
                Maintain Your Barrier
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link to="/about" className="btn-outline">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Skincare for a life outside.
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
             Field Oil is a daily face oil built for men who spend their days outside — 
            surfers, runners, cyclists, builders, anyone who works and lives under the Australian sky.
          </p>
        </div>
      </section>

      {/* Product Introduction */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">
                The Hero Product
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-display">
                Field Oil
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                A barrier oil that reinforces your skin's natural barrier. 
                Fast-absorbing, non-greasy, built for real conditions. 
                One product. Daily. That's the routine.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Repairs and protects the skin barrier",
                  "Australian-sourced actives",
                  "No fragrance, no essential oils",
                  "30ml — 2-month supply",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-ocean-slate mt-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/product" className="btn-primary mt-10 inline-flex">
                Learn More
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={fieldOilImage}
                  alt="Field Oil 30ml bottle"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Preview */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Better performance.
          </h2>
          <p className="mt-6 text-lg text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Every ingredient earns its place.
          </p>
          <a href="/about#top" className="inline-flex items-center mt-8 text-sm uppercase tracking-wider border-b border-primary-foreground/50 pb-1 hover:border-primary-foreground transition-colors">
            Read Our Story
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Updates only. No noise.
          </h2>
          <p className="mt-4 text-muted-foreground">
            New products, restocks, and nothing else.
          </p>
          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email"
              className="input-field flex-1"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Home;