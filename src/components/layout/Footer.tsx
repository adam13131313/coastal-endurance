import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-wide py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-2xl font-medium tracking-tight">
              Coastal Endurance
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 max-w-sm leading-relaxed">
              Built for sun, salt, wind, and time. Performance-driven skincare designed for life under the Australian sky.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4">Navigate</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/product" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Shop
              </Link>
              <Link to="/ingredients" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Ingredients
              </Link>
              <Link to="/philosophy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Philosophy
              </Link>
              <Link to="/about" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                About
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <Link to="/contact" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Get in Touch
              </Link>
              <a href="mailto:hello@coastalendurance.co" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                hello@coastalendurance.co
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Coastal Endurance. Made in Australia.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-xs text-primary-foreground/50 hover:text-primary-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;