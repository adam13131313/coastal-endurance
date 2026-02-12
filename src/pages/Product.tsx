import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";
import heroImage from "@/assets/hero-product.jpg";

type PurchaseType = "one-time" | "subscription";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const { addToCart } = useCart();

  const product = {
    id: "field-oil-30ml",
    name: "Field Oil",
    price: 68,
    size: "30ml",
    image: fieldOilImage,
  };

  // 12 months subscription: 6 bottles for the price of 5
  const subscriptionPrice = product.price * 5; // $340 total
  const savingsAmount = product.price; // Save $68
  const currentPrice = purchaseType === "subscription" ? subscriptionPrice : product.price * quantity;

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      id: purchaseType === "subscription" ? "field-oil-subscription-12m" : product.id,
      name: purchaseType === "subscription" ? "Field Oil — 12 Month Supply" : product.name,
      price: purchaseType === "subscription" ? subscriptionPrice : product.price,
    };
    
    const itemCount = purchaseType === "subscription" ? 1 : quantity;
    for (let i = 0; i < itemCount; i++) {
      addToCart(cartItem);
    }
    
    const message = purchaseType === "subscription" 
      ? "Added 12-month subscription to cart" 
      : `Added ${quantity} × Field Oil to cart`;
    toast.success(message);
    setQuantity(1);
  };


  return (
    <main className="pt-20" id="top">
      {/* Product Hero */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={fieldOilImage}
                  alt="Field Oil 30ml bottle"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <span className="text-sm uppercase tracking-widest text-muted-foreground">
                Daily Recovery Oil
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl font-display">
                Field Oil
              </h1>
              <p className="mt-2 text-2xl font-body">
                ${product.price} <span className="text-sm text-muted-foreground">AUD</span>
              </p>

              <p className="mt-6 text-muted-foreground leading-relaxed">
                A lightweight daily oil that repairs and protects your skin barrier. 
                Formulated for men who face sun, wind, salt, and sweat — every day.
              </p>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {[
                  "30ml — approximately 2 months of daily use",
                  "Fast-absorbing, non-greasy finish",
                  "No fragrance or essential oils",
                  "Made in Australia",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-ocean-slate flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Purchase Options */}
              <div className="mt-10 space-y-6">
                {/* One-Time Purchase Option */}
                <div
                  onClick={() => setPurchaseType("one-time")}
                  className={`p-5 border cursor-pointer transition-all ${
                    purchaseType === "one-time"
                      ? "border-foreground ring-1 ring-foreground"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-base font-medium">One-Time Purchase</span>
                      <span className="block text-sm text-muted-foreground mt-1">
                        Single bottle — ${product.price} AUD
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      purchaseType === "one-time" ? "border-foreground" : "border-muted-foreground/40"
                    }`}>
                      {purchaseType === "one-time" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {purchaseType === "one-time" && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">Quantity</span>
                      <div className="flex items-center border border-border">
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                          className="p-2 hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                          className="p-2 hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscription Card - Premium Design */}
                <div
                  onClick={() => setPurchaseType("subscription")}
                  className={`relative p-6 border cursor-pointer transition-all ${
                    purchaseType === "subscription"
                      ? "border-ocean-slate ring-2 ring-ocean-slate bg-ocean-slate/5"
                      : "border-border hover:border-ocean-slate/50"
                  }`}
                >
                  {/* Best Value Badge */}
                  <div className="absolute -top-3 left-6 bg-ocean-slate text-background text-xs font-medium px-3 py-1 uppercase tracking-wider">
                    Best Value
                  </div>

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex-1">
                      <h4 className="text-lg font-display">12-Month Subscription</h4>
                      <p className="text-base font-medium mt-1">
                        One bottle delivered every 2 months
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      purchaseType === "subscription" ? "border-ocean-slate" : "border-muted-foreground/40"
                    }`}>
                      {purchaseType === "subscription" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-ocean-slate" />
                      )}
                    </div>
                  </div>

                  {/* Price Presentation */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display">${subscriptionPrice}</span>
                      <span className="text-muted-foreground">AUD total</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      6 bottles for the price of 5 — save ${savingsAmount}
                    </p>
                  </div>

                  {/* Benefits List */}
                  <ul className="mt-5 space-y-2.5">
                    {[
                      "Free shipping on every delivery",
                      "Delivered every 2 months",
                      "Cancel anytime — no lock-in",
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-ocean-slate flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full"
                >
                  {purchaseType === "subscription" 
                    ? `Subscribe — $${subscriptionPrice} AUD`
                    : `Add to Cart — $${currentPrice} AUD`
                  }
                </button>
              </div>

              {/* How to Use */}
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-sm uppercase tracking-widest font-medium mb-4">
                  How to Use
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Apply 3-4 drops to clean, slightly damp skin. Morning or evening. 
                  Massage into face and neck. That's it. One product. Daily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section-padding bg-secondary">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            Who It's For
          </h2>
          <p className="mt-6 text-center text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Field Oil is built for men who spend real time outside. Surfers, runners, cyclists, 
            builders, professionals who train before or after work. If your skin faces the elements daily, 
            this is your recovery tool.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-narrow">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            How It Works
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Rebuild",
                description: "Replenishes essential lipids that sun, wind, and water strip away.",
              },
              {
                title: "Protect",
                description: "Reinforces the skin barrier against environmental stress.",
              },
              {
                title: "Recover",
                description: "Supports natural repair processes while you rest.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-lg font-display">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-display">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
};

export default Product;