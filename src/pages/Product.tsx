import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";

type PurchaseType = "one-time" | "subscription";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const { addToCart } = useCart();
  const { unitPrice, formatPrice, config } = useCurrency();

  const product = {
    id: "field-oil-30ml",
    name: "Field Oil",
    size: "30ml",
    image: fieldOilImage,
  };

  const price = unitPrice;
  const subscriptionPrice = price * 5;
  const savingsAmount = price;
  const currentPrice = purchaseType === "subscription" ? subscriptionPrice : price * quantity;

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      id: purchaseType === "subscription" ? "field-oil-subscription-12m" : product.id,
      name: purchaseType === "subscription" ? "Field Oil — 12 Month Supply" : product.name,
      price: purchaseType === "subscription" ? subscriptionPrice : price,
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
      <Helmet>
        <title>Field Oil — Daily Barrier Face Oil for Outdoor Men | Coastal Endurance</title>
        <meta name="description" content="Field Oil: 7 natural ingredients, 59% active barrier-repair oils, zero fragrance. A daily face oil built for surfers, cyclists, tradies, and outdoor workers. $78 AUD. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/product" />
      </Helmet>
      {/* Header Banner */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            100% Natural Ingredients
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            7 Natural Ingredients. Zero Compromises.
          </h1>
          <p className="mt-6 text-[17px] text-muted-foreground leading-relaxed">
            100% natural. Every ingredient has a job. No synthetics. No filler. 
            59% Australian-grown. Just functional compounds chosen for performance.
          </p>
        </div>
      </section>

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
                Daily Barrier Oil For Your Face
              </span>
              <h2 className="mt-4 text-4xl md:text-5xl font-display">
                Field Oil
              </h2>
              <p className="mt-2 text-2xl font-body">
                {formatPrice(price)} <span className="text-sm text-muted-foreground">{config.code}</span>
              </p>

              <p className="mt-6 text-muted-foreground leading-relaxed text-[17px]">
                A lightweight daily oil that supports and maintains your skin barrier. 
                Formulated for those who face sun, wind, salt, and sweat — every day.
              </p>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {[
                  "30ml — approximately 2 months of daily use",
                  "Fast-absorbing, non-greasy finish",
                  "No fragrance or essential oils",
                  "Free postage within Australia",
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
                        Single bottle — {formatPrice(price)} {config.code}
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

                {/* Subscription Card */}
                <div
                  onClick={() => setPurchaseType("subscription")}
                  className={`relative p-6 border cursor-pointer transition-all ${
                    purchaseType === "subscription"
                      ? "border-ocean-slate ring-2 ring-ocean-slate bg-ocean-slate/5"
                      : "border-border hover:border-ocean-slate/50"
                  }`}
                >
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

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display">{formatPrice(subscriptionPrice)}</span>
                      <span className="text-muted-foreground">{config.code} total</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      6 bottles for the price of 5 — save {formatPrice(savingsAmount)}
                    </p>
                  </div>

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
                    ? `Subscribe — ${formatPrice(subscriptionPrice)} ${config.code}`
                    : `Add to Cart — ${formatPrice(currentPrice)} ${config.code}`
                  }
                </button>
              </div>

              {/* How to Use */}
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-sm uppercase tracking-widest font-medium mb-4">
                  How to Use
                </h3>
                <p className="text-muted-foreground leading-relaxed text-[17px]">
                  Apply 3-4 drops to clean, slightly damp skin. Morning or evening. 
                  Massage into face and neck. That's it. One product. Daily.
                </p>
              </div>

              {/* Suitable For */}
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-sm uppercase tracking-widest font-medium mb-4">
                  Suitable For
                </h3>
                <p className="text-muted-foreground leading-relaxed text-[17px]">
                  Normal, dry, mature, and outdoor-exposed skin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            Who It's For
          </h2>
          <p className="mt-6 text-center text-muted-foreground leading-relaxed text-[17px]">
            Field Oil is built for those who spend real time outside. Surfers, runners, cyclists, 
            builders, professionals who train before or after work. If your skin faces the elements daily, 
            this is your maintenance tool.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            How It Works
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Support",
                description: "Helps maintain essential lipids that sun, wind, and water strip away.",
              },
              {
                title: "Protect",
                description: "Reinforces the skin barrier against environmental stress.",
              },
              {
                title: "Maintain",
                description: "Supports natural barrier function while you rest.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-lg font-display">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-display">{step.title}</h3>
                <p className="mt-2 text-muted-foreground text-[17px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Characteristics & Storage */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl font-display mb-8">Product Characteristics</h2>
              <div className="space-y-4">
                {[
                  { label: "Appearance", value: "Clear to pale amber oil with golden hue" },
                  { label: "Texture", value: "Medium-weight, absorbs in approximately 2 minutes" },
                  { label: "Scent", value: "Natural plant oil aroma (grassy, nutty, earthy) — dissipates quickly" },
                  { label: "Colour", value: "Pale golden yellow" },
                  { label: "Viscosity", value: "Medium (pours easily, not too thick or thin)" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:gap-6 pb-4 border-b border-border last:border-0">
                    <span className="text-sm uppercase tracking-widest text-muted-foreground sm:w-32 flex-shrink-0">{item.label}</span>
                    <span className="text-foreground text-[17px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-display mb-8">Shelf Life & Storage</h2>
              <div className="space-y-4">
                {[
                  { label: "Shelf Life", value: "12–18 months from manufacture date" },
                  { label: "Storage", value: "Below 25°C, away from direct sunlight" },
                  { label: "Packaging", value: "Amber glass bottle (UV protection)" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:gap-6 pb-4 border-b border-border last:border-0">
                    <span className="text-sm uppercase tracking-widest text-muted-foreground sm:w-32 flex-shrink-0">{item.label}</span>
                    <span className="text-foreground text-[17px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
export default Product;
