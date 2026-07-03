import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/catalog";
import { toast } from "sonner";
import snowyMountains from "@/assets/snowy-mountains.jpg";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, updateQuantity, removeItem, checkout, isCheckingOut, fulfillment, setFulfillment } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const handleCheckout = async () => {
    const { error } = await checkout();
    if (error) toast.error(error);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button aria-label="Open cart" className="relative p-2 transition-colors hover:text-muted-foreground">
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full p-0 overflow-hidden border-l border-border">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src={snowyMountains} alt="" className="w-full h-full object-cover opacity-15" />
        </div>
        <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-6">
        <SheetHeader className="flex-shrink-0 mt-2">
          <SheetTitle className="font-display">Your Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-3 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-sm truncate">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                        {item.isBundle && item.deliveryDates.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.deliveryDates.length} shipments · first {item.deliveryDates[0]}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-1">{formatPrice(item.priceCents)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button aria-label="Remove item from cart" onClick={() => removeItem(item.variantId)} className="p-1 text-muted-foreground hover:text-foreground">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {item.isBundle ? (
                          <span className="text-xs text-muted-foreground">Qty 1</span>
                        ) : (
                          <div className="flex items-center border border-border">
                            <button aria-label="Decrease quantity" className="p-1.5 hover:bg-muted transition-colors" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs">{item.quantity}</span>
                            <button aria-label="Increase quantity" className="p-1.5 hover:bg-muted transition-colors" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-xl">{formatPrice(totalCents)} AUD</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Free delivery within Australia. International shipping calculated at checkout.
                </p>
                <div className="flex gap-2">
                  {([
                    { key: "ship", label: "Ship it" },
                    { key: "pickup", label: "Collect in person" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFulfillment(opt.key)}
                      aria-pressed={fulfillment === opt.key}
                      className={`flex-1 text-xs font-body py-2 border transition-colors ${
                        fulfillment === opt.key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {fulfillment === "pickup" && (
                  <p className="text-xs text-muted-foreground">
                    You'll arrange collection with us by email after ordering. No delivery address needed.
                  </p>
                )}
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={items.length === 0 || isCheckingOut}
                >
                  {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : "Checkout"}
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
