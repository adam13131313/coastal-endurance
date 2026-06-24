import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const CheckoutCancel = () => (
  <main className="pt-20">
    <Helmet>
      <title>Checkout cancelled | Coastal Endurance</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <section className="section-padding">
      <div className="container-narrow text-center">
        <h1 className="text-4xl md:text-5xl font-typewriter uppercase">Checkout cancelled</h1>
        <p className="mt-6 font-body text-muted-foreground text-[17px]">
          No charge was made. Your cart is still saved.
        </p>
        <Link to="/cart" className="btn-primary mt-8 inline-flex">
          <ArrowLeft className="mr-2 w-4 h-4" />
          RETURN TO CART
        </Link>
      </div>
    </section>
  </main>
);

export default CheckoutCancel;
