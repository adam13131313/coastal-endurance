import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { formatPrice, config } = useCurrency();
  const [checkingOut, setCheckingOut] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsSignedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      if (!userId && !guestEmail) {
        toast({ title: "Email required", description: "Please enter your email to checkout as a guest.", variant: "destructive" });
        setCheckingOut(false);
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          guest_email: userId ? null : guestEmail,
          total_amount: cartTotal,
          currency: config.code,
          status: "completed",
        })
        .select("id")
        .single();

      if (orderError || !order) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      toast({ title: "Order placed!", description: "Thank you for your purchase." });
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e?.message || "Something went wrong.", variant: "destructive" });
    }
    setCheckingOut(false);
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

          {/* Cart Items */}
          <div className="space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-6 pb-6 border-b border-border"
              >
                {/* Image */}
                <div className="w-24 h-24 bg-muted flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">30ml</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-muted transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-muted transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)} <span className="text-sm text-muted-foreground">{config.code}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex justify-between items-center text-lg">
              <span>Subtotal</span>
              <span className="font-display text-2xl">{formatPrice(cartTotal)} {config.code}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Free postage within Australia. International shipping calculated at checkout.
            </p>

            {!isSignedIn && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5">Email (for order confirmation)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <Link to="/auth" className="underline hover:text-foreground">Sign in</Link> to save your order to your account.
                </p>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full"
              >
                {checkingOut ? "Placing Order..." : "Place Order"}
                {!checkingOut && <ArrowRight className="ml-2 w-4 h-4" />}
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