import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import type { FieldNoteRow } from "@/pages/FieldNotes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

// Editorial-scale markdown, matching the site's reading register (17px Inter body,
// typewriter accents) — the admin Markdown component is deliberately smaller.
const mdComponents = {
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="font-typewriter text-xl uppercase tracking-wide mt-10 mb-4" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="font-typewriter text-sm uppercase tracking-widest mt-8 mb-3" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="font-body text-muted-foreground leading-relaxed text-[17px] mb-5" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-6 space-y-2 mb-5 font-body text-muted-foreground text-[17px]" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal pl-6 space-y-2 mb-5 font-body text-muted-foreground text-[17px]" {...p} />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="text-foreground font-medium" {...p} />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="text-foreground underline underline-offset-4 hover:text-primary" {...p} />,
  hr: () => <hr className="border-border my-8" />,
};

const fmt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "";

const FieldNote = () => {
  const { slug } = useParams<{ slug: string }>();
  const [note, setNote] = useState<FieldNoteRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await sb
        .from("field_notes")
        .select("id, slug, title, standfirst, body, published_at")
        .eq("published", true)
        .eq("slug", slug)
        .maybeSingle();
      setNote((data as FieldNoteRow) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <main className="pt-20 section-padding">
        <p className="max-w-[700px] mx-auto px-6 font-body text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!note) {
    return (
      <main className="pt-20 section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <p className="font-body text-muted-foreground">That note doesn't exist.</p>
          <Link to="/field-notes" className="inline-flex items-center mt-6 font-typewriter text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors">
            <ArrowLeft className="mr-2 w-4 h-4" />
            All Field Notes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20">
      <Helmet>
        <title>{note.title} | Field Notes | Coastal Endurance</title>
        <meta name="description" content={note.standfirst ?? note.title} />
        <link rel="canonical" href={`https://coastalendurance.com/field-notes/${note.slug}`} />
        <meta property="og:title" content={`${note.title} | Field Notes`} />
        <meta property="og:description" content={note.standfirst ?? note.title} />
        <meta property="og:url" content={`https://coastalendurance.com/field-notes/${note.slug}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: note.title,
          description: note.standfirst ?? undefined,
          datePublished: note.published_at ?? undefined,
          author: { "@type": "Person", name: "Adam Hyde" },
          publisher: { "@type": "Organization", name: "Coastal Endurance" },
        })}</script>
      </Helmet>

      <article className="section-padding">
        <div className="max-w-[700px] mx-auto px-6">
          <Link to="/field-notes" className="inline-flex items-center font-typewriter text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 w-3.5 h-3.5" />
            Field Notes
          </Link>
          <p className="mt-10 font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
            {fmt(note.published_at)}
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-typewriter uppercase leading-tight">
            {note.title}
          </h1>
          {note.standfirst && (
            <p className="mt-5 text-lg font-body font-medium text-foreground leading-relaxed">{note.standfirst}</p>
          )}
          <div className="mt-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{note.body}</ReactMarkdown>
          </div>
          <p className="mt-10 pt-2 font-typewriter text-sm uppercase tracking-widest text-foreground">
            Adam Hyde, Founder
          </p>

          <div className="mt-14 pt-8 border-t border-border">
            <Link to="/product" className="inline-flex items-center font-typewriter text-sm uppercase tracking-wider border-b border-foreground/50 pb-1 hover:border-foreground transition-colors">
              Get Field Oil 001
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
};

export default FieldNote;
