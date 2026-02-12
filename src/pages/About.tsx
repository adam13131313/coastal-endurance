import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import coastalImage from "@/assets/coastal-landscape.jpg";

const About = () => {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            About
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The story behind Coastal Endurance. Built from necessity, not opportunity.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <p className="text-xl text-foreground font-display">
              Coastal Endurance started with a simple problem: nothing on the market 
              actually worked for Australian outdoor conditions.
            </p>
            <p>
              Years of surfing, running, and working outside had taken a toll. The 
              combination of intense UV, salt water, wind, and sweat created skin issues 
              that standard products couldn't address. Drugstore brands were too basic. 
              Premium brands were focused on luxury, not performance.
            </p>
            <p>
              The turning point came after researching what actually happens to skin 
              under environmental stress. The damage isn't just surface-level — it's a 
              breakdown of the lipid barrier, the protective layer that keeps moisture 
              in and irritants out. Repair that barrier, and everything else follows.
            </p>
            <p>
              Field Oil was formulated over two years of research and testing. Every 
              ingredient was chosen for a specific function. The result is a product 
              that does what skincare should do: protect and repair, without complexity 
              or compromise.
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

      {/* Values */}
      <section className="section-padding">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center mb-12">
            What Drives Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Function First",
                description: "Every decision is made based on what works, not what sells. Performance is the only metric that matters.",
              },
              {
                title: "Honest Simplicity",
                description: "We don't overcomplicate routines or overpromise results. One product. Daily. That's it.",
              },
              {
                title: "Australian Made",
                description: "Formulated and manufactured in Australia. Sourcing local ingredients where they offer the best performance.",
              },
            ].map((value, index) => (
              <div key={index} className="text-center">
                <h3 className="text-xl font-display">{value.title}</h3>
                <p className="mt-3 text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Looking Forward
          </h2>
          <p className="mt-6 text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
            We're not building a skincare empire. We're building a small collection of 
            products that genuinely work. When we release something new, it will be because 
            we've identified a real problem and developed a genuine solution. Not because 
            we need another revenue stream.
          </p>
          <p className="mt-6 text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
            For now, Field Oil is everything we believe skincare should be. Start there.
          </p>
          <a href="/product#top" className="inline-flex items-center mt-10 text-sm uppercase tracking-wider border-b border-primary-foreground/50 pb-1 hover:border-primary-foreground transition-colors">
            Shop Field Oil
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>
    </main>
  );
};

export default About;