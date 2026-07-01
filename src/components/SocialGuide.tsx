import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// The guideline CONTENT is served by the admin-gated `social-guide` edge function,
// so it never ships in the public browser bundle. This component only fetches and
// renders it. Blocks are typed; **bold** in strings is rendered inline.
interface Block {
  h?: string;
  sub?: string;
  p?: string;
  ul?: string[];
  facts?: [string, string][];
  note?: { title: string; items: string[] };
  cols?: { title: string; items: string[] }[];
  checklist?: string[];
}

// Render **bold** segments safely (React nodes, not innerHTML).
const RT = ({ t }: { t: string }) => (
  <>
    {t.split("**").map((seg, i) => (i % 2 ? <strong key={i} className="text-foreground">{seg}</strong> : <span key={i}>{seg}</span>))}
  </>
);

const SocialGuide = () => {
  const [sections, setSections] = useState<Block[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.functions.invoke("social-guide").then(({ data, error: e }) => {
      if (e || (data as { error?: string })?.error) {
        setError((data as { error?: string })?.error || "Could not load the guide.");
      } else {
        setSections((data as { sections?: Block[] })?.sections ?? []);
      }
    });
  }, []);

  if (error) return <p className="font-body text-sm text-destructive">{error}</p>;
  if (!sections) return <p className="font-body text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="max-w-[760px] space-y-4 font-body text-[15px] leading-relaxed text-muted-foreground">
      {sections.map((b, i) => {
        if (b.h) return <h2 key={i} className="font-typewriter text-sm uppercase tracking-widest text-foreground pt-6 first:pt-0">{b.h}</h2>;
        if (b.sub) return <p key={i} className="font-typewriter text-xs uppercase tracking-widest text-foreground pt-2">{b.sub}</p>;
        if (b.p) return <p key={i}><RT t={b.p} /></p>;
        if (b.ul) return (
          <ul key={i} className="list-disc pl-5 space-y-1.5">
            {b.ul.map((li, j) => <li key={j}><RT t={li} /></li>)}
          </ul>
        );
        if (b.facts) return (
          <div key={i} className="border border-border divide-y divide-border">
            {b.facts.map(([k, v], j) => (
              <div key={j} className="grid grid-cols-[130px_1fr] gap-3 p-2.5 text-sm">
                <span className="font-typewriter uppercase tracking-wider text-foreground text-xs">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        );
        if (b.note) return (
          <div key={i} className="border border-border bg-muted/40 p-4 space-y-2">
            <p className="font-typewriter text-xs uppercase tracking-widest text-foreground">{b.note.title}</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {b.note.items.map((it, j) => <li key={j}><RT t={it} /></li>)}
            </ul>
          </div>
        );
        if (b.cols) return (
          <div key={i} className="grid md:grid-cols-2 gap-6">
            {b.cols.map((c, j) => (
              <div key={j}>
                <p className="font-typewriter text-xs uppercase tracking-widest text-foreground mb-2">{c.title}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {c.items.map((it, k) => <li key={k}><RT t={it} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        );
        if (b.checklist) return (
          <ul key={i} className="space-y-1.5">
            {b.checklist.map((it, j) => (
              <li key={j} className="flex gap-2"><span className="text-foreground">☐</span><span><RT t={it} /></span></li>
            ))}
          </ul>
        );
        return null;
      })}
    </div>
  );
};

export default SocialGuide;
