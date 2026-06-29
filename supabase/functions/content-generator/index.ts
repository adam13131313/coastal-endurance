import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const ALLOWED_ORIGINS = ["https://coastalendurance.com", "https://www.coastalendurance.com"];
function originAllowed(o: string | null) {
  return o != null && (ALLOWED_ORIGINS.includes(o) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o));
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

const SYSTEM = `You write marketing copy for Coastal Endurance, an Australian men's skincare brand. One product: Field Oil, a daily skin-maintenance face oil.

BRAND VOICE: terse, plain, confident, functional. Masculine but inclusive (never gate on lifestyle or exclude indoor/casual men). Frame as maintenance, not anti-aging or luxury. Concrete: name ingredients and what they do.

AVOID: skincare jargon as the hook (never lead with "barrier maintenance"), hype and superlatives, "for outdoor men only", specific activity quantities (e.g. "ride 12 hours a week"), stacked percentages, and EM DASHES (use commas or colons instead).

FACTS YOU CAN USE:
- Field Oil: single bottle A$78, or a prepaid 12-month bundle (A$234, 4 bottles for the price of 3, shipped on a schedule the customer picks).
- 100% natural. Seven oils: active oils (Rosehip, Hemp), Australian-grown carriers (Jojoba, Macadamia), and a natural antioxidant system (Meadowfoam, Vitamin E, Rosemary CO2). Zero fragrance, zero synthetics. Made in Australia.
- Lines we like: "Daily Skin Maintenance", "For Sun, Salt, Wind, and Time", "Field Oil maintains what the elements wear down."

Write copy for the requested channel and brief. Unless told otherwise, give 3 distinct, ready-to-post options, numbered. No preamble, just the options. Match the platform (short and punchy for socials, calmer for website/email). Suggest a hashtag set only if asked.`;

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });

  try {
    const email = emailFromAuth(req.headers.get("Authorization"));
    if (!email) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: adminRow } = await admin.from("admins").select("email").eq("email", email).maybeSingle();
    if (!adminRow) return json({ error: "Forbidden" }, 403);

    if (!ANTHROPIC_API_KEY) return json({ error: "The generator isn't configured yet (missing API key)." }, 503);

    const body = await req.json().catch(() => ({}));
    const format = typeof body?.format === "string" ? body.format.slice(0, 80) : "social post";
    const topic = typeof body?.topic === "string" ? body.topic.slice(0, 2000) : "";
    const notes = typeof body?.notes === "string" ? body.notes.slice(0, 1000) : "";
    if (!topic.trim()) return json({ error: "Add a brief" }, 400);

    const user = `Channel / format: ${format}.\nBrief: ${topic}${notes ? `\nExtra notes: ${notes}` : ""}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      console.error("anthropic error", res.status, await res.text().catch(() => ""));
      return json({ error: "The generator is unavailable right now." }, 502);
    }
    const data = await res.json();
    const content = (data?.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n").trim();
    return json({ content: content || "No content generated." });
  } catch (e) {
    console.error("content-generator error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
