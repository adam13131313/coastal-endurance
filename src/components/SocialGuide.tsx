// Staff/owner reference: social posting guidelines (Instagram & TikTok).
// Mirrors coastal_endurance_social_guidelines.md. Keep the two in sync.
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-3">{children}</h2>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mt-4 mb-2">{children}</p>
);

const facts: [string, string][] = [
  ["Product", "Field Oil"],
  ["Size", "30ml"],
  ["Price", "A$78 (single bottle)"],
  ["Positioning line", "“We don't make skincare. We make equipment maintenance.”"],
  ["Category framing", "Barrier / skin maintenance for outdoor-exposed men. Equipment maintenance, not anti-aging, not self-care."],
  ["Target", "Men ~35–55 with years of outdoor exposure (surfers, cyclists, runners, tradies, outdoor workers)"],
  ["Fragrance", "Zero added fragrance, zero essential oils"],
  ["Provenance", "34% Australian-grown ingredients; made in Australia"],
  ["Launch", "Timed to Father's Day AU (6 Sep 2026)"],
];

const SocialGuide = () => (
  <div className="max-w-[760px] space-y-10 font-body text-[15px] leading-relaxed text-muted-foreground">
    <section>
      <H>Social posting guidelines — Instagram &amp; TikTok</H>
      <p>
        Read this before writing or shooting anything for Instagram or TikTok. These rules override generic
        social best-practice and generic brand-voice guidance. If a request conflicts with the locked facts or
        compliance section, flag it rather than writing around it.
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-3">
        <li>Never bake price, ingredient claims, or a hard call-to-action onto the image/video. That lives in the caption. On-image text = <strong>one hook line, maximum</strong>.</li>
        <li>Every post talks to <strong>one</strong> audience — the man himself <em>or</em> the person buying for him. Never blend the two in one post.</li>
      </ul>
    </section>

    <section>
      <H>1 · Locked brand facts</H>
      <div className="border border-border divide-y divide-border">
        {facts.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[130px_1fr] gap-3 p-2.5 text-sm">
            <span className="font-typewriter uppercase tracking-wider text-foreground text-xs">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <Sub>Current formula (7 plant oils)</Sub>
      <p>Rosehip 35%, Australian Jojoba 25%, Evening Primrose 15%, Meadowfoam 9%, Hemp Seed 9%, Australian Macadamia 6%, Australian Sandalwood 1%.</p>

      <div className="mt-4 border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <p className="font-typewriter text-xs uppercase tracking-widest text-foreground">⚠ Verify before publishing — do not state as fact until confirmed</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Any ingredient count / "seven natural oils".</strong> The plant-oil list and the packaging INCI list don't agree yet. Until the live formula is locked, don't claim a number. Safe fallback: "a blend of plant oils," or name the hero oils (rosehip, Australian jojoba) without a count.</li>
          <li><strong>"100% natural" / "natural".</strong> ACCC risk if unsubstantiated. Avoid as a headline claim. Prefer defensible specifics ("no added fragrance, no essential oils," "34% Australian-grown").</li>
          <li><strong>"Great value bundle" / "12-month bundle".</strong> Don't reference unless confirmed as a SKU, and never with discount language (it undercuts the A$78 premium).</li>
        </ul>
      </div>
    </section>

    <section>
      <H>2 · Voice</H>
      <p>Direct, functional, spec-led, anti-ritual. Reads like equipment documentation, not skincare marketing.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Do</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lead with function and fact. Short sentences, plain words.</li>
            <li>Talk about skin as gear that takes a beating outdoors.</li>
            <li>Let the specs and positioning persuade. Understated confidence.</li>
          </ul>
        </div>
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Don't</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gift-shop softness ("no fuss," "treat him," "pamper").</li>
            <li>Ritual language ("routine," "serum," "glow," "self-care").</li>
            <li>Masculine clichés ("built tough," "for real men").</li>
            <li>Discount framing ("great value," "deal") — fights the A$78 position.</li>
          </ul>
        </div>
      </div>
      <Sub>Audience — pick one per post</Sub>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>The man himself</strong> — second person, present tense. His skin, his exposure, his time. Default the rest of the year.</li>
        <li><strong>The buyer (often a partner)</strong> — third person, solves the gift problem. Seasonally justified around the Sep launch.</li>
      </ul>
    </section>

    <section>
      <H>3 · Compliance guardrails (Australia)</H>
      <p>Applies to caption text <strong>and</strong> any on-image/on-screen text.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Allowed (cosmetic)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Supports barrier function"</li>
            <li>"Helps maintain skin's natural moisture barrier"</li>
            <li>"Contains essential fatty acids"</li>
            <li>"Made for outdoor-exposed skin"</li>
          </ul>
        </div>
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Never (therapeutic)</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>"Repairs," "treats," "heals," "cures"</li>
            <li>"Anti-aging," "prevents aging," "reverses"</li>
            <li>Any claim it fixes a condition or sun damage</li>
          </ul>
        </div>
      </div>
      <p className="mt-3">When in doubt, describe what the oil <em>is</em> and what it's <em>for</em>, not what it <em>does to</em> the skin.</p>
    </section>

    <section>
      <H>4 · Instagram</H>
      <Sub>Format specs</Sub>
      <ul className="list-disc pl-5 space-y-1">
        <li>Feed / carousel: <strong>4:5, 1080×1350</strong>. Grid now previews at 3:4 and crops top/bottom — keep faces, product, text <strong>centred</strong>.</li>
        <li>Carousel: every slide same ratio (all 4:5) or it crops.</li>
        <li>Reels / Stories: <strong>9:16, 1080×1920</strong>. Keep text/logos out of the top ~250px and bottom ~250–450px.</li>
      </ul>
      <Sub>On-image text</Sub>
      <p>One hook line, maximum. Product name, price, specs, CTA all go in the caption. Text-heavy images read as ads and get throttled.</p>
      <Sub>Caption structure</Sub>
      <p>Hook → 1–2 lines of function/spec → price (A$78) → CTA "Link in bio." → a tight hashtag set (~5–10: mix category #faceoil #mensskincare, positioning #outdoorskin, provenance #australianmade). Not a wall of 30.</p>
    </section>

    <section>
      <H>5 · TikTok</H>
      <Sub>Format specs</Sub>
      <ul className="list-disc pl-5 space-y-1">
        <li>Video: <strong>9:16, 1080×1920</strong>. Hook in the <strong>first 2 seconds</strong>. Sweet spot ~11–34 sec.</li>
        <li>Photo Mode carousel: 4–35 images at 9:16; sweet spot 5–15 slides. Always add a sound/track.</li>
        <li>Safe zones: keep content out of bottom ~270–400px, right ~100px, top ~150px. Add subtitles.</li>
      </ul>
      <Sub>Static price cards fail here</Sub>
      <p>The algorithm suppresses ad-style creative. Lead with motion or a real Photo Mode carousel; keep price and hard CTA <strong>off</strong> the on-screen text.</p>
      <Sub>CTA &amp; reach</Sub>
      <p>Don't copy "link in bio" — point to the profile naturally or a pinned comment; keep the ask soft. TikTok surfaces to the <strong>For You Page (strangers)</strong>: the first slide / first 2 seconds must explain what this is with zero prior context.</p>
      <Sub>Cross-posting</Sub>
      <p>Design <strong>TikTok-first at 9:16</strong>, then crop down to 4:5 for Instagram. Never go 4:5 → 9:16 (forces letterboxing). Never stretch.</p>
    </section>

    <section>
      <H>6 · Imagery &amp; video direction</H>
      <p>Honest, functional, undesigned. Patagonia gear tags and technical equipment, not skincare campaigns. Natural light, muted/matte, real texture.</p>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Shoot ✅</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Weathered real skin on men in the target band — jaw, hands, forearms, sun-worn neck.</li>
            <li>Genuine, understated outdoor context (wetsuit at the waist, a bike against a wall) as backdrop, not hero.</li>
            <li>Product handled like a tool — workbench, kit bag, dropper mid-use.</li>
            <li>Plain application: 3–4 drops, pressed in, done.</li>
          </ul>
        </div>
        <div>
          <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">Don't shoot ❌</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Postcard clichés (crashing waves, sunsets, drone beach shots as subject).</li>
            <li>Masculine clichés (axes, beards-as-props, leather, "rugged man" posing).</li>
            <li>Spa/luxury signals (marble, soft focus, candlelight, droplets on glass).</li>
            <li>Botanical flat-lays and influencer gloss.</li>
          </ul>
        </div>
      </div>
      <p className="mt-3">Treatment: natural/hard light over soft; muted, earthy, desaturated; matte never glossy. If it looks like a gear catalogue it's right; if it looks like a skincare ad, rework it.</p>
    </section>

    <section>
      <H>7 · Pre-post checklist</H>
      <ul className="space-y-1.5">
        {[
          "Correct ratio for the platform (IG 4:5 / TikTok 9:16), key content in the safe zone.",
          "On-image text is one hook line only — no price, ingredient count, or hard CTA burned in.",
          "Price shown as A$78 (caption only).",
          "No unverified claims: no “seven oils,” no “100% natural,” no “great value bundle” unless confirmed.",
          "No therapeutic claims (repairs / treats / anti-aging / cures).",
          "Post talks to one audience (the man or the buyer), consistently.",
          "Voice: direct and functional — no gift-shop softness or discount language.",
          "CTA matches the platform (link in bio on IG; softer on TikTok).",
          "Designed TikTok-first (9:16) then cropped to IG where relevant.",
        ].map((item, i) => (
          <li key={i} className="flex gap-2"><span className="text-foreground">☐</span><span>{item}</span></li>
        ))}
      </ul>
    </section>
  </div>
);

export default SocialGuide;
