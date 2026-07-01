import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FORMATS = [
  "Instagram caption",
  "Instagram / Reels hook",
  "TikTok hook + short script",
  "Video shot list (TikTok / Reels)",
  "Photo carousel (slide-by-slide)",
  "X / Twitter post",
  "Facebook / Meta ad copy",
  "Website / product blurb",
  "Email (to customers)",
  "Product Hunt / launch blurb",
];

const PRESETS = [
  "Launch announcement: Field Oil is live, A$78 a bottle.",
  "Explain the three-role oil blend (actives, carriers, antioxidants) in plain language.",
  "Why a face oil, not a cream. Maintenance for skin that takes weather.",
  "The prepaid bundle: 4 bottles for the price of 3 (A$234), shipped on your schedule.",
  "Made in Australia, 100% naturally derived, zero fragrance.",
];

interface Option {
  body: string;
  hashtags: string; // space-separated, editable
}

// Which platform (if any) the chosen format maps to, for the post hand-off.
type Platform = "x" | "instagram" | "tiktok" | "facebook" | null;
function platformOf(format: string): Platform {
  const f = format.toLowerCase();
  // Production plans are filmed/built, not pasted-and-posted — no hand-off button.
  if (f.includes("shot list") || f.includes("storyboard") || f.includes("carousel")) return null;
  if (f.includes("x /") || f.includes("twitter")) return "x";
  if (f.includes("instagram")) return "instagram";
  if (f.includes("tiktok")) return "tiktok";
  if (f.includes("facebook") || f.includes("meta")) return "facebook";
  return null;
}

const fullText = (o: Option) => (o.hashtags.trim() ? `${o.body.trim()}\n\n${o.hashtags.trim()}` : o.body.trim());

const ContentGenerator = () => {
  const [format, setFormat] = useState(FORMATS[0]);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [resultPlatform, setResultPlatform] = useState<Platform>(null);

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    setOptions([]);
    setCopiedIdx(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("content-generator", {
        body: { format, topic, notes, count },
      });
      if (fnErr) throw fnErr;
      if (data?.error) {
        setError(data.error);
      } else {
        const opts: Option[] = (data?.options ?? []).map((o: { body: string; hashtags: string[] }) => ({
          body: o.body ?? "",
          hashtags: (o.hashtags ?? []).map((t) => `#${t}`).join(" "),
        }));
        setOptions(opts);
        setResultPlatform(platformOf(format));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (idx: number, patch: Partial<Option>) =>
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));

  const copy = async (idx: number) => {
    try {
      await navigator.clipboard.writeText(fullText(options[idx]));
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  // Post hand-off: X supports a prefilled web composer; the others don't expose
  // one, so we copy the text and open the app so you can paste and publish.
  const post = async (idx: number, platform: Platform) => {
    const text = fullText(options[idx]);
    if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      /* clipboard blocked */
    }
    const url =
      platform === "instagram"
        ? "https://www.instagram.com/"
        : platform === "tiktok"
          ? "https://www.tiktok.com/upload"
          : platform === "facebook"
            ? "https://www.facebook.com/"
            : "";
    if (url) window.open(url, "_blank", "noopener");
  };

  const postLabel = (p: Platform) =>
    p === "x" ? "Open X to post" : p === "instagram" ? "Copy + open Instagram" : p === "tiktok" ? "Copy + open TikTok" : p === "facebook" ? "Copy + open Facebook" : "";

  return (
    <div className="max-w-[820px] space-y-6">
      <div>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">Content generator</h2>
        <p className="text-xs font-body text-muted-foreground">
          On-brand drafts grounded in the Field Oil voice. Pick an option, edit it, then copy or stage it to post. Always read before publishing.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <label className="block text-sm font-body">
            <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Channel / format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full sm:w-72 px-2 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-body">
            <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Options</span>
            <select
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-24 px-2 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-body">
          <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Brief / angle</span>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            placeholder="What is this post about? e.g. launch announcement, or the prepaid bundle."
            className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <span className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTopic(p)}
                className="text-[11px] font-body border border-border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                {p.length > 42 ? p.slice(0, 42) + "…" : p}
              </button>
            ))}
          </span>
        </label>

        <label className="block text-sm font-body">
          <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Extra notes (optional)</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tone, a CTA to include, length…"
            className="w-full px-3 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </label>

        <button
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="font-typewriter text-xs uppercase tracking-widest border border-foreground px-5 py-2 text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {error && <p className="font-body text-sm text-destructive">{error}</p>}

      {options.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">{format} — {options.length} option{options.length > 1 ? "s" : ""}</p>
          {options.map((o, idx) => (
            <div key={idx} className="border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">Option {idx + 1}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => copy(idx)} className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground hover:text-foreground">
                    {copiedIdx === idx ? "Copied" : "Copy"}
                  </button>
                  {resultPlatform && (
                    <button
                      onClick={() => post(idx, resultPlatform)}
                      className="text-[11px] font-typewriter uppercase tracking-widest text-foreground border border-foreground px-2 py-0.5 hover:bg-foreground hover:text-background transition-colors"
                    >
                      {postLabel(resultPlatform)}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-3">
                <textarea
                  value={o.body}
                  onChange={(e) => update(idx, { body: e.target.value })}
                  rows={Math.min(Math.max(o.body.split("\n").length + 1, 3), 12)}
                  className="w-full font-body text-sm text-foreground bg-background border border-transparent hover:border-border focus:border-foreground rounded-none p-2 -m-2 leading-relaxed focus:outline-none resize-y"
                />
                <input
                  type="text"
                  value={o.hashtags}
                  onChange={(e) => update(idx, { hashtags: e.target.value })}
                  placeholder="Hashtags…"
                  className="w-full font-body text-sm text-muted-foreground bg-background border border-border rounded-none px-2 py-1.5 focus:outline-none focus:border-foreground"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
