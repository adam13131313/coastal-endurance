import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";

// A line in the client-side cart. Pricing/stock are re-validated server-side at
// checkout (the create-checkout edge function reads authoritative prices from the DB).
export interface CartLine {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  variantSlug: string;
  priceCents: number;
  bottles: number;
  isBundle: boolean;
  deliveriesCount: number;
  quantity: number;
  // For a bundle: chosen shipment dates (yyyy-mm-dd), length === deliveriesCount.
  // Empty for a single-shipment item.
  deliveryDates: string[];
}

export type FulfillmentMethod = "ship" | "pickup";

interface CartStore {
  items: CartLine[];
  isCheckingOut: boolean;
  fulfillment: FulfillmentMethod;
  setFulfillment: (method: FulfillmentMethod) => void;
  addItem: (line: CartLine) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  setDeliveryDates: (variantId: string, dates: string[]) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotalCents: () => number;
  checkout: (email?: string) => Promise<{ error?: string }>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCheckingOut: false,
      fulfillment: "ship",

      setFulfillment: (method) => set({ fulfillment: method }),

      addItem: (line) => {
        const items = get().items;
        const existing = items.find((i) => i.variantId === line.variantId);
        // Bundles carry a delivery schedule, so keep them as distinct lines
        // rather than merging quantities.
        if (existing && !line.isBundle) {
          set({
            items: items.map((i) =>
              i.variantId === line.variantId
                ? { ...i, quantity: i.quantity + line.quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...items, line] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },

      setDeliveryDates: (variantId, dates) => {
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, deliveryDates: dates } : i,
          ),
        });
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalCents: () =>
        get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),

      checkout: async (email) => {
        const { items } = get();
        if (items.length === 0) return { error: "Your cart is empty." };

        set({ isCheckingOut: true });
        try {
          const { data, error } = await supabase.functions.invoke(
            "create-checkout",
            {
              body: {
                email,
                fulfillment: get().fulfillment,
                currency: (typeof localStorage !== "undefined" && localStorage.getItem("ce-currency")) || "AUD",
                attribution: getAttribution(),
                items: items.map((i) => ({
                  variantId: i.variantId,
                  quantity: i.quantity,
                  deliveryDates: i.deliveryDates,
                })),
              },
            },
          );

          if (error) return { error: error.message ?? "Checkout failed." };
          if (!data?.url) return { error: data?.error ?? "Checkout failed." };

          // Stash what was bought so the success page can tailor its message
          // (read + cleared there). No PII, just whether a bundle was included.
          try {
            const hasBundle = items.some((i) => i.isBundle || i.deliveriesCount > 1);
            localStorage.setItem("ce-last-purchase", JSON.stringify({ bundle: hasBundle, pickup: get().fulfillment === "pickup" }));
          } catch { /* localStorage unavailable */ }

          window.location.href = data.url as string;
          return {};
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Checkout failed." };
        } finally {
          set({ isCheckingOut: false });
        }
      },
    }),
    {
      name: "coastal-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
