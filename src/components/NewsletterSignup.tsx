import { useState } from "react";
import { toast } from "sonner";

// Newsletter capture → Resend audience via the `subscribe` edge function.
// Includes the honeypot field the function checks. `source` tags where the
// signup came from so we can see which pages build the list.
interface Props {
  source: string;
  heading?: string;
  subtext?: string;
  className?: string;
}

const NewsletterSignup = ({
  source,
  heading = "UPDATES ONLY. NO NOISE.",
  subtext = "New products, restocks, and nothing else.",
  className = "section-padding",
}: Props) => {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("subscribe", {
      body: { email, source, hp },
    });
    setIsSubscribing(false);
    if (error || (data as { error?: string })?.error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("You're subscribed. Updates only.");
    setEmail("");
  };

  return (
    <section className={className}>
      <div className="max-w-[700px] mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-typewriter uppercase">{heading}</h2>
        <p className="mt-4 text-[17px] font-body text-muted-foreground">{subtext}</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <input
            type="email"
            placeholder="Your email"
            aria-label="Email address for newsletter"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field flex-1"
            required
          />
          <button type="submit" disabled={isSubscribing} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {isSubscribing ? "..." : "SUBSCRIBE"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSignup;
