import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/account");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/account");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (provider: "google" | "apple") => {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  // Passwordless email sign-in: sends a magic link. Works with any email provider
  // (Gmail, Outlook, Hotmail…), and creates the account on first use.
  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading("email");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/account" },
    });
    setLoading(null);
    if (error) {
      toast({ title: "Couldn't send the link", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-medium tracking-tight">Sign In</h1>
          <p className="text-muted-foreground text-sm">Continue with your preferred account, or get a link by email</p>
        </div>

        {sent ? (
          <div className="text-center space-y-2 border border-border rounded-md p-6">
            <p className="text-sm font-medium">Check your inbox</p>
            <p className="text-sm text-muted-foreground">We've emailed a sign-in link to <strong>{email}</strong>. Open it on this device to finish signing in.</p>
            <button onClick={() => setSent(false)} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Use a different email</button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => handleSignIn("google")}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-md text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading === "google" ? "Signing in..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmailLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="w-full px-4 py-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button
                type="submit"
                disabled={!!loading}
                className="w-full px-4 py-3 rounded-md bg-foreground text-background text-sm font-medium transition-colors hover:bg-foreground/90 disabled:opacity-50"
              >
                {loading === "email" ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center">No password needed. We'll email a one-tap link; a new account is created automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
