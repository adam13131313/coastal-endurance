import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, ShoppingBag } from "lucide-react";
import { useCurrency, CURRENCIES, type Currency } from "@/context/CurrencyContext";

const CartDrawer = lazy(() =>
  import("@/components/CartDrawer").then((module) => ({ default: module.CartDrawer }))
);

const navLinks = [
  { name: "SHOP", path: "/product" },
  { name: "INGREDIENTS", path: "/ingredients" },
  { name: "FIELD NOTES", path: "/field-notes" },
  { name: "ABOUT", path: "/about" },
  { name: "CONTACT", path: "/contact" },
];

// Currency switcher (AUD / GBP). Defaults by locale; overrides persist. Switching
// clears the cart so a single order is never mixed-currency.
const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      aria-label="Currency"
      className="text-xs font-typewriter uppercase tracking-wider bg-transparent border border-border px-2 py-1 rounded-none focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
    >
      {Object.values(CURRENCIES).map((c) => (
        <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>
      ))}
    </select>
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ avatar_url?: string } | null>(null);
  const location = useLocation();

  // Defer auth check so it doesn't block first paint
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        setUser(session?.user ? { avatar_url: session.user.user_metadata?.avatar_url } : null);
      }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
        setUser(s?.user ? { avatar_url: s.user.user_metadata?.avatar_url } : null);
      });
      if (cancelled) subscription.unsubscribe();
      else {
        // Store cleanup ref
        (init as any)._unsub = () => subscription.unsubscribe();
      }
    };

    // Use requestIdleCallback if available, else setTimeout
    const id = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(() => init())
      : setTimeout(() => init(), 50);

    return () => {
      cancelled = true;
      typeof requestIdleCallback !== "undefined"
        ? cancelIdleCallback(id as number)
        : clearTimeout(id as number);
      (init as any)._unsub?.();
    };
  }, []);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="font-typewriter text-sm tracking-widest uppercase">
            Coastal Endurance
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-typewriter tracking-wider transition-colors link-underline ${
                  isActive(link.path)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <Suspense
              fallback={
                <button
                  type="button"
                  disabled
                  aria-label="Cart"
                  className="relative p-2 text-muted-foreground/60"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              }
            >
              <CartDrawer />
            </Suspense>

            {user ? (
              <Link to="/account" className="p-2 transition-colors hover:text-muted-foreground" aria-label="My Account">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>
            ) : (
              <Link to="/auth" className="p-2 transition-colors hover:text-muted-foreground" aria-label="Sign in">
                <User className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 transition-colors hover:text-muted-foreground"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-typewriter py-2 transition-colors ${
                    isActive(link.path)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
