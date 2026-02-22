import { Link } from "react-router-dom";
import { Minus, Plus, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { formatPrice, config } = useCurrency();

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
              Shipping calculated at checkout.
            </p>

            <div className="mt-8 space-y-3">
              <button className="btn-primary w-full">
                Proceed to Checkout
                <ArrowRight className="ml-2 w-4 h-4" />
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