import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useCartStore } from "@/stores/cartStore";

const CheckoutSuccess = () => {
  const clearCart = useCartStore((s) => s.clearCart);
  // null = unknown (show the general message); true/false = bundle or not.
  const [boughtBundle, setBoughtBundle] = useState<boolean | null>(null);

  // Payment succeeded (the order is recorded server-side by the Stripe webhook);
  // clear the local cart and read what was just bought so we can tailor the message.
  useEffect(() => {
    clearCart();
    try {
      const raw = localStorage.getItem("ce-last-purchase");
      if (raw) {
        setBoughtBundle(!!JSON.parse(raw)?.bundle);
        localStorage.removeItem("ce-last-purchase");
      }
    } catch { /* ignore */ }
  }, [clearCart]);

  return (
    <main className="pt-20">
      <Helmet>
        <title>Order confirmed | Coastal Endurance</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="section-padding">
        <div className="container-narrow text-center">
          <div className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-typewriter uppercase">Thank you</h1>
          <p className="mt-6 font-body text-muted-foreground text-[17px] leading-relaxed">
            {boughtBundle
              ? "Your order is confirmed and we've emailed your receipt, including the delivery schedule for your 12-month supply. We'll email tracking each time a bottle ships. To change a delivery date, just get in touch."
              : "Your order is confirmed and we've emailed your receipt. We'll email you when it ships."}
          </p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            BACK TO HOME
          </Link>
        </div>
      </section>
    </main>
  );
};

export default CheckoutSuccess;
