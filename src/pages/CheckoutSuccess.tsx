import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useCartStore } from "@/stores/cartStore";

const CheckoutSuccess = () => {
  const clearCart = useCartStore((s) => s.clearCart);

  // Payment succeeded (the order is recorded server-side by the Stripe webhook);
  // clear the local cart so it doesn't linger.
  useEffect(() => {
    clearCart();
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
            Your order is confirmed and we've emailed your receipt. If you chose the
            12-month supply, your delivery schedule is locked in too. We'll email you
            when it ships.
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
