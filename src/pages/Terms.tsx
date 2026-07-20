import { Helmet } from "react-helmet-async";

const Terms = () => {
  return (
    <main className="pt-20">
      <Helmet>
        <title>Terms & Conditions | Coastal Endurance</title>
        <meta name="description" content="Coastal Endurance terms and conditions. Products, orders, shipping, returns, and usage terms." />
        <link rel="canonical" href="https://coastalendurance.com/terms" />
      </Helmet>
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-display mb-8">Terms & Conditions</h1>
          <div className="space-y-6 text-muted-foreground leading-relaxed text-[17px]">
            <p>
              By using the Coastal Endurance website and purchasing our products, you agree to the following terms.
            </p>
            <h2 className="text-2xl font-display text-foreground">Products</h2>
            <p>
              Field Oil is a cosmetic product for external use only. All claims relate to cosmetic benefits. This product does not treat, cure, or prevent any medical conditions. If irritation occurs, discontinue use.
            </p>
            <h2 className="text-2xl font-display text-foreground">Orders & Shipping</h2>
            <p>
              Orders are processed within 1-3 business days. Free standard shipping in Australia and the UK; express is 9.95 in your selected currency ($9.95 AUD, £9.95 GBP, or $9.95 USD). Other countries coming soon. We reserve the right to limit quantities.
            </p>
            <h2 className="text-2xl font-display text-foreground">Returns</h2>
            <p>
              If you're not satisfied, contact us within 30 days of delivery. Products must be unused and in original packaging for a full refund.
            </p>
            <h2 className="text-2xl font-display text-foreground">Contact</h2>
            <p>
              Questions? Email{" "}
              <a href="mailto:hello@coastalendurance.com" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Terms;
