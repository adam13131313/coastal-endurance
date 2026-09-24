import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

type State = "working" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("working");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("error");
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke("newsletter-unsubscribe", { body: { token } });
        if (cancelled) return;
        setState(!error && (data as { ok?: boolean })?.ok ? "done" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="pt-20">
      <Helmet>
        <title>Unsubscribe | Coastal Endurance</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="section-padding">
        <div className="container-narrow text-center">
          {state === "working" && (
            <p className="font-body text-muted-foreground text-[17px]">Updating your preferences…</p>
          )}

          {state === "done" && (
            <>
              <h1 className="text-4xl md:text-5xl font-typewriter uppercase">Unsubscribed</h1>
              <p className="mt-6 font-body text-muted-foreground text-[17px]">
                You won't receive further updates. No hard feelings — the door's open if you ever want back in.
              </p>
              <Link to="/" className="btn-primary mt-8 inline-flex">
                RETURN TO SITE
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="text-4xl md:text-5xl font-typewriter uppercase">Link not valid</h1>
              <p className="mt-6 font-body text-muted-foreground text-[17px]">
                This unsubscribe link is invalid or has already been used. If you're still getting emails you don't
                want, reply to any of them and we'll take you off the list.
              </p>
              <Link to="/" className="btn-primary mt-8 inline-flex">
                RETURN TO SITE
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Unsubscribe;
