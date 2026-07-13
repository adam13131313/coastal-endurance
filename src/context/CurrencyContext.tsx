import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useCartStore } from "@/stores/cartStore";

export type Currency = "AUD" | "GBP";

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  AUD: { code: "AUD", symbol: "$", label: "AUD $" },
  GBP: { code: "GBP", symbol: "£", label: "GBP £" },
};

const STORAGE_KEY = "ce-currency";

// Default currency from the visitor's locale/timezone (a privacy-friendly hint; no
// IP lookup). UK → GBP, everyone else → AUD. The manual switcher overrides this.
function detectCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "AUD" || stored === "GBP") return stored;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London") return "GBP";
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region === "GB") return "GBP";
  } catch { /* ignore */ }
  return "AUD";
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (cents: number) => string;
  config: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  // Resolve synchronously (client-only SPA) so the cart isn't wrongly reconciled
  // against a placeholder default on first render.
  const [currency, setCurrencyState] = useState<Currency>(() => detectCurrency());

  // Keep the cart's currency in sync; a mismatch (currency switch, or a stale cart
  // persisted from a prior session/before this feature) clears the cart.
  useEffect(() => { useCartStore.getState().reconcileCurrency(currency); }, [currency]);

  const setCurrency = (c: Currency) => {
    if (c === currency) return;
    try { localStorage.setItem(STORAGE_KEY, c); } catch { /* ignore */ }
    setCurrencyState(c);
  };

  const config = CURRENCIES[currency];
  const format = (cents: number) => `${config.symbol}${(cents / 100).toFixed(2)}`;

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, config }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
};
