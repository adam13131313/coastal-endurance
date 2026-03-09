import { createContext, useContext, ReactNode } from "react";

export type Currency = "AUD";

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  AUD: { code: "AUD", symbol: "$", label: "AUD $" },
};

const PRICES: Record<Currency, number> = {
  AUD: 78,
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  unitPrice: number;
  formatPrice: (amount: number) => string;
  config: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const currency: Currency = "AUD";
  const config = CURRENCIES[currency];
  const unitPrice = PRICES[currency];
  const formatPrice = (amount: number) => `${config.symbol}${amount}`;
  const setCurrency = () => {};

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, unitPrice, formatPrice, config }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
};
