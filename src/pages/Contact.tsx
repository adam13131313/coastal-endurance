import { useState } from "react";
import { toast } from "sonner";
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
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            Contact
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Questions, feedback, or wholesale inquiries. We read everything.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-display mb-6">Get in Touch</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
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
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
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
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
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
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-10">
              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
                  Email
                </h3>
                <a
                  href="mailto:hello@coastalendurance.co"
                  className="text-lg hover:text-muted-foreground transition-colors"
                >
                  hello@coastalendurance.co
                </a>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
                  Response Time
                </h3>
                <p className="text-foreground">
                  We respond within 24-48 hours on business days.
                </p>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
                  Wholesale
                </h3>
                <p className="text-muted-foreground">
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
        <div className="container-narrow text-center">
          <h2 className="text-3xl md:text-4xl font-display">
            Updates only. No noise.
          </h2>
          <p className="mt-4 text-primary-foreground/70">
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
              className="px-8 py-3 bg-primary-foreground text-primary text-sm font-medium uppercase tracking-wide hover:bg-primary-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSubscribing ? "..." : "Subscribe"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Contact;