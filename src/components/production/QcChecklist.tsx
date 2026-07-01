import type { QcTemplateItem, FieldState, QcState } from "@/lib/production";

const PassBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`text-xs font-typewriter uppercase tracking-wider px-2.5 py-1 border ${active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>
);
const FailBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={`text-xs font-typewriter uppercase tracking-wider px-2.5 py-1 border ${active ? "bg-destructive text-destructive-foreground border-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}>{children}</button>
);

const Field = ({ item, state, onChange }: { item: QcTemplateItem; state: FieldState | undefined; onChange: (patch: Partial<FieldState>) => void }) => {
  const passFail = (
    <span className="flex gap-1">
      <PassBtn active={state?.passed === true} onClick={() => onChange({ passed: true, value: state?.value || "pass" })}>Pass</PassBtn>
      <FailBtn active={state?.passed === false} onClick={() => onChange({ passed: false, value: state?.value || "fail" })}>Fail</FailBtn>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-body">{item.parameter}{item.gating && <span className="text-destructive"> *</span>}</p>
        {item.expected && <p className="text-xs font-body text-muted-foreground">Expected: {item.expected}</p>}
      </div>
      <div className="flex items-center gap-2">
        {item.input_type === "pass_fail" && passFail}
        {item.input_type === "boolean" && (
          <span className="flex gap-1">
            <PassBtn active={state?.value === "true"} onClick={() => onChange({ value: "true", passed: true })}>Yes</PassBtn>
            <FailBtn active={state?.value === "false"} onClick={() => onChange({ value: "false", passed: false })}>No</FailBtn>
          </span>
        )}
        {item.input_type === "numeric" && (
          <input type="number" placeholder="value" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
            className="w-24 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        )}
        {item.input_type === "date" && (
          <input type="date" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
            className="px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        )}
        {item.input_type === "text" && (
          <input type="text" placeholder="note" value={state?.value ?? ""} onChange={(e) => onChange({ value: e.target.value })}
            className="w-40 px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground" />
        )}
        {/* gating items that don't self-express a pass/fail still need a judgment */}
        {item.gating && (item.input_type === "numeric" || item.input_type === "date" || item.input_type === "text") && passFail}
      </div>
    </div>
  );
};

const QcChecklist = ({ items, state, onChange }: { items: QcTemplateItem[]; state: QcState; onChange: (param: string, patch: Partial<FieldState>) => void }) => (
  <div className="space-y-3">
    {items.map((it) => (
      <Field key={it.id} item={it} state={state[it.parameter]} onChange={(patch) => onChange(it.parameter, patch)} />
    ))}
  </div>
);

export default QcChecklist;
