import { useState, useEffect } from "react";
import { Check, Minus, Plus, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { fetchProduct, defaultDeliveryDates, firstShipBase, FIRST_SHIP_DATE, type Product as CatalogProduct } from "@/lib/catalog";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";

type PurchaseType = "one-time" | "subscription";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [deliveryDates, setDeliveryDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchProduct("field-oil")
      .then(setProduct)
      .catch((e) => console.error("Failed to fetch product:", e))
      .finally(() => setLoading(false));
  }, []);

  const singleVariant = product?.variants.find((v) => !v.is_bundle);
  const bundleVariant = product?.variants.find((v) => v.is_bundle);

  const price = singleVariant ? singleVariant.price_cents / 100 : 78;
  const currencyCode = product?.currency || "AUD";
  const productImage = product?.image_url || fieldOilImage;
  const bundleBottles = bundleVariant?.bottles ?? 4;
  const subscriptionPrice = bundleVariant ? bundleVariant.price_cents / 100 : price * 3;
  const savingsAmount = price * bundleBottles - subscriptionPrice;
  const currentPrice = purchaseType === "subscription" ? subscriptionPrice : price * quantity;
  const inStock = (product?.stock_quantity ?? 0) > 0;
  const today = new Date().toISOString().slice(0, 10);
  // Orders open now; first shipments go from FIRST_SHIP_DATE (until that passes).
  const firstShip = FIRST_SHIP_DATE > today ? FIRST_SHIP_DATE : today;

  // Seed the bundle delivery schedule once the product loads (first dispatch
  // now, then spaced by the variant's default interval). Customer can edit.
  useEffect(() => {
    const b = product?.variants.find((v) => v.is_bundle);
    if (b) setDeliveryDates(defaultDeliveryDates(b.deliveries_count, b.default_interval_months, firstShipBase()));
  }, [product]);

  const updateDeliveryDate = (index: number, value: string) => {
    setDeliveryDates((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (purchaseType === "subscription") {
      if (!bundleVariant) {
        toast.error("This option isn't available right now.");
        return;
      }
      addItem({
        variantId: bundleVariant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: bundleVariant.label,
        variantSlug: bundleVariant.slug,
        priceCents: bundleVariant.price_cents,
        bottles: bundleVariant.bottles,
        isBundle: true,
        deliveriesCount: bundleVariant.deliveries_count,
        quantity: 1,
        deliveryDates,
      });
      toast.success("Added 12-month supply to cart");
    } else {
      if (!singleVariant) {
        toast.error("This product isn't available right now.");
        return;
      }
      addItem({
        variantId: singleVariant.id,
        productId: product.id,
        productName: product.name,
        variantLabel: singleVariant.label,
        variantSlug: singleVariant.slug,
        priceCents: singleVariant.price_cents,
        bottles: singleVariant.bottles,
        isBundle: false,
        deliveriesCount: 1,
        quantity,
        deliveryDates: [],
      });
      toast.success(`Added ${quantity} × Field Oil to cart`);
      setQuantity(1);
    }
  };

  return (
    <main className="pt-20" id="top">
      <Helmet>
        <title>Field Oil: Daily Barrier Face Oil | Coastal Endurance</title>
        <meta name="description" content="Field Oil: a naturally derived daily face oil. Rosehip and Hemp actives, Australian-grown Jojoba and Macadamia carriers, no added fragrance. $78 AUD. Made in Australia." />
        <link rel="canonical" href="https://coastalendurance.com/product" />
        <meta property="og:title" content="Field Oil: Daily Barrier Face Oil" />
        <meta property="og:description" content="A naturally derived daily face oil. Rosehip and Hemp actives, Australian-grown carriers, no added fragrance. $78 AUD. Made in Australia." />
        <meta property="og:url" content="https://coastalendurance.com/product" />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Field Oil",
          description: "A daily face oil for healthy skin. Naturally derived: Rosehip and Hemp actives, Australian-grown Jojoba and Macadamia carriers, plus a natural antioxidant system. No added fragrance, zero essential oils. 30ml. Made in Australia.",
          image: "https://coastalendurance.com/og-image.png",
          brand: { "@type": "Brand", name: "Coastal Endurance" },
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: currencyCode,
            priceValidUntil: "2026-12-31",
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: "https://coastalendurance.com/product",
          },
          countryOfOrigin: { "@type": "Country", name: "Australia" },
        })}</script>
      </Helmet>

      {/* Header Banner */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-4">
            100% NATURALLY DERIVED
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-typewriter uppercase">
            FIELD OIL
          </h1>
          <p className="mt-6 text-[17px] font-body text-muted-foreground leading-relaxed text-left">
            100% naturally derived. Every ingredient has a job: actives, carriers, antioxidants.
            No synthetics, no fragrance. Made with Australian-grown oils.
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
              {FIRST_SHIP_DATE > today && (
                <p className="mt-2 font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
                  Available now · First bottles ship from 10 August 2026
                </p>
              )}

              <p className="mt-6 font-body text-muted-foreground leading-relaxed text-[17px]">
                A medium-weight daily oil that supports and maintains your skin barrier.
                Formulated for those who face sun, wind, salt, and sweat, every day.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "30ml, approximately 3 months of daily use",
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
                        Single bottle, ${price.toFixed(2)} {currencyCode}
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

                {/* Bundle Card */}
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
                        {bundleBottles} bottles, shipped on your schedule (default every 3 months)
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
                      {bundleBottles} bottles for the price of 3, save ${savingsAmount.toFixed(2)}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                     {[
                      "Free delivery within Australia",
                      "Pay once, no recurring charges",
                      "Choose when each bottle ships",
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm font-body">
                        <Check className="w-4 h-4 text-foreground flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {purchaseType === "subscription" && deliveryDates.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        DELIVERY SCHEDULE
                      </p>
                      <p className="text-sm font-body text-muted-foreground mb-4">
                        We default to one bottle every 3 months. Adjust any date to suit you.
                        Your schedule is included in your receipt, and we email tracking each
                        time a bottle ships. Need to change a date later? Just get in touch.
                      </p>
                      <div className="space-y-3">
                        {deliveryDates.map((date, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm font-body text-muted-foreground w-20 shrink-0">Bottle {i + 1}</span>
                            <input
                              type="date"
                              value={date}
                              min={firstShip}
                              onChange={(e) => updateDeliveryDate(i, e.target.value)}
                              className="flex-1 px-3 py-2 border border-border bg-background text-sm font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={loading || !inStock}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : !inStock ? (
                    "SOLD OUT"
                  ) : (
                    `ADD TO CART $${currentPrice.toFixed(2)} ${currencyCode}`
                  )}
                </button>
              </div>

              {/* How to Use */}
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="font-typewriter text-sm uppercase tracking-widest mb-4">
                  HOW TO USE
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed text-[17px]">
                  Apply 3–4 drops to clean, damp skin once daily.
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
                description: "Supports the skin barrier against environmental stress.",
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
                  { label: "Scent", value: "Natural plant oil aroma (grassy, nutty, earthy), dissipates quickly" },
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
                  { label: "Packaging", value: "Amber glass bottle with dropper. The glass blocks UV; the dropper gives precise, mess-free application and the same dose every time." },
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
