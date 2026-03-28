import { useState } from "react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: formData.name,
      email: formData.email,
      message: formData.message,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("Message sent. We'll be in touch.");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    const { error } = await supabase.from("newsletter_signups").insert({
      email: newsletterEmail,
      source: "contact",
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
    <main className="pt-20">
      <Helmet>
        <title>Contact Coastal Endurance — Questions, Feedback & Wholesale | Australia</title>
        <meta name="description" content="Get in touch with Coastal Endurance. Questions about Field Oil, wholesale inquiries, or feedback. We respond within 24-48 hours." />
        <link rel="canonical" href="https://coastalendurance.com/contact" />
      </Helmet>

      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-typewriter uppercase">
            CONTACT
          </h1>
          <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed">
            Questions, feedback, or wholesale inquiries. We read everything.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-typewriter uppercase mb-6">GET IN TOUCH</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-body font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-body font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-body font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field resize-none"
                    required
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto disabled:opacity-50">
                  {isSubmitting ? "SENDING..." : "SEND MESSAGE"}
                </button>
              </form>
            </div>

            <div className="space-y-10">
              <div>
                <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  EMAIL
                </h3>
                <a
                  href="mailto:hello@coastalendurance.com"
                  className="text-[17px] font-body hover:text-muted-foreground transition-colors"
                >
                  hello@coastalendurance.com
                </a>
              </div>

              <div>
                <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  RESPONSE TIME
                </h3>
                <p className="font-body text-foreground text-[17px]">
                  We respond within 24-48 hours on business days.
                </p>
              </div>

              <div>
                <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  WHOLESALE
                </h3>
                <p className="font-body text-muted-foreground text-[17px]">
                  For wholesale and retail partnership inquiries, please include your 
                  business name, location, and current product offering in your message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase">
            UPDATES ONLY. NO NOISE.
          </h2>
          <p className="mt-4 text-[17px] font-body text-primary-foreground/70">
            New products, restocks, and nothing else. Unsubscribe anytime.
          </p>
          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="px-8 py-3 bg-primary-foreground text-primary font-typewriter text-sm uppercase tracking-wide hover:bg-primary-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSubscribing ? "..." : "SUBSCRIBE"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Contact;
