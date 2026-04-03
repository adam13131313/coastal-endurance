import { lazy, Suspense, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

const CartDrawer = lazy(() =>
  import("@/components/CartDrawer").then((module) => ({ default: module.CartDrawer }))
);

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { name: "SHOP", path: "/product" },
    { name: "INGREDIENTS", path: "/ingredients" },
    { name: "ABOUT", path: "/about" },
    { name: "CONTACT", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-8 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm">
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
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
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
