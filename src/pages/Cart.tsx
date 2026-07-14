import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, updateQuantity, removeItem, checkout, isCheckingOut } = useCartStore();
  const { format, config } = useCurrency();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? undefined } : null);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { email: session.user.email ?? undefined } : null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const handleSignIn = async () => {
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/cart" },
    });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      setSigningIn(false);
    }
  };

  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.includes("@")) return;
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: signInEmail.trim(),
      options: { emailRedirectTo: window.location.origin + "/cart" },
    });
    setSigningIn(false);
    if (error) { toast({ title: "Couldn't send the link", description: error.message, variant: "destructive" }); return; }
    setLinkSent(true);
  };

  const handleCheckout = async () => {
    const { error } = await checkout(user?.email);
    if (error) toast({ title: "Checkout failed", description: error, variant: "destructive" });
  };

  if (items.length === 0) {
    return (
      <main className="pt-20">
        <section className="section-padding">
          <div className="container-narrow text-center">
            <h1 className="text-4xl md:text-5xl font-typewriter uppercase">YOUR CART</h1>
            <p className="mt-6 font-body text-muted-foreground">Your cart is empty.</p>
            <Link to="/product" className="btn-primary mt-8 inline-flex">
              <ArrowLeft className="mr-2 w-4 h-4" />
              CONTINUE SHOPPING
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-20">
      <section className="section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl md:text-5xl font-typewriter uppercase text-center mb-12">
            YOUR CART
          </h1>

          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-6 pb-6 border-b border-border">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-typewriter text-lg uppercase">{item.productName}</h3>
                      <p className="text-sm font-body text-muted-foreground">{item.variantLabel}</p>
                      {item.isBundle && item.deliveryDates.length > 0 && (
                        <p className="text-xs font-body text-muted-foreground mt-1">
                          {item.deliveryDates.length} shipments, {item.deliveryDates.join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    {item.isBundle ? (
                      <span className="text-sm font-body text-muted-foreground">Quantity: 1</span>
                    ) : (
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-2 hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-body">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-2 hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <p className="font-body font-medium">
                      {format(item.priceCents * item.quantity)} <span className="text-sm text-muted-foreground">{config.code}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex justify-between items-center text-lg">
              <span className="font-body">Subtotal</span>
              <span className="font-typewriter text-2xl">{format(totalCents)} {config.code}</span>
            </div>
            <p className="mt-2 text-sm font-body text-muted-foreground">
              Free standard shipping in Australia and the UK. Express available at checkout.
            </p>

            {authChecked && !user && (
              <div className="mt-6 p-4 border border-border bg-muted/30 space-y-3">
                <p className="text-sm font-body font-medium">Sign in to track your order and save your details</p>
                <button
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border text-sm font-body transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {signingIn ? "Signing in..." : "Continue with Google"}
                </button>

                {linkSent ? (
                  <p className="text-xs font-body text-muted-foreground">Check your inbox — we've emailed a sign-in link to <strong>{signInEmail}</strong>.</p>
                ) : (
                  <form onSubmit={handleEmailLink} className="flex gap-2">
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="or email me a link"
                      aria-label="Email address for sign-in link"
                      className="flex-1 px-3 py-2 border border-border bg-background text-sm font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                    <button type="submit" disabled={signingIn} className="btn-outline text-xs px-3 py-2 disabled:opacity-50 whitespace-nowrap">Send</button>
                  </form>
                )}
                <p className="text-xs font-body text-muted-foreground">Optional — you can also just check out as a guest.</p>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="btn-primary w-full flex items-center justify-center"
              >
                {isCheckingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    CHECKOUT
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
              <Link
                to="/product"
                className="btn-outline w-full flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Cart;
