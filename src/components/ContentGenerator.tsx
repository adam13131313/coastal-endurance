import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FORMATS = [
  "Instagram caption",
  "Instagram / Reels hook",
  "TikTok hook + short script",
  "X / Twitter post",
  "Facebook / Meta ad copy",
  "Website / product blurb",
  "Email (to customers)",
  "Product Hunt / launch blurb",
];

const PRESETS = [
  "Launch announcement: Field Oil is live, A$76 a bottle.",
  "Explain the three-role oil blend (actives, carriers, antioxidants) in plain language.",
  "Why a face oil, not a cream. Maintenance for skin that takes weather.",
  "The prepaid bundle: 4 bottles for the price of 3, shipped on your schedule.",
  "Made in Australia, 100% natural, zero fragrance.",
];

const ContentGenerator = () => {
  const [format, setFormat] = useState(FORMATS[0]);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("content-generator", {
        body: { format, topic, notes },
      });
      if (fnErr) throw fnErr;
      if (data?.error) {
        setError(data.error);
      } else {
        setResult(data?.content ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="max-w-[820px] space-y-6">
      <div>
        <h2 className="font-typewriter text-sm uppercase tracking-widest text-foreground mb-1">Content generator</h2>
        <p className="text-xs font-body text-muted-foreground">
          On-brand copy for socials, ads, and email, grounded in the Field Oil voice. Drafts only, read before posting.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-body">
          <span className="block text-xs font-typewriter uppercase tracking-widest text-muted-foreground mb-1">Channel / format</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full sm:w-80 px-2 py-2 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>

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
            placeholder="Tone, a CTA to include, hashtags, length…"
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

      {result && (
        <div className="border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">{format}</span>
            <button onClick={copy} className="text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground hover:text-foreground">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-body text-sm text-foreground p-4 leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
