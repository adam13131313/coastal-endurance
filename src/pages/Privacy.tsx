const Privacy = () => {
  return (
    <main className="pt-20">
      <section className="section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl md:text-5xl font-display mb-8">Privacy Policy</h1>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Coastal Endurance respects your privacy. This policy outlines how we collect, use, and protect your personal information.
            </p>
            <h2 className="text-2xl font-display text-foreground">Information We Collect</h2>
            <p>
              We collect information you provide directly — your name, email address, shipping address, and payment details when you make a purchase or subscribe to our updates.
            </p>
            <h2 className="text-2xl font-display text-foreground">How We Use It</h2>
            <p>
              Your information is used solely to process orders, deliver products, and send updates you've opted into. We don't sell, trade, or share your data with third parties for marketing purposes.
            </p>
            <h2 className="text-2xl font-display text-foreground">Contact</h2>
            <p>
              Questions about your data? Email us at{" "}
              <a href="mailto:hello@coastalendurance.co" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                hello@coastalendurance.co
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Privacy;