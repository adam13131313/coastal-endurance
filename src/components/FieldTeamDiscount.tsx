import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FieldTeamDiscount = () => {
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const DISCOUNT_CODE = "FIELD-TEAM-MEMBER";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from("approved_field_team_members")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (queryError) {
        setError("Something went wrong. Please try again.");
        return;
      }

      if (!data) {
        setError("This email is not on the approved list. Contact adam@coastalendurance.com if you think this is a mistake.");
        return;
      }

      setIsVerified(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(DISCOUNT_CODE);
    setCopied(true);
    toast.success("Discount code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isVerified) {
    return (
      <div className="space-y-6">
        <div className="border border-border bg-secondary/50 p-6">
          <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-4">
            YOUR DISCOUNT CODE
          </p>
          <div className="flex items-center gap-3">
            <code className="text-2xl md:text-3xl font-typewriter tracking-wider text-foreground bg-background border border-border px-4 py-3 flex-1 text-center select-all">
              {DISCOUNT_CODE}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy discount code"
              className="h-12 w-12 shrink-0"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="mt-4 text-[15px] font-body text-muted-foreground leading-relaxed">
            Apply this code at checkout for 100% off. This code is for approved field team members only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-[17px] font-body text-muted-foreground leading-relaxed">
        Enter the email address you registered with to access your discount code.
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
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
        </Button>
      </div>
      {error && (
        <p className="text-sm font-body text-destructive">{error}</p>
      )}
    </form>
  );
};

export default FieldTeamDiscount;
