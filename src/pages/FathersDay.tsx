import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Check } from "lucide-react";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";

const FathersDay = () => {
  return (
    <main className="pt-20">
      <Helmet>
        <title>Father's Day Gift: Field Oil | Coastal Endurance</title>
        <meta
          name="description"
          content="A Father's Day gift for Dad. Field Oil, a 100% naturally derived daily face oil made in Australia. Order now, ships from 18 August, in time for Father's Day, Sunday 6 September."
        />
        <link rel="canonical" href="https://coastalendurance.com/fathers-day" />
        <meta property="og:title" content="Father's Day Gift: Field Oil" />
        <meta property="og:description" content="Daily skin maintenance, for Dad. Order now, ships from 18 August, in time for Father's Day." />
        <meta property="og:url" content="https://coastalendurance.com/fathers-day" />
      </Helmet>

      {/* Hero */}
      <section className="section-padding border-b border-border">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-4">
                Father's Day · Sunday 6 September
              </p>
              <h1 className="text-4xl md:text-6xl font-typewriter uppercase leading-tight text-foreground">
                Daily skin maintenance, for Dad
              </h1>
              <p className="mt-6 text-lg font-body text-muted-foreground leading-relaxed max-w-lg">
                Field Oil is a 100% naturally derived daily face oil. No fuss, no fragrance.
                One dropper a day, for skin that takes sun, salt, wind, and time.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/product" className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background font-typewriter text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                  Shop Field Oil
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Link to="/ingredients" className="inline-flex items-center justify-center px-6 py-3 border border-foreground text-foreground font-typewriter text-sm uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors">
                  What's in it
                </Link>
              </div>
            </div>
            <div className="order-first lg:order-last">
              <img src={fieldOilImage} alt="Field Oil bottle" className="w-full border border-border" />
            </div>
          </div>
        </div>
      </section>

      {/* Why it's a good gift */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-typewriter uppercase mb-8">Why it makes a good gift</h2>
          <ul className="space-y-4 text-[17px] font-body text-muted-foreground leading-relaxed">
            {[
              "Practical. One dropper a day, morning or night.",
              "One 30ml bottle lasts about three months.",
              "100% naturally derived, zero fragrance, zero synthetics. Made in Australia.",
              "Simple. One dropper to damp skin, morning or night. Nothing to learn.",
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-1.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timing + how to gift */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-typewriter uppercase mb-6">Order now, sorted for the 6th</h2>
          <p className="text-[17px] font-body text-muted-foreground leading-relaxed mb-4">
            Order any time. The first bottles ship from <strong className="text-foreground">18 August</strong>,
            so it's with him in good time for Father's Day, <strong className="text-foreground">Sunday 6 September</strong>.
          </p>
          <p className="text-[17px] font-body text-muted-foreground leading-relaxed">
            Sending it straight to him? Just enter his address at checkout. Free delivery within Australia.
          </p>
        </div>
      </section>

      {/* Bigger gift: the bundle */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-typewriter uppercase mb-6">Want to go bigger?</h2>
          <p className="text-[17px] font-body text-muted-foreground leading-relaxed mb-8">
            The 12-month supply is four bottles for the price of three, shipped on a schedule you choose.
            A full year of looking after his skin, in one gift.
          </p>
          <Link to="/product" className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background font-typewriter text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors">
            Shop Field Oil
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default FathersDay;
