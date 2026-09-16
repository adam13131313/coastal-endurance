import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  buildMyPostCsv,
  parseCsv,
  detectConsignmentColumns,
  matchConsignments,
  shortRef,
  type MatchResult,
  type ExportRow,
} from "@/lib/fulfilment";

// Batch dispatch via MyPost Business: export due parcels as the MyPost import
// CSV, then read the consignment export back to mark them shipped. Shipping
// emails follow the store's review-then-send rule — every matched parcel
// produces a draft (via ship-delivery) that is only emailed when the admin
// clicks Send on it here.

// New tables/views aren't in the generated types yet; same escape hatch as
// StockControl / WaitlistAdmin.
const sb = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ViewRow extends ExportRow {
  delivery_id: string;
  order_id: string;
  sequence: number;
  scheduled_for: string;
  exported_at: string | null;
  ordered_at: string;
}

interface DeliveryRow {
  id: string;
  status: string;
  tracking_number: string | null;
  sequence: number;
  orders: { shipping_name: string | null; email: string } | null;
}

interface Settings {
  send_from_name: string;
  send_from_business_name: string;
  send_from_address_line1: string;
  send_from_address_line2: string;
  send_from_suburb: string;
  send_from_state: string;
  send_from_postcode: string;
  send_from_phone: string;
  send_from_email: string;
  item_description: string;
  packaging_type: string;
  parcel_length_cm: number;
  parcel_width_cm: number;
  parcel_height_cm: number;
  parcel_weight_kg: number;
}

type Draft = { deliveryId: string; to: string; subject: string; text: string };

const localToday = () => new Date().toLocaleDateString("en-CA");

const rowName = (r: ViewRow) => String(r["Deliver To Name"] || r["Deliver To Email Address"] || "—");
const rowPlace = (r: ViewRow) =>
  [r["Deliver To Suburb"], r["Deliver To State"]].filter(Boolean).join(", ") || "—";
const rowService = (r: ViewRow) => (r["Item Delivery Service"] === "PP" ? "Parcel Post" : "Express Post");

const SENDER_FIELDS: Array<[keyof Settings, string]> = [
  ["send_from_name", "Name"],
  ["send_from_business_name", "Business name"],
  ["send_from_address_line1", "Address line 1"],
  ["send_from_address_line2", "Address line 2"],
  ["send_from_suburb", "Suburb"],
  ["send_from_state", "State"],
  ["send_from_postcode", "Postcode"],
  ["send_from_phone", "Phone"],
  ["send_from_email", "Email"],
];
const PARCEL_FIELDS: Array<[keyof Settings, string]> = [
  ["item_description", "Item description"],
  ["parcel_weight_kg", "Weight (kg)"],
  ["parcel_length_cm", "Length (cm)"],
  ["parcel_width_cm", "Width (cm)"],
  ["parcel_height_cm", "Height (cm)"],
];

const FulfilmentAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [includeExported, setIncludeExported] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Import state
  const [match, setMatch] = useState<MatchResult<DeliveryRow> | null>(null);
  const [importHeader, setImportHeader] = useState<string[]>([]);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ shipped: number; failed: number } | null>(null);

  // Shipping-email drafts awaiting review (nothing sends without a click).
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftIdx, setDraftIdx] = useState(0);
  const [sendingDraft, setSendingDraft] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, d, s] = await Promise.all([
      sb.from("fulfilment_export_v").select("*"),
      sb.from("order_deliveries").select("id, status, tracking_number, sequence, orders ( shipping_name, email )"),
      sb.from("fulfilment_settings").select("*").maybeSingle(),
    ]);
    if (v.error) console.error("fulfilment view load failed", v.error);
    if (d.error) console.error("deliveries load failed", d.error);
    setRows((v.data as ViewRow[]) ?? []);
    setDeliveries((d.data as DeliveryRow[]) ?? []);
    setSettings((s.data as Settings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = localToday();
  const { due, later, exported } = useMemo(() => {
    const unexported = rows.filter((r) => !r.exported_at);
    return {
      due: unexported.filter((r) => r.scheduled_for <= today),
      later: unexported.filter((r) => r.scheduled_for > today),
      exported: rows.filter((r) => r.exported_at),
    };
  }, [rows, today]);

  const senderMissing =
    !settings ||
    !settings.send_from_name.trim() ||
    !settings.send_from_address_line1.trim() ||
    !settings.send_from_suburb.trim() ||
    !settings.send_from_state.trim() ||
    !settings.send_from_postcode.trim();

  const exportTarget = includeExported ? [...due, ...exported] : due;

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await sb
      .from("fulfilment_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) toast.error("Couldn't save settings.");
    else toast.success("Settings saved.");
    setSavingSettings(false);
    await load();
  };

  const exportCsv = async () => {
    if (exportTarget.length === 0) return;
    setExporting(true);
    const csv = buildMyPostCsv(exportTarget);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mypost-orders-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Stamp only first-time exports so the original export date survives a
    // re-export (the "include exported" path).
    const fresh = exportTarget.filter((r) => !r.exported_at).map((r) => r.delivery_id);
    if (fresh.length > 0) {
      const { error } = await sb
        .from("order_deliveries")
        .update({ exported_at: new Date().toISOString() })
        .in("id", fresh);
      if (error) {
        toast.error("CSV downloaded, but marking the orders exported failed. Refresh and retry.");
      } else {
        toast.success(`Exported ${exportTarget.length} parcel${exportTarget.length === 1 ? "" : "s"} for MyPost.`);
      }
    } else {
      toast.success(`Re-exported ${exportTarget.length} parcel${exportTarget.length === 1 ? "" : "s"}.`);
    }
    setExporting(false);
    await load();
  };

  const readImportFile = async (file: File) => {
    setApplied(null);
    setOverwriteConfirmed(false);
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) {
      toast.error("That file has no data rows.");
      setMatch(null);
      return;
    }
    const cols = detectConsignmentColumns(parsed[0]);
    if ("error" in cols) {
      toast.error(cols.error);
      setMatch(null);
      setImportHeader(parsed[0]);
      return;
    }
    setImportHeader(parsed[0]);
    setMatch(matchConsignments(parsed.slice(1), cols, deliveries));
  };

  const applyImport = async () => {
    if (!match) return;
    const target = [...match.matched, ...(overwriteConfirmed ? match.conflicts : [])];
    if (target.length === 0) return;
    setApplying(true);
    let shipped = 0;
    let failed = 0;
    const newDrafts: Draft[] = [];
    for (const m of target) {
      const { data, error } = await supabase.functions.invoke("ship-delivery", {
        body: { deliveryId: m.delivery.id, trackingNumber: m.tracking, shippedOn: localToday() },
      });
      const res = data as { error?: string; draft?: Omit<Draft, "deliveryId"> | null } | null;
      if (error || res?.error) {
        failed += 1;
        console.error("ship-delivery failed", m.delivery.id, error || res?.error);
      } else {
        shipped += 1;
        if (res?.draft) newDrafts.push({ deliveryId: m.delivery.id, ...res.draft });
      }
    }
    setApplied({ shipped, failed });
    setApplying(false);
    setMatch(null);
    if (failed > 0) toast.error(`${failed} parcel${failed === 1 ? "" : "s"} couldn't be marked shipped.`);
    if (newDrafts.length > 0) {
      setDrafts(newDrafts);
      setDraftIdx(0);
      toast.success(`${shipped} marked shipped. Review the ${newDrafts.length} shipping email${newDrafts.length === 1 ? "" : "s"} before they go.`);
    } else if (shipped > 0) {
      toast.success(`${shipped} marked shipped.`);
    }
    await load();
  };

  const draft = drafts[draftIdx] ?? null;

  const sendDraft = async () => {
    if (!draft) return;
    setSendingDraft(true);
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: { deliveryId: draft.deliveryId, subject: draft.subject, text: draft.text },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error || "Email failed to send. The draft is still open — try again.");
    } else {
      toast.success(`Shipping email sent to ${draft.to}.`);
      nextDraft();
    }
    setSendingDraft(false);
  };

  const nextDraft = () => {
    if (draftIdx + 1 < drafts.length) setDraftIdx(draftIdx + 1);
    else { setDrafts([]); setDraftIdx(0); }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const Table = ({ list, showExportedAt }: { list: ViewRow[]; showExportedAt?: boolean }) => (
    <div className="border border-border divide-y divide-border">
      <div className="hidden sm:flex gap-4 p-3 text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
        <span className="w-28 shrink-0">Ref</span>
        <span className="flex-1">Name</span>
        <span className="w-40 shrink-0">Suburb / state</span>
        <span className="w-24 shrink-0">{showExportedAt ? "Exported" : "Due"}</span>
        <span className="w-24 shrink-0">Service</span>
      </div>
      {list.map((r) => (
        <div key={r.delivery_id} className="flex flex-wrap sm:flex-nowrap gap-x-4 gap-y-1 p-3 text-sm font-body">
          <span className="w-28 shrink-0 font-typewriter text-xs pt-0.5">{String(r["Additional Label Information 1"])}</span>
          <span className="flex-1 min-w-[140px]">{rowName(r)}</span>
          <span className="w-40 shrink-0 text-muted-foreground">{rowPlace(r)}</span>
          <span className={`w-24 shrink-0 ${!showExportedAt && r.scheduled_for < today ? "font-medium" : "text-muted-foreground"}`}>
            {showExportedAt ? (r.exported_at ?? "").slice(0, 10) : r.scheduled_for}
          </span>
          <span className="w-24 shrink-0 text-muted-foreground">{rowService(r)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-10 max-w-[900px]">
      {/* ------------------------------------------------ sender & parcel */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-typewriter text-sm uppercase tracking-widest">Batch dispatch (MyPost Business)</h2>
          <button onClick={() => setShowSettings((s) => !s)} className="text-xs font-body text-muted-foreground hover:text-foreground">
            {showSettings ? "Hide settings" : "Sender & parcel settings"}
          </button>
        </div>
        {senderMissing && (
          <p className="mt-2 text-sm font-body text-foreground border border-foreground p-3">
            Fill in the sender details before exporting — MyPost's import file requires the send-from
            name and address on every row.
          </p>
        )}
        {showSettings && settings && (
          <div className="mt-4 border border-border p-4 space-y-4">
            <div>
              <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Send from</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SENDER_FIELDS.map(([key, label]) => (
                  <label key={key} className="text-xs font-body">
                    <span className="block text-muted-foreground mb-0.5">{label}</span>
                    <input
                      value={String(settings[key] ?? "")}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                      className="w-full px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Parcel</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {PARCEL_FIELDS.map(([key, label]) => (
                  <label key={key} className="text-xs font-body">
                    <span className="block text-muted-foreground mb-0.5">{label}</span>
                    <input
                      value={String(settings[key] ?? "")}
                      onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                      className="w-full px-2 py-1 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </label>
                ))}
              </div>
            </div>
            <button onClick={saveSettings} disabled={savingSettings} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">
              {savingSettings ? "…" : "Save settings"}
            </button>
          </div>
        )}
      </section>

      {/* ------------------------------------------------ export */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground">
            To export — due now ({due.length})
          </h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
              <input type="checkbox" checked={includeExported} onChange={(e) => setIncludeExported(e.target.checked)} />
              include already-exported ({exported.length})
            </label>
            <button
              onClick={exportCsv}
              disabled={exporting || senderMissing || exportTarget.length === 0}
              className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
            >
              {exporting ? "…" : `Export MyPost CSV (${exportTarget.length})`}
            </button>
          </div>
        </div>
        {due.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">Nothing due for export. ✓</p>
        ) : (
          <Table list={due} />
        )}
        {later.length > 0 && (
          <p className="mt-2 text-xs font-body text-muted-foreground">
            {later.length} future shipment{later.length === 1 ? "" : "s"} (12-month bundles) not included —
            they join the list on their scheduled date.
          </p>
        )}
      </section>

      {/* ------------------------------------------------ exported, awaiting tracking */}
      <section>
        <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Exported, awaiting tracking ({exported.length})
        </h3>
        {exported.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">None — import the consignment CSV below after buying labels.</p>
        ) : (
          <Table list={exported} showExportedAt />
        )}
      </section>

      {/* ------------------------------------------------ import tracking */}
      <section>
        <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Import tracking</h3>
        <p className="font-body text-sm text-muted-foreground mb-3">
          Upload the consignment CSV downloaded from MyPost Business. Rows are matched to parcels by the
          CE reference on the label; each match is marked shipped and its notification email opens as a
          draft for you to review and send.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readImportFile(f); e.target.value = ""; }}
          className="block text-sm font-body file:mr-3 file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-typewriter file:uppercase file:tracking-wider file:cursor-pointer"
        />

        {match && (
          <div className="mt-4 border border-border p-4 space-y-4">
            <p className="font-body text-sm">
              <strong>{match.matched.length}</strong> matched ·{" "}
              <strong>{match.alreadyShipped.length}</strong> already shipped ·{" "}
              <strong>{match.conflicts.length}</strong> with an existing tracking number ·{" "}
              <strong>{match.unmatched.length}</strong> unmatched
            </p>

            {match.matched.length > 0 && (
              <ul className="text-sm font-body text-muted-foreground space-y-1">
                {match.matched.map((m) => (
                  <li key={m.delivery.id}>
                    {shortRef(m.delivery.id)} — {m.delivery.orders?.shipping_name || m.delivery.orders?.email || "?"} → #{m.tracking}
                  </li>
                ))}
              </ul>
            )}

            {match.conflicts.length > 0 && (
              <div className="border border-foreground p-3">
                <p className="font-body text-sm mb-2">
                  These already carry a tracking number (or are already shipped). They are skipped unless you confirm the overwrite:
                </p>
                <ul className="text-sm font-body text-muted-foreground space-y-1 mb-2">
                  {match.conflicts.map((m) => (
                    <li key={m.delivery.id}>
                      {shortRef(m.delivery.id)} — {m.delivery.orders?.shipping_name || m.delivery.orders?.email || "?"}:
                      {" "}#{m.delivery.tracking_number || "none"} → #{m.tracking}
                    </li>
                  ))}
                </ul>
                <label className="flex items-center gap-1.5 text-xs font-body">
                  <input type="checkbox" checked={overwriteConfirmed} onChange={(e) => setOverwriteConfirmed(e.target.checked)} />
                  overwrite these tracking numbers
                </label>
              </div>
            )}

            {match.unmatched.length > 0 && (
              <div>
                <p className="font-body text-sm mb-2">Unmatched rows (fix these by hand on the To ship tab):</p>
                <div className="overflow-x-auto border border-border">
                  <table className="text-xs font-body whitespace-nowrap">
                    <thead>
                      <tr>{importHeader.map((h, i) => <th key={i} className="text-left p-2 border-b border-border font-normal text-muted-foreground">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {match.unmatched.map((r, i) => (
                        <tr key={i} className="border-b border-border last:border-b-0">
                          {importHeader.map((_, j) => <td key={j} className="p-2">{r[j] ?? ""}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={applyImport}
              disabled={applying || match.matched.length + (overwriteConfirmed ? match.conflicts.length : 0) === 0}
              className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
            >
              {applying
                ? "Marking shipped…"
                : `Mark ${match.matched.length + (overwriteConfirmed ? match.conflicts.length : 0)} shipped & prepare emails`}
            </button>
          </div>
        )}

        {applied && (
          <p className="mt-3 font-body text-sm text-muted-foreground">
            Done: {applied.shipped} marked shipped{applied.failed > 0 ? `, ${applied.failed} failed (see console)` : ""}.
          </p>
        )}
      </section>

      {/* ------------------------------------------------ email review queue */}
      {draft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-lg p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-typewriter text-sm uppercase tracking-widest">
                Shipping email {draftIdx + 1} of {drafts.length} — review before it goes
              </h3>
              <span className="text-xs font-body text-muted-foreground">to {draft.to}</span>
            </div>
            <label className="block text-sm mb-3">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Subject</span>
              <input
                value={draft.subject}
                onChange={(e) => setDrafts((ds) => ds.map((d, i) => (i === draftIdx ? { ...d, subject: e.target.value } : d)))}
                className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </label>
            <label className="block text-sm mb-4">
              <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Message (edit freely)</span>
              <textarea
                value={draft.text}
                onChange={(e) => setDrafts((ds) => ds.map((d, i) => (i === draftIdx ? { ...d, text: e.target.value } : d)))}
                rows={12}
                className="w-full px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground leading-relaxed"
              />
            </label>
            <div className="flex items-center gap-2">
              <button onClick={sendDraft} disabled={sendingDraft} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
                {sendingDraft ? "…" : "Send email"}
              </button>
              <button onClick={nextDraft} disabled={sendingDraft} className="ml-auto text-xs font-body text-muted-foreground hover:text-foreground">
                {draftIdx + 1 < drafts.length ? "Skip — don't send this one" : "Skip — done"}
              </button>
            </div>
            <p className="mt-3 text-[11px] font-body text-muted-foreground">
              The parcels are already marked shipped. Send email = emails this customer (reply-to hello@) and logs it.
              Skip = no email for this parcel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FulfilmentAdmin;
