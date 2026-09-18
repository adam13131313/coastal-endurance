import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Site-wide feedback tab. Feedback arrives whenever it arrives — mid-order,
// browsing ingredients, after delivery — so this rides along on every customer
// page instead of living only on /contact. Submissions go through the
// submit-feedback edge function into the comms log, filing themselves against
// the sender's CRM record when the email matches.
const FeedbackWidget = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);

  // A signed-in customer shouldn't have to type their email.
  useEffect(() => {
    if (!open || email) return;
    supabase.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email;
      if (e) setEmail(e);
    });
  }, [open, email]);

  // The admin cockpit has its own tools, and the brand brief is a working doc.
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/brand")) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp.trim() !== "") {
      // Bot filled the hidden field: pretend success and drop.
      setOpen(false);
      setMessage("");
      return;
    }
    if (!message.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("submit-feedback", {
      body: { message, email: email.trim() || undefined, page: location.pathname, hp },
    });
    setBusy(false);
    if (error || (data as { error?: string })?.error) {
      toast.error("Couldn't send that. Please try again.");
      return;
    }
    toast.success("Got it — thanks for the straight talk.");
    setMessage("");
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <form
          onSubmit={submit}
          className="w-[calc(100vw-2.5rem)] max-w-sm bg-background border border-border shadow-lg p-5 space-y-4"
        >
          <div>
            <p className="font-typewriter text-sm uppercase tracking-wider">Tell us straight</p>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Anything — the product, the site, ordering. We read everything.
            </p>
          </div>
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field resize-none text-sm"
            placeholder="What's on your mind?"
            aria-label="Your feedback"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field text-sm"
            placeholder="Email (optional — if you'd like a reply)"
            aria-label="Email address (optional)"
          />
          <button type="submit" disabled={busy} className="btn-primary w-full !py-3 disabled:opacity-50">
            {busy ? "SENDING..." : "SEND"}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-4 py-2 bg-primary text-primary-foreground font-typewriter text-xs uppercase tracking-widest shadow-md hover:bg-primary/90 transition-colors"
      >
        {open ? "Close" : "Feedback"}
      </button>
    </div>
  );
};

export default FeedbackWidget;
