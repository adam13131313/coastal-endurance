import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Reveal from "@/components/Reveal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export interface FieldNoteRow {
  id: string;
  slug: string;
  title: string;
  standfirst: string | null;
  body: string;
  published_at: string | null;
}

const fmt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";

const FieldNotes = () => {
  const [notes, setNotes] = useState<FieldNoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("field_notes")
        .select("id, slug, title, standfirst, body, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      setNotes((data as FieldNoteRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="pt-20">
      <Helmet>
        <title>Field Notes | Coastal Endurance</title>
        <meta name="description" content="Notes from the field: maintenance over repair, endurance, and what goes into Field Oil. Written by the founder." />
        <link rel="canonical" href="https://coastalendurance.com/field-notes" />
        <meta property="og:title" content="Field Notes | Coastal Endurance" />
        <meta property="og:description" content="Notes from the field: maintenance over repair, endurance, and what goes into Field Oil." />
        <meta property="og:url" content="https://coastalendurance.com/field-notes" />
      </Helmet>

      {/* Header */}
      <section className="section-padding border-b border-border">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
            THE JOURNAL
          </p>
          <h1 className="text-4xl md:text-5xl font-typewriter uppercase">FIELD NOTES</h1>
          <p className="mt-6 font-body text-muted-foreground leading-relaxed text-[17px]">
            Occasional notes on maintenance, endurance, and what goes into the bottle. Written by the founder, when there's something worth saying.
          </p>
        </div>
      </section>

      {/* Notes */}
      <section className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          {loading && <p className="font-body text-muted-foreground">Loading…</p>}
          {!loading && notes.length === 0 && (
            <p className="font-body text-muted-foreground">First notes coming soon.</p>
          )}
          <div className="space-y-14">
            {notes.map((n) => (
              <Reveal key={n.id} as="article">
                <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
                  {fmt(n.published_at)}
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl font-typewriter uppercase leading-snug">
                  <Link to={`/field-notes/${n.slug}`} className="hover:text-primary transition-colors">
                    {n.title}
                  </Link>
                </h2>
                {n.standfirst && (
                  <p className="mt-3 font-body text-muted-foreground leading-relaxed text-[17px]">{n.standfirst}</p>
                )}
                <Link
                  to={`/field-notes/${n.slug}`}
                  className="inline-flex items-center mt-4 font-typewriter text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors"
                >
                  Read
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default FieldNotes;
