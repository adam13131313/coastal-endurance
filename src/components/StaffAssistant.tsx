import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I ship a bundle delivery?",
  "How do I refund a customer?",
  "Where do I change the price or stock?",
];

const StaffAssistant = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("staff-assistant", { body: { messages: next } });
    setBusy(false);
    const payload = data as { reply?: string; error?: string } | null;
    const reply = error ? "Sorry, something went wrong reaching the assistant." : payload?.reply ?? payload?.error ?? "No answer.";
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
  };

  return (
    <div className="max-w-[760px]">
      <p className="font-body text-sm text-muted-foreground mb-4">
        Ask about how the store works — fulfilment, refunds, where to change things. Answers are guidance, not live order data (use the Orders tab for that).
      </p>

      <div className="border border-border min-h-[300px] max-h-[460px] overflow-y-auto p-4 space-y-3 bg-secondary/30">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-body text-muted-foreground">Try:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="block text-left text-sm font-body underline text-muted-foreground hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block text-sm font-body whitespace-pre-wrap px-3 py-2 max-w-[85%] ${msg.role === "user" ? "bg-foreground text-background" : "bg-background border border-border"}`}>
                {msg.content}
              </span>
            </div>
          ))
        )}
        {busy && <div className="text-left"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 px-3 py-2 border border-border bg-background text-sm font-body rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary text-sm px-4 disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
};

export default StaffAssistant;
