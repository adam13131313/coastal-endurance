// Staff/owner brand reference, shown inside the admin area.
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-3">{children}</h2>
);

const Swatch = ({ name, varName, hsl, hex }: { name: string; varName: string; hsl: string; hex: string }) => (
  <div className="border border-border">
    <div className="h-16" style={{ backgroundColor: `hsl(var(${varName}))` }} />
    <div className="p-2">
      <p className="text-xs font-typewriter uppercase tracking-wider text-foreground">{name}</p>
      <p className="text-[11px] font-body text-muted-foreground mt-0.5">{hex}</p>
      <p className="text-[11px] font-body text-muted-foreground">hsl({hsl})</p>
    </div>
  </div>
);

const DownloadLink = ({ href, label, note }: { href: string; label: string; note?: string }) => (
  <a href={href} download className="flex items-center justify-between border border-border p-3 hover:bg-muted transition-colors">
    <span className="text-sm font-body">{label}{note && <span className="text-muted-foreground"> · {note}</span>}</span>
    <span className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground">Download ↓</span>
  </a>
);

const photos = [
  ["/brand/field-oil-bottle.jpg", "Field Oil bottle"],
  ["/brand/hero-product.jpg", "Hero product shot"],
  ["/brand/coastal-landscape.jpg", "Coastal landscape"],
  ["/brand/rugged-coast.jpg", "Rugged coast"],
  ["/brand/snowy-mountains.jpg", "Snowy mountains"],
  ["/brand/sweeping-plains.jpg", "Sweeping plains"],
];

const BrandGuide = () => (
  <div className="max-w-[820px] space-y-12 font-body text-[15px] leading-relaxed text-muted-foreground">
    <section>
      <H>Positioning</H>
      <p>
        Coastal Endurance makes <strong>Field Oil</strong>, a daily skin-maintenance face oil for men.
        It is functional, no-nonsense, and Australian. The frame is <strong>maintenance, not anti-aging or
        luxury</strong>: looking after your skin the way you'd look after any other kit. It speaks to men who
        spend time outdoors, without excluding the man who spends his day indoors and still wants healthy skin.
      </p>
    </section>

    <section>
      <H>Key messages</H>
      <ul className="space-y-2">
        <li><strong>Field Oil: Daily Skin Maintenance</strong> (the headline)</li>
        <li><strong>For Sun, Salt, Wind, &amp; Time</strong> (the supporting line)</li>
        <li>Field Oil maintains what the elements wear down.</li>
        <li>Seven natural oils, each with a job: <strong>active oils</strong> (Rosehip, Hemp), <strong>Australian-grown carriers</strong> (Jojoba, Macadamia), and a <strong>natural antioxidant system</strong> (Meadowfoam, Vitamin E, Rosemary CO2).</li>
        <li>100% natural. Zero fragrance, zero synthetics. Made in Australia.</li>
        <li>12-month bundle: 4 bottles for the price of 3, shipped on your schedule.</li>
      </ul>
    </section>

    <section>
      <H>Voice &amp; tone</H>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Do</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Terse, plain, confident. Short sentences.</li>
            <li>Functional. The equipment / maintenance metaphor.</li>
            <li>Masculine but inclusive (don't gate on lifestyle).</li>
            <li>Concrete. Name the ingredients and what they do.</li>
          </ul>
        </div>
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Don't</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Skincare jargon as the hook (no "barrier maintenance" headline).</li>
            <li>Anti-aging, luxury, or hype / superlatives.</li>
            <li>"For outdoor men only" or specific activity quantities.</li>
            <li>Stacked percentages, or em dashes (use commas / colons).</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <H>Typography</H>
      <p className="mb-3">Headings: <strong>IBM Plex Mono</strong>, uppercase, wide letter-spacing (the "typewriter" look). Body: <strong>Inter</strong>.</p>
      <p className="font-typewriter uppercase tracking-widest text-foreground text-lg">FIELD OIL: DAILY SKIN MAINTENANCE</p>
      <p className="mt-1">Body copy is set in Inter, like this paragraph.</p>
    </section>

    <section>
      <H>Colour palette</H>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Swatch name="Background" varName="--background" hsl="40 20% 97%" hex="≈ #F9F8F6" />
        <Swatch name="Foreground" varName="--foreground" hsl="0 0% 0%" hex="#000000" />
        <Swatch name="Secondary" varName="--secondary" hsl="35 25% 90%" hex="≈ #ECE7DF" />
        <Swatch name="Muted" varName="--muted" hsl="35 15% 92%" hex="≈ #EEEBE8" />
        <Swatch name="Accent" varName="--accent" hsl="0 0% 20%" hex="#333333" />
        <Swatch name="Border" varName="--border" hsl="35 15% 85%" hex="≈ #DEDAD3" />
      </div>
      <p className="mt-3 text-sm">Warm off-white and black, with subtle warm greys. Flat and minimal. No gradients, no drop shadows.</p>
    </section>

    <section>
      <H>Photography</H>
      <p>Rugged Australian landscapes (coast, mountains, plains), the amber bottle, natural light. Muted and desaturated, never glossy studio stock. The mood is endurance and the elements, not spa.</p>
    </section>

    <section>
      <H>Logo &amp; downloads</H>
      <div className="flex items-center gap-4 mb-4">
        <img src="/android-chrome-512x512.png" alt="Coastal Endurance logo" className="w-16 h-16 border border-border" />
        <p className="text-sm">Mountain and sun mark, black on white. Square. Use on a light background; invert if needed for dark.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <DownloadLink href="/android-chrome-512x512.png" label="Logo" note="PNG, 512px" />
        <DownloadLink href="/og-image.png" label="Social / OG image" note="PNG" />
        {photos.map(([href, label]) => (
          <DownloadLink key={href} href={href} label={label} note="JPG" />
        ))}
      </div>
    </section>
  </div>
);

export default BrandGuide;
