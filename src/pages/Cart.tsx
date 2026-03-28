import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ExternalLink, Loader2, User, LogIn } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl } = useCartStore();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingIn, setSigningIn] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (provider: "google" | "apple") => {
    setSigningIn(provider);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/cart",
    });
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      setSigningIn(null);
    }
  };
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  if (items.length === 0) {
    return (
      <main className="pt-20">
        <section className="section-padding">
          <div className="container-narrow text-center">
            <h1 className="text-4xl md:text-5xl font-display">Your Cart</h1>
            <p className="mt-6 text-muted-foreground">Your cart is empty.</p>
            <Link to="/product" className="btn-primary mt-8 inline-flex">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Continue Shopping
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
          <h1 className="text-4xl md:text-5xl font-display text-center mb-12">
            Your Cart
          </h1>

          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-6 pb-6 border-b border-border">
                <div className="w-24 h-24 bg-muted flex-shrink-0 overflow-hidden">
                  {item.product.node.images?.edges?.[0]?.node && (
                    <img
                      src={item.product.node.images.edges[0].node.url}
                      alt={item.product.node.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-lg">{item.product.node.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' · ')}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-2 hover:bg-muted transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm">
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

                    <p className="font-medium">
                      ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)} <span className="text-sm text-muted-foreground">{item.price.currencyCode}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex justify-between items-center text-lg">
              <span>Subtotal</span>
              <span className="font-display text-2xl">${totalPrice.toFixed(2)} {items[0]?.price.currencyCode}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Free postage within Australia. International shipping calculated at checkout.
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleCheckout}
                disabled={isLoading || isSyncing}
                className="btn-primary w-full flex items-center justify-center"
              >
                {isLoading || isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Checkout
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>
              <Link
                to="/product"
                className="btn-outline w-full flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Cart;
