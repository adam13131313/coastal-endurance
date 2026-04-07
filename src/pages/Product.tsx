import { useState, useEffect } from "react";
import { Check, Minus, Plus, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { storefrontApiRequest, STOREFRONT_PRODUCT_BY_HANDLE_QUERY, type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";

type PurchaseType = "one-time" | "subscription";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const [shopifyProduct, setShopifyProduct] = useState<ShopifyProduct | null>(null);
  const [subscriptionProduct, setSubscriptionProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, isLoading: cartLoading } = useCartStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [singleData, subData] = await Promise.all([
          storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle: "field-oil" }),
          storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle: "field-oil-12-month-supply" }),
        ]);
        if (singleData?.data?.productByHandle) {
          setShopifyProduct({ node: singleData.data.productByHandle });
        }
        if (subData?.data?.productByHandle) {
          setSubscriptionProduct({ node: subData.data.productByHandle });
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const variant = shopifyProduct?.node.variants.edges[0]?.node;
  const subVariant = subscriptionProduct?.node.variants.edges[0]?.node;
  const price = variant ? parseFloat(variant.price.amount) : 85;
  const currencyCode = variant?.price.currencyCode || "AUD";
  const productImage = shopifyProduct?.node.images?.edges?.[0]?.node?.url || fieldOilImage;
  const subscriptionPrice = subVariant ? parseFloat(subVariant.price.amount) : price * 3;
  const savingsAmount = (price * 4) - subscriptionPrice;
  const currentPrice = purchaseType === "subscription" ? subscriptionPrice : price * quantity;

  const handleAddToCart = async () => {
    if (purchaseType === "subscription") {
      if (!subscriptionProduct || !subVariant) {
        toast.error("Subscription product not available");
        return;
      }
      await addItem({
        product: subscriptionProduct,
        variantId: subVariant.id,
        variantTitle: subVariant.title,
        price: subVariant.price,
        quantity: 1,
        selectedOptions: subVariant.selectedOptions || [],
      });
      toast.success("Added 12-month subscription to cart");
    } else {
      if (!shopifyProduct || !variant) {
        toast.error("Product not available");
        return;
      }
      await addItem({
        product: shopifyProduct,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity,
        selectedOptions: variant.selectedOptions || [],
      });
      toast.success(`Added ${quantity} × Field Oil to cart`);
      setQuantity(1);
    }
  };

  return (
    <main className="pt-20" id="top">
      <Helmet>
        <title>Field Oil — Daily Barrier Face Oil for Outdoor Men | Coastal Endurance</title>
        <meta name="description" content="Field Oil: 7 natural ingredients, 59% active barrier-repair oils, zero fragrance. A daily face oil built for surfers, cyclists, tradies, and outdoor workers. $68 AUD. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/product" />
      </Helmet>

      {/* Header Banner */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-4">
            100% NATURAL INGREDIENTS
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-typewriter uppercase">
            7 NATURAL INGREDIENTS. ZERO COMPROMISES.
          </h1>
          <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed text-left">
            100% natural. Every ingredient has a job. No synthetics. No filler. 
            59% Australian-grown. Just functional compounds chosen for performance.
          </p>
        </div>
      </section>

      {/* Product Hero */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-4">
              <div className="aspect-square bg-muted overflow-hidden">
                <img src={productImage} alt="Field Oil 30ml bottle" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="lg:sticky lg:top-32 lg:self-start">
              <span className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
                DAILY BARRIER OIL FOR YOUR FACE
              </span>
              <h2 className="mt-4 text-4xl md:text-5xl font-typewriter uppercase">
                FIELD OIL
              </h2>
              <p className="mt-2 text-2xl font-body">
                ${price.toFixed(2)} <span className="text-sm text-muted-foreground">{currencyCode}</span>
              </p>

              <p className="mt-6 font-body text-muted-foreground leading-relaxed text-[17px]">
                A medium-weight daily oil that supports and maintains your skin barrier. 
                Formulated for those who face sun, wind, salt, and sweat — every day.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "30ml — approximately 3 months of daily use",
                  "Fast-absorbing, non-greasy finish",
                  "No fragrance or essential oils",
                  "Free delivery within Australia",
                  "International shipping costs apply outside Australia",
                  "Made in Australia",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm font-body">
                    <Check className="w-4 h-4 text-foreground flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Purchase Options */}
              <div className="mt-10 space-y-6">
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
                      <span className="block text-base font-body font-medium">One-Time Purchase</span>
                      <span className="block text-sm font-body text-muted-foreground mt-1">
                        Single bottle — ${price.toFixed(2)} {currencyCode}
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

                  {purchaseType === "one-time" && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      <span className="text-sm font-body text-muted-foreground">Quantity</span>
                      <div className="flex items-center border border-border">
                        <button
                          onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                          className="p-2 hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-body font-medium">
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
                      ? "border-foreground ring-2 ring-foreground bg-muted/30"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <div className="absolute -top-3 left-6 bg-foreground text-background text-xs font-typewriter px-3 py-1 uppercase tracking-wider">
                    BEST VALUE
                  </div>

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex-1">
                       <span className="block text-base font-body font-medium">12-Month Supply</span>
                      <span className="block text-sm font-body text-muted-foreground mt-1">
                        4 bottles delivered every 3 months
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      purchaseType === "subscription" ? "border-foreground" : "border-muted-foreground/40"
                    }`}>
                      {purchaseType === "subscription" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-body font-medium">${subscriptionPrice.toFixed(2)} {currencyCode} total</span>
                    </div>
                     <p className="text-sm font-body text-muted-foreground mt-1">
                      4 bottles for the price of 3 — save ${savingsAmount.toFixed(2)}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                     {[
                      "Free delivery within Australia",
                      "Delivered every 3 months",
                      "Cancel anytime — no lock-in",
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm font-body">
                        <Check className="w-4 h-4 text-foreground flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {cartLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : purchaseType === "subscription" ? (
                    `SUBSCRIBE — $${subscriptionPrice.toFixed(2)} ${currencyCode}`
                  ) : (
                    `ADD TO CART — $${currentPrice.toFixed(2)} ${currencyCode}`
                  )}
                </button>
              </div>

              {/* How to Use */}
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="font-typewriter text-sm uppercase tracking-widest mb-4">
                  HOW TO USE
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed text-[17px]">
                  Apply ≈0.4ml to clean, slightly damp skin. Morning or evening. 
                  Massage into face and neck. That's it. One product. Daily.
                </p>
              </div>

              {/* Suitable For */}
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="font-typewriter text-sm uppercase tracking-widest mb-4">
                  SUITABLE FOR
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed text-[17px]">
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
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase text-center">
            WHO IT'S FOR
          </h2>
          <p className="mt-6 font-body text-muted-foreground leading-relaxed text-[17px] text-left">
            Field Oil is built for those who spend real time outside. Surfers, runners, cyclists, 
            builders, professionals who train before or after work. If your skin faces the elements daily, 
            this is your maintenance tool.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-typewriter uppercase text-center">
            HOW IT WORKS
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                title: "SUPPORT",
                description: "Helps maintain essential lipids that sun, wind, and water strip away.",
              },
              {
                title: "PROTECT",
                description: "Reinforces the skin barrier against environmental stress.",
              },
              {
                title: "MAINTAIN",
                description: "Supports natural barrier function while you rest.",
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 bg-muted text-lg font-typewriter">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-typewriter uppercase">{step.title}</h3>
                <p className="mt-3 font-body text-muted-foreground text-[17px] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Characteristics & Storage */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <h2 className="text-2xl font-typewriter uppercase mb-8">PRODUCT CHARACTERISTICS</h2>
              <div className="space-y-4">
                {[
                  { label: "Appearance", value: "Clear to pale amber oil with golden hue" },
                  { label: "Texture", value: "Medium-weight, absorbs in approximately 2 minutes" },
                  { label: "Scent", value: "Natural plant oil aroma (grassy, nutty, earthy) — dissipates quickly" },
                  { label: "Colour", value: "Pale golden yellow" },
                  { label: "Viscosity", value: "Medium (pours easily, not too thick or thin)" },
                ].map((item, index) => (
                  <div key={index} className="pb-4 border-b border-border last:border-0">
                    <span className="block font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-1">{item.label}</span>
                    <span className="font-body text-foreground text-[17px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-typewriter uppercase mb-8">SHELF LIFE & STORAGE</h2>
              <div className="space-y-4">
                {[
                  { label: "Shelf Life", value: "12–18 months from manufacture date" },
                  { label: "Storage", value: "Below 25°C, away from direct sunlight" },
                  { label: "Packaging", value: "Amber glass bottle (UV protection)" },
                ].map((item, index) => (
                  <div key={index} className="pb-4 border-b border-border last:border-0">
                    <span className="block font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-1">{item.label}</span>
                    <span className="font-body text-foreground text-[17px]">{item.value}</span>
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
