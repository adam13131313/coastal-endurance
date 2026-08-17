// Brand exploration reference: the "field:" naming-system study. Read-only,
// for review. The full visual mock-up lives as a Claude artifact (link below).
const ACCENT = "#a9761f"; // dry ochre, from the sunburnt-country palette

const RANGE = [
  { name: "Oil", n: "001", desc: "Daily skin barrier maintenance", status: "Live" },
  { name: "Balm", n: "002", desc: "Protective, anti-chafe barrier for the field", status: "In trial" },
  { name: "Sun", n: "003", desc: "Mineral sunscreen — the answer to the SPF question", status: "Planned" },
];

const Lockup = ({ prod, size = "text-3xl" }: { prod?: string; size?: string }) => (
  <span className={`font-typewriter ${size} tracking-tight`}>
    field<span style={{ color: ACCENT }}>:</span>{prod ? ` ${prod}` : ""}
  </span>
);

const BrandStudy = () => (
  <div className="max-w-[760px] space-y-10">
    <div>
      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">Brand exploration · a study, not a decision</p>
      <h2 className="mt-2 text-2xl font-typewriter uppercase">The <span style={{ color: ACCENT }}>field:</span> system</h2>
      <p className="mt-3 text-sm font-body text-muted-foreground leading-relaxed">
        Exploring <Lockup size="text-sm" /> as a possible master brand. Named like a spec sheet: one mark, one colon,
        the product slots in after it. Fits the monospace / numbered aesthetic, doubles the meaning of "field" (the
        outdoors and a data field), and scales cleanly.
      </p>
    </div>

    <section className="border border-border p-6">
      <Lockup size="text-5xl md:text-6xl" />
    </section>

    {/* Range */}
    <section>
      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">The range · scales to the roadmap</p>
      <div className="border-t border-border">
        {RANGE.map((r) => (
          <div key={r.n} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 border-b border-border items-baseline">
            <span><Lockup prod={r.name} size="text-xl md:text-2xl" /></span>
            <span className={`text-[10px] font-typewriter uppercase tracking-widest px-2 py-0.5 justify-self-end ${
              r.status === "Live" ? "bg-foreground text-background" : r.status === "In trial" ? "border" : "border border-border text-muted-foreground"}`}
              style={r.status === "In trial" ? { borderColor: ACCENT, color: ACCENT } : undefined}>{r.status}</span>
            <span className="text-sm font-body text-muted-foreground col-span-2">
              <span className="font-typewriter text-xs tabular-nums mr-2" style={{ color: ACCENT }}>{r.n}</span>{r.desc}
            </span>
          </div>
        ))}
      </div>
    </section>

    {/* The fork */}
    <section>
      <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">The one strategic fork</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border p-5">
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">Option A — Field alone</p>
          <div className="my-4"><Lockup size="text-3xl" /></div>
          <p className="text-[13px] font-body text-muted-foreground leading-relaxed">Punchiest and cleanest. Hardest to trademark and most generic in search — betting the brand on one common word.</p>
        </div>
        <div className="border border-foreground p-5">
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">Option B — endorsed <span className="ml-1" style={{ color: ACCENT }}>(recommended)</span></p>
          <div className="my-4">
            <Lockup size="text-3xl" />
            <p className="font-typewriter text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">by Coastal Endurance</p>
          </div>
          <p className="text-[13px] font-body text-muted-foreground leading-relaxed">Keeps the distinctive, ownable name and the coast/endurance story, and still puts the sharp mark on the bottle.</p>
        </div>
      </div>
    </section>

    {/* Trademark read */}
    <section className="border border-border p-5 bg-secondary/30">
      <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Trademark read (informal)</p>
      <ul className="space-y-2 text-[13px] font-body text-muted-foreground leading-relaxed list-disc pl-5">
        <li>No obvious exact-match "Field" or "Field Oil" skincare brand surfaced in a quick web scan — cautiously promising, lane looks plausibly open.</li>
        <li>Nearest flags are the plurals: <strong className="text-foreground">Rodan + Fields</strong> (major, US) and Fields of Yarrow. Both "Fields", not "Field".</li>
        <li>Spoken it still reads "Field Oil", so the trademark question is on the word <strong className="text-foreground">"Field"</strong> regardless of the colon.</li>
        <li><strong className="text-foreground">Before committing:</strong> free searches on IP Australia and the UK IPO, "Field" filtered to Class 3 (cosmetics); then a trademark attorney for clearance.</li>
      </ul>
    </section>

    <section>
      <p className="text-[13px] font-body text-muted-foreground">
        Full visual mock-up (logotype, label, hero, the A/B fork):{" "}
        <a href="https://claude.ai/code/artifact/a4d539e7-5189-49cc-8ff9-1707e557aa29" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4 hover:text-primary">open the field: brand study →</a>
      </p>
      <p className="mt-2 text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Open questions: numbering (range slot vs per-product edition) · trademark clearance · Adam's call</p>
    </section>
  </div>
);

export default BrandStudy;
