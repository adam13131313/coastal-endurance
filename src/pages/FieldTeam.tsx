import { useState } from "react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import ruggedCoast from "@/assets/rugged-coast.jpg";

const FieldTeam = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    outdoorActivity: "",
    experienceDuration: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from("field_team_applications").insert({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      outdoor_activity: formData.outdoorActivity,
      experience_duration: formData.experienceDuration,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success("Application received. We'll be in touch within 48 hours.");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      outdoorActivity: "",
      experienceDuration: "",
    });
  };

  return (
    <main className="pt-20">
      <Helmet>
        <title>Field Team — Coastal Endurance</title>
        <meta
          name="description"
          content="Join the Coastal Endurance Field Team. 30 men, 30 days, real conditions. Test Field Oil before launch and shape the final product with honest feedback."
        />
        <link rel="canonical" href="https://coastalendurance.com/field-team" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src={ruggedCoast}
            alt="Rugged Australian coastline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/92 via-background/75 to-background/35" />
        </div>
        <div className="max-w-[700px] mx-auto px-6 relative z-10 py-24 md:py-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display">
            <span className="bg-background/80 px-3 py-1 box-decoration-clone leading-[1.4]">The Field Team</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-foreground font-display leading-relaxed">
            <span className="bg-background/80 px-3 py-1 box-decoration-clone leading-[1.6]">Thirty men. Thirty days. Real conditions.</span>
          </p>
          <p className="mt-6 text-muted-foreground leading-relaxed text-[17px] max-w-xl bg-background/80 px-3 py-2 inline">
            We're looking for 30 men to put Field Oil through its paces before
            we launch. You'll receive a full-size product, use it daily for 30
            days, and tell us honestly what you think. No script. No obligation.
            Just real feedback from real outdoor exposure.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">
            What's in the pack
          </h2>
          <ul className="mt-8 space-y-5 text-muted-foreground leading-relaxed text-[17px]">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>
                <strong className="text-foreground">Field Oil (30ml)</strong> —
                full size, yours to keep. Valued at $78.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>A Field Team insert card</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>
                A one-page brief on what you're testing and why
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>
                Three short check-ins over 30 days — we ask, you answer honestly
              </span>
            </li>
          </ul>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Who we're looking for */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">
            Who this is for
          </h2>
          <p className="mt-8 text-muted-foreground leading-relaxed text-[17px]">
            Men who spend serious time outdoors. Surfers, runners, cyclists,
            tradies, builders, anyone who's been exposed to the Australian
            elements for years. If your skin has taken a beating from sun, salt,
            wind or physical work — this was built for you.
          </p>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Commitment */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">What we ask</h2>
          <p className="mt-8 text-muted-foreground leading-relaxed text-[17px]">
            Use it daily for 30 days. Answer three short check-ins at day 7, day
            14, and day 30. Be honest. That's it. Your feedback shapes the final
            product before it goes to market.
          </p>
        </div>
      </section>

      <Separator className="max-w-[700px] mx-auto" />

      {/* Apply */}
      <section className="section-padding bg-secondary">
        <div className="max-w-[700px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display">
            Join the Field Team
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed text-[17px]">
            Spots are limited to 30. Enter your details below and we'll be in
            touch within 48 hours.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium mb-2"
                >
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium mb-2"
                >
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            <div>
              <label
                htmlFor="outdoorActivity"
                className="block text-sm font-medium mb-2"
              >
                What do you do outdoors?
              </label>
              <input
                type="text"
                id="outdoorActivity"
                value={formData.outdoorActivity}
                onChange={(e) =>
                  setFormData({ ...formData, outdoorActivity: e.target.value })
                }
                className="input-field"
                required
              />
            </div>

            <div>
              <label
                htmlFor="experienceDuration"
                className="block text-sm font-medium mb-2"
              >
                How long have you been doing it?
              </label>
              <input
                type="text"
                id="experienceDuration"
                value={formData.experienceDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceDuration: e.target.value,
                  })
                }
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Apply for a spot"}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted-foreground leading-relaxed">
            We'll send you a discount code to order through the site at no cost.
            Product ships late March 2026. Australia-wide.
          </p>
        </div>
      </section>

      {/* Footer note */}
      <section className="py-12">
        <div className="max-w-[700px] mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground italic">
            Field Team applications close when 30 spots are filled.
          </p>
        </div>
      </section>
    </main>
  );
};

export default FieldTeam;
