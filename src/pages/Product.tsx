import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import fieldOilImage from "@/assets/field-oil-bottle.jpg";
import heroImage from "@/assets/hero-product.jpg";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const product = {
    id: "field-oil-30ml",
    name: "Field Oil",
    price: 68,
    size: "30ml",
    image: fieldOilImage,
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} × Field Oil to cart`);
    setQuantity(1);
  };

  const ingredients = [
    {
      name: "Jojoba Oil",
      benefit: "Mimics skin's natural sebum. Absorbs quickly without residue.",
    },
    {
      name: "Australian Macadamia Oil",
      benefit: "Rich in palmitoleic acid. Restores barrier function.",
    },
    {
      name: "Meadowfoam Seed Oil",
      benefit: "Long-lasting moisture. Prevents transepidermal water loss.",
    },
    {
      name: "Rosehip Oil",
      benefit: "Vitamin A and essential fatty acids. Supports cell turnover.",
    },
    {
      name: "Squalane",
      benefit: "Lightweight lipid. Reinforces the moisture barrier.",
    },
    {
      name: "Vitamin E",
      benefit: "Antioxidant protection. Stabilizes other active ingredients.",
    },
    {
      name: "Kakadu Plum Extract",
      benefit: "World's highest natural vitamin C content. Australian native.",
    },
  ];

  return (
    <main className="pt-20">
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
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={heroImage}
                  alt="Field Oil in natural setting"
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

              {/* Add to Cart */}
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-3 min-w-[3rem] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary flex-1"
                  >
                    Add to Cart — ${product.price * quantity}
                  </button>
                </div>
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

      {/* Key Ingredients */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wide">
          <h2 className="text-3xl md:text-4xl font-display text-center">
            Key Ingredients
          </h2>
          <p className="mt-4 text-center text-primary-foreground/70 max-w-xl mx-auto">
            Every ingredient has a purpose. No fillers. No fragrance. Just performance.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="p-6 border border-primary-foreground/10 hover:border-primary-foreground/30 transition-colors"
              >
                <h3 className="font-medium">{ingredient.name}</h3>
                <p className="mt-2 text-sm text-primary-foreground/70">
                  {ingredient.benefit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Product;