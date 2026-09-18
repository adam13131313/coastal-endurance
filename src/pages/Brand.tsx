import { Helmet } from "react-helmet-async";

// Working brand brief for creative review (Laurence Thomson and co).
// Deliberately unlinked from site navigation and marked noindex: the page is
// shared by URL only. Content mirrors the internal "Field Oil: Brand Story"
// working document, 18 Sep 2026.

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl md:text-4xl font-typewriter uppercase mb-8">{children}</h2>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="section-padding border-t border-border first:border-t-0">
    <div className="max-w-[700px] mx-auto px-6">
      <H>{title}</H>
      <div className="space-y-6 font-body text-muted-foreground leading-relaxed text-[17px]">
        {children}
      </div>
    </div>
  </section>
);

const Brand = () => {
  return (
    <main id="top" className="pt-20">
      <Helmet>
        <title>Brand Story | Coastal Endurance</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Field Oil brand story. Working brief for creative review." />
      </Helmet>

      {/* Title */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
            Working brief · For creative review · 18 September 2026
          </p>
          <h1 className="mt-6 text-4xl md:text-5xl font-typewriter uppercase">
            Field Oil: Brand Story
          </h1>
        </div>
      </section>

      <Section title="How it started">
        <p>
          Twelve years ago, when Adam's daughter was born, he and his partner rubbed a little
          sunflower oil into her skin each day for months. Then Adam started using it on his face
          instead of moisturiser. His skin runs dry and sensitive, and it just worked.
        </p>
        <p>
          His skin had earned it. Surfing, rugby, snowboarding, hikes, years of time outside with
          the kids, in air-conditioned offices and on air-conditioned planes. These days he runs a
          marathon a year, and long runs are hard on skin: sun, wind, sweat, the way training
          strips you down. But even without the running, the skin just needs some maintenance as
          it accumulates exposure over the years.
        </p>
        <p>
          He'd tried moisturisers and never got on with them: the film, the heaviness. A cream or
          lotion that has to survive a warehouse, a shipping container, a shelf and a hot car ends
          up carrying a long list of synthetics to stay consistent. A complex pharmaceutical
          process to deliver something that should be simple.
        </p>
        <p>
          So he asked a simpler question: what do you actually need? A couple of active oils to do
          the work. Carriers to spread them light and even. Antioxidants to keep the whole thing
          stable wherever it lives, in a bag, at the beach, in the car. All of it natural, because
          it goes on every day.
        </p>
        <p className="text-foreground font-medium">That question became Field Oil.</p>
      </Section>

      <Section title="The idea">
        <p>
          Repair is what you do after something breaks. Maintenance is what you do so it doesn't
          break. Anyone who owns good gear knows which of the two is easier, cheaper and kinder to
          the gear.
        </p>
        <p>
          Field Oil treats skin the same way. Not a treatment, not a ritual, not a promise of
          transformation. Daily skin barrier maintenance: the small, unglamorous habit that keeps
          you doing the thing for years instead of weeks.
        </p>
        <p className="text-foreground font-medium">
          Skin cops sun, salt, wind and time, week after week. The smart move is the dull one.
          Look after it daily. Look after the gear.
        </p>
      </Section>

      <Section title="The product">
        <p>Field Oil 001 is a daily face oil. One product, once a day, made in Australia.</p>
        <p>
          The formula is short. Naturally derived oils, each with a job: Rosehip and Hemp are the
          actives. Australian-grown Jojoba and Macadamia carry them, light and clean. Meadowfoam,
          Vitamin E, Sunflower and Rosemary keep the whole thing stable.
        </p>
        <p>
          It's anhydrous. No water means no emulsion, no cream, and a formula that stays simple.
          100% naturally derived, zero fragrance, zero synthetics, majority Australian-grown.
          That's the lot.
        </p>
        <p className="text-foreground font-medium">
          Products carry numbered designations. 001 is the first. There will be more.
        </p>
      </Section>

      <Section title="Who it's for">
        <p>
          Men whose days are hard on the skin. Men who've spent their lives outdoors, and men who
          haven't but whose skin has still copped its share of sun, salt, wind and years.
        </p>
        <p>
          The frame is masculine but never exclusive. Nobody has to surf at dawn to qualify, and
          nobody has to wait for the damage to show. If you're still out there doing your thing,
          start looking after your skin now.
        </p>
      </Section>

      <Section title="Positioning">
        <p>
          Premium, and unapologetic about it. Field Oil 001 sells at A$78 for 30 ml (note we are
          pre-revenue and in testing). That is Aesop territory, not middling territory, and it's
          deliberate.
        </p>
        <p>
          Aesop is the reference: a Melbourne brand that proved the world pays properly for
          something made carefully and sold with a straight face. Brands like Ffern, with its
          numbered seasonal batches, and Allies of Skin, with its full-disclosure premium actives,
          show the same thing from other angles. Craft, transparency and restraint hold a price.
          Hype doesn't.
        </p>
        <p>
          The difference is the reason to be on that shelf. Aesop sells ritual and fragrance.
          Field Oil sells maintenance and function. Same shelf, different job.
        </p>
        <p>
          What the brand won't do is drift to the middle. If any part of it hasn't yet earned the
          price point, the answer is to evolve the brand up to the price: the pack, the finish,
          the batch story, the buying experience, the service. Never to bring the price down to
          meet the market.
        </p>
        <p>
          The line grows the same way. 001 is the first designation. A protective balm and a
          sunscreen are on the bench, and each future product takes the next number and has to
          earn the same shelf.
        </p>
      </Section>

      <Section title="Current brand thinking">
        <p>
          The mood is endurance and the elements, not spa. Rugged Australian landscapes: coast,
          mountains, plains. The amber bottle in natural light, muted and desaturated, not glossy.
        </p>
        <p>
          The voice is terse, plain and confident. Functional language, the equipment and
          maintenance metaphor, concrete claims: name the ingredients and what they do. No hype,
          no superlatives, no anti-aging. We say what we do and why, and let readers compare.
        </p>
        <p>
          On the page: typewriter headings, uppercase and wide-set, over clean body copy. Warm
          off-white and black. Flat and minimal, no gradients, no drop shadows. It should read
          like a well-kept logbook, not a beauty counter.
        </p>
      </Section>

      <Section title="From the field">
        <p>
          Field Oil is in the hands of the first Field Team members now: bottles handed over in
          person or ordered with a Field Team code, a week-one chat, a 30-day survey. The early
          word:
        </p>
        <ul className="list-disc pl-5 space-y-4">
          <li>
            "Probably the best face oil I've ever tried" and "intensely hydrating", from a tester
            who tried a household member's bottle and asked for her own. (USA)
          </li>
          <li>
            Week-one feedback from another tester: doesn't leave the face greasy, likes the
            dropper, good size, and he came around on the unscented formula ("natural scent adds
            to its manly vibe"). His verdict: "I can see a market for it." He flagged oil on the
            outside of the bottle from a lid that didn't seal; the new lid has fixed it. (UK)
          </li>
          <li>
            A three-day trial journal from a journalist and field-team member testing the product
            in Ukraine, in the actual field: skin noticeably soft instead of dry after the evening
            wash, beard soft and the under-beard itch gone by day three. The moment he reaches for
            it is after a post-gym shower. Two honest notes: unscented reads like a food oil at
            first next to scented products (need to consider this), and 5 to 6 drops runs slightly
            greasy around the nose. Start at 4 to 5. (UKR)
          </li>
        </ul>
      </Section>

      <Section title="The line">
        <p className="font-typewriter uppercase tracking-widest text-foreground text-lg">
          Field Oil: Daily Skin Barrier Maintenance
        </p>
        <p className="text-foreground font-medium">For Sun, Salt, Wind, &amp; Time.</p>
        <p>
          Field Oil maintains what the elements wear down. One product. Once a day. Made properly,
          in Australia, for a life spent out in it.
        </p>
      </Section>

    </main>
  );
};

export default Brand;
