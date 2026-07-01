import { createClient } from "npm:@supabase/supabase-js@2";

// Admin-gated so the guideline content is NEVER shipped in the public browser
// bundle — only an authenticated admin can fetch it.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null) {
  return o != null && (ALLOWED_ORIGINS.includes(o) || /^https:\/\/coastal-endurance[a-z0-9-]*\.vercel\.app$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o));
}
function cors(o: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": originAllowed(o) ? o! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}
function emailFromAuth(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const parts = header.slice(7).trim().split(".");
  if (parts.length < 2) return null;
  try {
    const p = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const c = JSON.parse(atob(p.padEnd(Math.ceil(p.length / 4) * 4, "=")));
    return c?.role === "authenticated" && typeof c.email === "string" ? c.email : null;
  } catch {
    return null;
  }
}

// Content blocks. **bold** is rendered client-side. Kept server-side so it stays
// internal (admins only).
const SECTIONS = [
  { h: "Social posting guidelines — Instagram & TikTok" },
  { p: "Read this before writing or shooting anything for Instagram or TikTok. These rules override generic social best-practice and generic brand-voice guidance. If a request conflicts with the locked facts or compliance section, flag it rather than writing around it." },
  { ul: [
    "Never bake price, ingredient claims, or a hard call-to-action onto the image/video. That lives in the caption. On-image text = **one hook line, maximum**.",
    "Every post talks to **one** audience — the man himself, or the person buying for him. Never blend the two in one post.",
  ] },

  { h: "1 · Locked brand facts" },
  { facts: [
    ["Product", "Field Oil"],
    ["Size", "30ml"],
    ["Price", "A$78 (single bottle)"],
    ["Positioning line", "“We don't make skincare. We make equipment maintenance.”"],
    ["Category framing", "Barrier / skin maintenance for outdoor-exposed men. Equipment maintenance, not anti-aging, not self-care."],
    ["Target", "Men ~35–55 with years of outdoor exposure (surfers, cyclists, runners, tradies, outdoor workers)"],
    ["Fragrance", "Zero added fragrance, zero essential oils"],
    ["Provenance", "Majority Australian-grown ingredients; made in Australia"],
    ["Launch", "Timed to Father's Day AU (6 Sep 2026)"],
  ] },
  { sub: "Current formula (100% naturally derived)" },
  { p: "Rosehip and Hemp (active oils); Australian Jojoba and Macadamia (carrier oils); Meadowfoam, Vitamin E, Sunflower, and Rosemary (natural antioxidant/carrier system). 100% naturally derived, no synthetics." },
  { note: { title: "Confirm the current details before publishing", items: [
    "**Use “100% naturally derived”, not the bare “100% natural”.** The blend is entirely naturally derived (no synthetics) and is a cosmetic, not a therapeutic good — but a couple of ingredients are derived-natural, so the absolute “100% natural” is exposed. Use “100% naturally derived” with confidence.",
    "**Named ingredients / oil count.** Make sure any specific ingredients or a count match the current formula above.",
    "**The 12-month bundle exists (A$234, four bottles for the price of three).** Frame it functionally (“a year in one order”), never with discount language (“great value,” “deal”) — that undercuts the A$78 premium.",
  ] } },

  { h: "2 · Voice" },
  { p: "Direct, functional, spec-led, anti-ritual. Reads like equipment documentation, not skincare marketing." },
  { cols: [
    { title: "Do", items: ["Lead with function and fact. Short sentences, plain words.", "Talk about skin as gear that takes a beating outdoors.", "Let the specs and positioning persuade. Understated confidence."] },
    { title: "Don't", items: ["Gift-shop softness (“no fuss,” “treat him,” “pamper”).", "Ritual language (“routine,” “serum,” “glow,” “self-care”).", "Masculine clichés (“built tough,” “for real men”).", "Discount framing (“great value,” “deal”) — fights the A$78 position."] },
  ] },
  { sub: "Audience — pick one per post" },
  { ul: [
    "**The man himself** — second person, present tense. His skin, his exposure, his time. Default the rest of the year.",
    "**The buyer (often a partner)** — third person, solves the gift problem. Seasonally justified around the Sep launch.",
  ] },

  { h: "3 · Compliance guardrails (Australia)" },
  { p: "Applies to caption text and any on-image/on-screen text. Field Oil is a cosmetic, not a therapeutic good." },
  { cols: [
    { title: "Allowed (cosmetic)", items: ["“Supports barrier function”", "“Helps maintain skin's natural moisture barrier”", "“Contains essential fatty acids”", "“Made for outdoor-exposed skin”"] },
    { title: "Never (therapeutic)", items: ["“Repairs,” “treats,” “heals,” “cures”", "“Anti-aging,” “prevents aging,” “reverses”", "Any claim it fixes a condition or sun damage"] },
  ] },
  { p: "When in doubt, describe what the oil **is** and what it's **for**, not what it does to the skin." },

  { h: "4 · Instagram" },
  { sub: "Format specs" },
  { ul: [
    "Feed / carousel: **4:5, 1080×1350**. The grid now previews at 3:4 and crops top/bottom — keep faces, product, and text **centred**.",
    "Carousel: every slide same ratio (all 4:5) or it crops.",
    "Reels / Stories: **9:16, 1080×1920**. Keep text/logos out of the top ~250px and bottom ~250–450px.",
  ] },
  { sub: "On-image text" },
  { p: "One hook line, maximum. Product name, price, specs, CTA all go in the caption. Text-heavy images read as ads and get throttled." },
  { sub: "Caption structure" },
  { p: "Hook → 1–2 lines of function/spec → price (A$78) → CTA “Link in bio.” → a tight hashtag set (~5–10: category #faceoil #mensskincare, positioning #outdoorskin, provenance #australianmade). Not a wall of 30." },

  { h: "5 · TikTok" },
  { sub: "Format specs" },
  { ul: [
    "Video: **9:16, 1080×1920**. Hook in the **first 2 seconds**. Sweet spot ~11–34 sec.",
    "Photo Mode carousel: 4–35 images at 9:16; sweet spot 5–15 slides. Always add a sound/track.",
    "Safe zones: keep content out of bottom ~270–400px, right ~100px, top ~150px. Add subtitles.",
  ] },
  { sub: "Static price cards fail here" },
  { p: "The algorithm suppresses ad-style creative. Lead with motion or a real Photo Mode carousel; keep price and hard CTA **off** the on-screen text." },
  { sub: "CTA & reach" },
  { p: "Don't copy “link in bio” — point to the profile naturally or a pinned comment; keep the ask soft. TikTok surfaces to the **For You Page (strangers)**: the first slide / first 2 seconds must explain what this is with zero prior context." },
  { sub: "Cross-posting" },
  { p: "Design **TikTok-first at 9:16**, then crop down to 4:5 for Instagram. Never go 4:5 → 9:16 (forces letterboxing). Never stretch." },

  { h: "6 · Imagery & video direction" },
  { p: "Honest, functional, undesigned. Patagonia gear tags and technical equipment, not skincare campaigns. Natural light, muted/matte, real texture." },
  { cols: [
    { title: "Shoot ✅", items: ["Weathered real skin on men in the target band — jaw, hands, forearms, sun-worn neck.", "Genuine, understated outdoor context (wetsuit at the waist, a bike against a wall) as backdrop, not hero.", "Product handled like a tool — workbench, kit bag, dropper mid-use.", "Plain application: 3–4 drops, pressed in, done."] },
    { title: "Don't shoot ❌", items: ["Postcard clichés (crashing waves, sunsets, drone beach shots as subject).", "Masculine clichés (axes, beards-as-props, leather, “rugged man” posing).", "Spa/luxury signals (marble, soft focus, candlelight, droplets on glass).", "Botanical flat-lays and influencer gloss."] },
  ] },
  { p: "Treatment: natural/hard light over soft; muted, earthy, desaturated; matte never glossy. If it looks like a gear catalogue it's right; if it looks like a skincare ad, rework it." },

  { h: "7 · Pre-post checklist" },
  { checklist: [
    "Correct ratio for the platform (IG 4:5 / TikTok 9:16), key content in the safe zone.",
    "On-image text is one hook line only — no price, ingredient count, or hard CTA burned in.",
    "Price shown as A$78 (caption only).",
    "Named ingredients match the current formula; use “100% naturally derived” (not bare “100% natural”); no discount language for the bundle.",
    "No therapeutic claims (repairs / treats / anti-aging / cures).",
    "Post talks to one audience (the man or the buyer), consistently.",
    "Voice: direct and functional — no gift-shop softness or discount language.",
    "CTA matches the platform (link in bio on IG; softer on TikTok).",
    "Designed TikTok-first (9:16) then cropped to IG where relevant.",
  ] },
];

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  const email = emailFromAuth(req.headers.get("Authorization"));
  if (!email) return json({ error: "Unauthorized" }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
  if (!adminRow) return json({ error: "Forbidden" }, 403);

  return json({ sections: SECTIONS });
});
