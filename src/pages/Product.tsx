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
  const [loading, setLoading] = useState(true);
  const { addItem, isLoading: cartLoading } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle: "field-oil" });
        const product = data?.data?.productByHandle;
        if (product) {
          setShopifyProduct({ node: product });
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, []);

  const variant = shopifyProduct?.node.variants.edges[0]?.node;
  const price = variant ? parseFloat(variant.price.amount) : 78;
  const currencyCode = variant?.price.currencyCode || "AUD";
  const productImage = shopifyProduct?.node.images?.edges?.[0]?.node?.url || fieldOilImage;

  const handleAddToCart = async () => {
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
                  src={productImage}
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
                ${price.toFixed(2)} <span className="text-sm text-muted-foreground">{currencyCode}</span>
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

              {/* Quantity & Add to Cart */}
              <div className="mt-10 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 py-2 min-w-[2.5rem] text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {cartLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Add to Cart — $${(price * quantity).toFixed(2)} ${currencyCode}`
                  )}
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
