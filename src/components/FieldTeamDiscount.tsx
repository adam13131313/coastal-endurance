import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MailCheck } from "lucide-react";

const FieldTeamDiscount = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: fnError } = await supabase.functions.invoke(
        "verify-field-team-member",
        { body: { email: email.trim().toLowerCase() } },
      );

      if (fnError) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="border border-border bg-secondary/50 p-6">
          <div className="flex items-start gap-3">
            <MailCheck className="h-6 w-6 shrink-0 text-foreground" />
            <div>
              <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">
                CHECK YOUR EMAIL
              </p>
              <p className="text-[15px] font-body text-muted-foreground leading-relaxed">
                If <span className="text-foreground">{email.trim().toLowerCase()}</span> is on our approved
                field team list, we've emailed your discount code there. It may take a few minutes to arrive,
                check your spam folder if you don't see it. Contact adam@coastalendurance.com if you think
                there's a mistake.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-[17px] font-body text-muted-foreground leading-relaxed">
        Enter the email address you registered with and we'll send your discount code to your inbox.
      </p>
      <div className="flex gap-3">
        <Input
          type="email"
          placeholder="your@email.com"
          aria-label="Field team email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="font-body"
        />
        <Button type="submit" disabled={isLoading || !email.trim()} className="shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
        </Button>
      </div>
      {error && (
        <p className="text-sm font-body text-destructive">{error}</p>
      )}
    </form>
  );
};

export default FieldTeamDiscount;
