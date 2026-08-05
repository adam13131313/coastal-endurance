import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/production";
import type { BatchResults } from "@/lib/batchCalc";

// Purchasing: paste a supplier order confirmation, AI-parse it, review, save.
// POs link to a saved batch sizing so coverage (required vs ordered vs
// outstanding) is visible per ingredient. Receiving a PO pre-fills
// raw_material_lots, which drop into the existing incoming-QC gate.

interface PoItem {
  id?: string;
  line_no: number;
  product_code: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  unit_price_cents: number | null;
  gst_pct: number | null;
  total_cents: number | null;
  raw_material_id: string | null;
  packaging_component_id: string | null;
  qty_in_base: number | null;
  base_unit: "L" | "kg" | "units" | null;
}
interface Po {
  id: string;
  supplier: string;
  supplier_order_no: string | null;
  customer_no: string | null;
  order_date: string | null;
  currency: string;
  subtotal_ex_gst_cents: number | null;
  shipping_cents: number | null;
  gst_cents: number | null;
  total_cents: number | null;
  payment_method: string | null;
  payment_ref: string | null;
  status: "draft" | "ordered" | "received" | "cancelled";
  batch_calculation_id: string | null;
  raw_text: string | null;
  notes: string | null;
  received_at: string | null;
  created_at: string;
  archived_at: string | null;
  purchase_order_items: PoItem[];
}
interface Candidate { id: string; kind: "raw_material" | "packaging_component"; name: string; }
interface PoDoc {
  id: string; doc_type: string; file_url: string | null; raw_text: string | null;
  uploaded_by: string | null; uploaded_at: string;
}
const DOC_TYPES = [
  { key: "payment_receipt", label: "Payment receipt" },
  { key: "tax_invoice", label: "Tax invoice" },
  { key: "order_confirmation", label: "Order confirmation" },
  { key: "shipping", label: "Shipping / delivery" },
  { key: "other", label: "Other" },
];
interface SavedBatchLite {
  id: string; batch_ref: string; label: string; archived_at: string | null;
  results_snapshot: BatchResults;
}

// Draft (review-form) state: header + line strings for caret-safe editing.
interface DraftItem {
  line_no: number; product_code: string; name: string; quantity: string; unit: string;
  unit_price: string; total: string; match: string; qty_in_base: string; base_unit: "" | "L" | "kg" | "units";
}
interface Draft {
  supplier: string; supplier_order_no: string; customer_no: string; order_date: string;
  currency: string; payment_method: string; payment_ref: string;
  subtotal: string; shipping: string; gst: string; total: string;
  batch_id: string; notes: string; raw_text: string; parsed_by: "ai" | "manual";
  items: DraftItem[]; warnings: string[];
  editingPoId: string | null;              // set = update that PO instead of inserting
  saveAsStatus: "draft" | "ordered";       // drafts stay drafts; attached confirmations flip to ordered
}

const BLANK_ITEM: DraftItem = { line_no: 1, product_code: "", name: "", quantity: "1", unit: "", unit_price: "", total: "", match: "", qty_in_base: "", base_unit: "" };
const blankDraft = (): Draft => ({
  supplier: "", supplier_order_no: "", customer_no: "", order_date: "", currency: "AUD",
  payment_method: "", payment_ref: "", subtotal: "", shipping: "", gst: "", total: "",
  batch_id: "", notes: "", raw_text: "", parsed_by: "manual", items: [{ ...BLANK_ITEM }], warnings: [],
  editingPoId: null, saveAsStatus: "ordered",
});

const num = (s: string): number | null => {
  const v = Number(s);
  return s.trim() !== "" && Number.isFinite(v) ? v : null;
};
const dollarsToCents = (s: string): number | null => {
  const v = num(s);
  return v == null ? null : Math.round(v * 100);
};
const centsToDollars = (c: number | null): string => (c == null ? "" : (c / 100).toFixed(2));
const fmtMoney = (c: number | null, cur = "AUD") => (c == null ? "—" : `${cur === "AUD" ? "A$" : cur + " "}${(c / 100).toFixed(2)}`);
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—");

const inputCls = "px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground";
const cellCls = "w-full px-1.5 py-1 border border-border bg-background text-xs rounded-none focus:outline-none focus:ring-1 focus:ring-foreground";

const Purchasing = () => {
  const [pos, setPos] = useState<Po[]>([]);
  const [batches, setBatches] = useState<SavedBatchLite[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [pasteText, setPasteText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [attachFor, setAttachFor] = useState<Po | null>(null); // draft PO awaiting its confirmation
  const [viewing, setViewing] = useState<Po | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [coverageBatch, setCoverageBatch] = useState<string>("");

  // Records retention: supporting documents per PO (payment receipts, tax
  // invoices…). Pasted text or uploaded file; kept permanently, no delete UI.
  const [docs, setDocs] = useState<PoDoc[]>([]);
  const [docKind, setDocKind] = useState("payment_receipt");
  const [docText, setDocText] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docOpen, setDocOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: poData }, { data: batchData }, { data: mats }, { data: comps }] = await Promise.all([
      sb.from("purchase_orders").select("*, purchase_order_items(*)").order("created_at", { ascending: false }),
      sb.from("batch_calculations").select("id, batch_ref, label, archived_at, results_snapshot").order("created_at", { ascending: false }),
      sb.from("raw_materials").select("id, name").eq("active", true),
      sb.from("packaging_components").select("id, name").eq("active", true),
    ]);
    setPos((poData as Po[]) ?? []);
    const bs = ((batchData as SavedBatchLite[]) ?? []).filter((b) => !b.archived_at);
    setBatches(bs);
    setCoverageBatch((c) => c || bs[0]?.id || "");
    setCandidates([
      ...(((mats as { id: string; name: string }[]) ?? []).map((m) => ({ id: m.id, kind: "raw_material" as const, name: m.name }))),
      ...(((comps as { id: string; name: string }[]) ?? []).map((c) => ({ id: c.id, kind: "packaging_component" as const, name: c.name }))),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!viewing) { setDocs([]); return; }
    (async () => {
      const { data } = await sb.from("production_documents")
        .select("id, doc_type, file_url, raw_text, uploaded_by, uploaded_at")
        .eq("entity_type", "purchase_order").eq("entity_id", viewing.id)
        .order("uploaded_at", { ascending: false });
      setDocs((data as PoDoc[]) ?? []);
    })();
  }, [viewing]);

  const addDoc = async () => {
    if (!viewing) return;
    if (!docText.trim() && !docFile) { toast.error("Paste the document text or choose a file."); return; }
    setBusy("doc");
    const { data: userData } = await supabase.auth.getUser();
    let filePath: string | null = null;
    if (docFile) {
      filePath = `purchase-order/${viewing.id}/${Date.now()}-${docFile.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("production-docs").upload(filePath, docFile);
      if (upErr) { setBusy(null); toast.error("Upload failed."); return; }
    }
    const { error } = await sb.from("production_documents").insert({
      doc_type: docKind,
      entity_type: "purchase_order",
      entity_id: viewing.id,
      file_url: filePath,
      raw_text: docText.trim() || null,
      uploaded_by: userData?.user?.email ?? null,
    });
    setBusy(null);
    if (error) { toast.error("Couldn't save the record."); return; }
    toast.success("Record retained.");
    setDocText(""); setDocFile(null);
    const { data } = await sb.from("production_documents")
      .select("id, doc_type, file_url, raw_text, uploaded_by, uploaded_at")
      .eq("entity_type", "purchase_order").eq("entity_id", viewing.id)
      .order("uploaded_at", { ascending: false });
    setDocs((data as PoDoc[]) ?? []);
  };

  const openDocFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("production-docs").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error("Couldn't open the file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const candidateById = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);

  // ----------------------------------------------------------------- parse
  const parse = async () => {
    if (pasteText.trim().length < 40) { toast.error("Paste the whole confirmation first."); return; }
    setBusy("parse");
    const { data, error } = await supabase.functions.invoke("parse-purchase-order", { body: { text: pasteText } });
    setBusy(null);
    const err = error || (data as { error?: string })?.error;
    if (err) { toast.error(typeof err === "string" ? err : "Couldn't parse that."); return; }
    const p = (data as { parsed: Record<string, unknown> }).parsed as {
      supplier?: string; supplier_order_no?: string | null; customer_no?: string | null; order_date?: string | null;
      currency?: string; payment_method?: string | null; payment_ref?: string | null;
      subtotal_ex_gst_cents?: number | null; shipping_cents?: number | null; gst_cents?: number | null; total_cents?: number | null;
      items?: Array<{ line_no?: number; product_code?: string | null; name?: string; quantity?: number; unit?: string | null; unit_price_cents?: number | null; gst_pct?: number | null; total_cents?: number | null; match_id?: string | null; qty_in_base?: number | null; base_unit?: "L" | "kg" | "units" | null }>;
      warnings?: string[];
    };
    setDraft({
      supplier: p.supplier ?? attachFor?.supplier ?? "",
      supplier_order_no: p.supplier_order_no ?? "",
      customer_no: p.customer_no ?? "",
      order_date: p.order_date ?? "",
      currency: p.currency ?? "AUD",
      payment_method: p.payment_method ?? "",
      payment_ref: p.payment_ref ?? "",
      subtotal: centsToDollars(p.subtotal_ex_gst_cents ?? null),
      shipping: centsToDollars(p.shipping_cents ?? null),
      gst: centsToDollars(p.gst_cents ?? null),
      total: centsToDollars(p.total_cents ?? null),
      batch_id: attachFor?.batch_calculation_id ?? batches[0]?.id ?? "",
      notes: attachFor?.notes ?? "",
      raw_text: pasteText,
      parsed_by: "ai",
      editingPoId: attachFor?.id ?? null,
      saveAsStatus: "ordered",
      items: (p.items ?? []).map((it, i) => ({
        line_no: it.line_no ?? i + 1,
        product_code: it.product_code ?? "",
        name: it.name ?? "",
        quantity: String(it.quantity ?? 1),
        unit: it.unit ?? "",
        unit_price: centsToDollars(it.unit_price_cents ?? null),
        total: centsToDollars(it.total_cents ?? null),
        match: it.match_id ?? "",
        qty_in_base: it.qty_in_base != null ? String(it.qty_in_base) : "",
        base_unit: it.base_unit ?? "",
      })),
      warnings: p.warnings ?? [],
    });
    toast.success("Parsed. Review before saving.");
  };

  // ----------------------------------------------------------------- save
  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.supplier.trim()) { toast.error("Supplier is required."); return; }
    const items = draft.items.filter((i) => i.name.trim());
    if (items.length === 0) { toast.error("At least one line item."); return; }
    setBusy("save");
    const { data: userData } = await supabase.auth.getUser();
    const header = {
      supplier: draft.supplier.trim(),
      supplier_order_no: draft.supplier_order_no.trim() || null,
      customer_no: draft.customer_no.trim() || null,
      order_date: draft.order_date || null,
      currency: draft.currency || "AUD",
      payment_method: draft.payment_method.trim() || null,
      payment_ref: draft.payment_ref.trim() || null,
      subtotal_ex_gst_cents: dollarsToCents(draft.subtotal),
      shipping_cents: dollarsToCents(draft.shipping),
      gst_cents: dollarsToCents(draft.gst),
      total_cents: dollarsToCents(draft.total),
      batch_calculation_id: draft.batch_id || null,
      raw_text: draft.raw_text || null,
      parsed_by: draft.parsed_by,
      notes: draft.notes.trim() || null,
    };
    let poId: string | null = null;
    if (draft.editingPoId) {
      const { error } = await sb.from("purchase_orders")
        .update({ ...header, status: draft.saveAsStatus })
        .eq("id", draft.editingPoId);
      if (error) { setBusy(null); toast.error("Couldn't update the order."); return; }
      await sb.from("purchase_order_items").delete().eq("purchase_order_id", draft.editingPoId);
      poId = draft.editingPoId;
    } else {
      const { data: po, error } = await sb.from("purchase_orders").insert({
        ...header,
        status: draft.saveAsStatus,
        created_by: userData?.user?.id ?? null,
      }).select("id").single();
      if (error || !po) { setBusy(null); toast.error("Couldn't save the order."); return; }
      poId = (po as { id: string }).id;
    }
    const { error: itemErr } = await sb.from("purchase_order_items").insert(items.map((i, idx) => {
      const cand = i.match ? candidateById.get(i.match) : undefined;
      return {
        purchase_order_id: poId,
        line_no: i.line_no || idx + 1,
        product_code: i.product_code.trim() || null,
        name: i.name.trim(),
        quantity: num(i.quantity) ?? 1,
        unit: i.unit.trim() || null,
        unit_price_cents: dollarsToCents(i.unit_price),
        total_cents: dollarsToCents(i.total),
        raw_material_id: cand?.kind === "raw_material" ? cand.id : null,
        packaging_component_id: cand?.kind === "packaging_component" ? cand.id : null,
        qty_in_base: num(i.qty_in_base),
        base_unit: i.base_unit || null,
      };
    }));
    setBusy(null);
    if (itemErr) { toast.error("Order saved but line items failed; edit it in the list."); }
    else toast.success(draft.editingPoId ? (draft.saveAsStatus === "ordered" ? "Confirmation attached — order is live." : "Draft updated.") : "Order logged.");
    setDraft(null); setPasteText(""); setAttachFor(null);
    load();
  };

  // Load an existing PO into the review form (edit a draft, or fix a live one).
  const loadPoIntoForm = (po: Po, saveAsStatus: "draft" | "ordered") => {
    setViewing(null);
    setDraft({
      supplier: po.supplier,
      supplier_order_no: po.supplier_order_no ?? "",
      customer_no: po.customer_no ?? "",
      order_date: po.order_date ?? "",
      currency: po.currency,
      payment_method: po.payment_method ?? "",
      payment_ref: po.payment_ref ?? "",
      subtotal: centsToDollars(po.subtotal_ex_gst_cents),
      shipping: centsToDollars(po.shipping_cents),
      gst: centsToDollars(po.gst_cents),
      total: centsToDollars(po.total_cents),
      batch_id: po.batch_calculation_id ?? "",
      notes: po.notes ?? "",
      raw_text: po.raw_text ?? "",
      parsed_by: "manual",
      editingPoId: po.id,
      saveAsStatus,
      warnings: [],
      items: po.purchase_order_items.sort((a, b) => a.line_no - b.line_no).map((i) => ({
        line_no: i.line_no,
        product_code: i.product_code ?? "",
        name: i.name,
        quantity: String(Number(i.quantity)),
        unit: i.unit ?? "",
        unit_price: centsToDollars(i.unit_price_cents),
        total: centsToDollars(i.total_cents),
        match: i.raw_material_id ?? i.packaging_component_id ?? "",
        qty_in_base: i.qty_in_base != null ? String(Number(i.qty_in_base)) : "",
        base_unit: (i.base_unit ?? "") as DraftItem["base_unit"],
      })),
    });
  };

  const deleteDraft = async (po: Po) => {
    if (po.status !== "draft") return;
    if (!confirm(`Delete the ${po.supplier} draft? Drafts aren't records yet, so this removes it completely.`)) return;
    await sb.from("purchase_order_items").delete().eq("purchase_order_id", po.id);
    await sb.from("purchase_orders").delete().eq("id", po.id);
    setViewing(null); load();
    toast.success("Draft deleted.");
  };

  // ----------------------------------------------------------------- receive
  const receive = async (po: Po) => {
    const matched = po.purchase_order_items.filter((i) => i.raw_material_id);
    const msg = matched.length > 0
      ? `Mark ${po.supplier} #${po.supplier_order_no ?? ""} received and create ${matched.length} raw-material lot(s) in quarantine for incoming QC?`
      : `Mark ${po.supplier} #${po.supplier_order_no ?? ""} received? (No lines are matched to raw materials, so no lots will be created.)`;
    if (!confirm(msg)) return;
    setBusy(po.id);
    for (const item of matched) {
      // Lot quantity: prefer normalised kg (lots are tracked in g); litres
      // convert at density if known; otherwise store as received-units note.
      let qty = item.qty_in_base ?? item.quantity;
      let unit = "g";
      if (item.base_unit === "kg") qty = (item.qty_in_base ?? 0) * 1000;
      else if (item.base_unit === "L") { qty = (item.qty_in_base ?? 0) * 1000; unit = "ml"; }
      else { qty = item.qty_in_base ?? item.quantity; unit = item.base_unit ?? item.unit ?? "units"; }
      await sb.from("raw_material_lots").insert({
        raw_material_id: item.raw_material_id,
        supplier: po.supplier,
        supplier_lot_number: null,
        qty_received: qty,
        unit,
        qty_remaining: qty,
        received_date: new Date().toISOString().slice(0, 10),
        status: "quarantine",
      });
    }
    await sb.from("purchase_orders").update({ status: "received", received_at: new Date().toISOString() }).eq("id", po.id);
    setBusy(null);
    toast.success(matched.length > 0
      ? `Received. ${matched.length} lot(s) created in quarantine — add supplier lot numbers and run incoming QC under Materials.`
      : "Marked received.");
    setViewing(null);
    load();
  };

  const setStatus = async (po: Po, status: Po["status"]) => {
    await sb.from("purchase_orders").update({ status }).eq("id", po.id);
    setViewing(null); load();
  };
  const archivePo = async (po: Po, unarchive = false) => {
    await sb.from("purchase_orders").update({ archived_at: unarchive ? null : new Date().toISOString() }).eq("id", po.id);
    setViewing(null); load();
    toast.success(unarchive ? "Unarchived." : "Archived.");
  };

  // ----------------------------------------------------------------- coverage
  const coverage = useMemo(() => {
    const batch = batches.find((b) => b.id === coverageBatch);
    if (!batch?.results_snapshot?.ingredients) return null;
    const relevant = pos.filter((p) => p.batch_calculation_id === batch.id && p.status !== "cancelled" && p.status !== "draft" && !p.archived_at);
    const orderedByMaterialName = new Map<string, { qty: number; unit: string; sources: string[] }>();
    for (const po of relevant) {
      for (const item of po.purchase_order_items) {
        if (!item.raw_material_id || item.qty_in_base == null || !item.base_unit) continue;
        const cand = candidateById.get(item.raw_material_id);
        if (!cand) continue;
        const cur = orderedByMaterialName.get(cand.name) ?? { qty: 0, unit: item.base_unit, sources: [] };
        if (cur.unit === item.base_unit) cur.qty += item.qty_in_base;
        cur.sources.push(`${po.supplier}${po.supplier_order_no ? " #" + po.supplier_order_no : ""}`);
        orderedByMaterialName.set(cand.name, cur);
      }
    }
    return {
      batch,
      rows: batch.results_snapshot.ingredients.map((ing) => {
        const required = ing.packUnit === "kg" ? (ing.orderMassG / 1000) : ing.orderVolumeMl != null ? ing.orderVolumeMl / 1000 : ing.orderMassG / 1000;
        const requiredUnit = ing.packUnit ?? (ing.orderVolumeMl != null ? "L" : "kg");
        const ordered = orderedByMaterialName.get(ing.name);
        const orderedQty = ordered && ordered.unit === requiredUnit ? ordered.qty : ordered?.qty ?? 0;
        const unitMismatch = ordered != null && ordered.unit !== requiredUnit;
        return {
          name: ing.name,
          required,
          requiredUnit,
          ordered: ordered ? orderedQty : 0,
          orderedUnit: ordered?.unit ?? requiredUnit,
          unitMismatch,
          outstanding: Math.max(0, required - (ordered && !unitMismatch ? orderedQty : 0)),
          sources: ordered?.sources ?? [],
        };
      }),
    };
  }, [batches, coverageBatch, pos, candidateById]);

  if (loading) return <p className="font-body text-muted-foreground">Loading purchasing…</p>;

  // ----------------------------------------------------------------- PO detail
  if (viewing) {
    const po = viewing;
    return (
      <div className="space-y-6 max-w-[860px]">
        <div className="border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-typewriter text-sm uppercase tracking-widest">
              {po.supplier} {po.supplier_order_no && `#${po.supplier_order_no}`}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 uppercase tracking-widest ${po.status === "received" ? "bg-foreground text-background" : po.status === "cancelled" ? "border border-border text-muted-foreground line-through" : po.status === "draft" ? "border border-dashed border-foreground" : "border border-foreground"}`}>
                {po.status}
              </span>
              {po.archived_at && <span className="ml-2 text-muted-foreground text-xs">(archived)</span>}
            </p>
            <button onClick={() => setViewing(null)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">← Back</button>
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Meta label="Order date" value={fmtDate(po.order_date)} />
            <div>
              <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">Batch</p>
              <select
                value={po.batch_calculation_id ?? ""}
                onChange={async (e) => {
                  const v = e.target.value || null;
                  await sb.from("purchase_orders").update({ batch_calculation_id: v }).eq("id", po.id);
                  setViewing({ ...po, batch_calculation_id: v });
                  toast.success(v ? "Linked to batch." : "Unlinked.");
                  load();
                }}
                className="mt-0.5 w-full px-1.5 py-1 border border-border bg-background text-xs rounded-none focus:outline-none focus:ring-1 focus:ring-foreground"
              >
                <option value="">— none —</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_ref} · {b.label}</option>)}
              </select>
            </div>
            <Meta label="Total (inc GST)" value={fmtMoney(po.total_cents, po.currency)} />
            <Meta label="Logged" value={fmtDate(po.created_at)} />
            <Meta label="Payment" value={po.payment_method ?? "—"} />
            <Meta label="Payment ref" value={po.payment_ref ?? "—"} />
            <Meta label="Shipping (ex)" value={fmtMoney(po.shipping_cents, po.currency)} />
            <Meta label="GST" value={fmtMoney(po.gst_cents, po.currency)} />
          </div>
          {po.notes && <p className="mt-3 text-sm font-body text-muted-foreground">{po.notes}</p>}

          <div className="mt-4 border border-border divide-y divide-border">
            {po.purchase_order_items.sort((a, b) => a.line_no - b.line_no).map((i) => (
              <div key={i.id} className="px-3 py-2 text-sm font-body flex flex-wrap justify-between gap-2">
                <span>
                  {i.name}
                  {i.product_code && <span className="ml-2 text-[10px] font-typewriter text-muted-foreground">{i.product_code}</span>}
                  <span className="block text-xs text-muted-foreground">
                    {i.quantity} {i.unit ?? ""}{i.qty_in_base != null ? ` = ${i.qty_in_base} ${i.base_unit}` : ""}
                    {i.raw_material_id ? ` · ${candidateById.get(i.raw_material_id)?.name ?? "material"}` : i.packaging_component_id ? ` · ${candidateById.get(i.packaging_component_id)?.name ?? "packaging"}` : " · unmatched"}
                  </span>
                </span>
                <span className="tabular-nums">{fmtMoney(i.total_cents, po.currency)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {po.status === "draft" && (
              <>
                <button onClick={() => { setAttachFor(po); setViewing(null); }} className="btn-primary text-xs px-4 py-2">Attach confirmation</button>
                <button onClick={() => loadPoIntoForm(po, "draft")} className="btn-outline text-xs px-3 py-1.5">Edit draft</button>
                <button onClick={() => setStatus(po, "ordered")} className="btn-outline text-xs px-3 py-1.5">Mark ordered (no confirmation)</button>
                <button onClick={() => deleteDraft(po)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-destructive px-2">Delete draft</button>
              </>
            )}
            {po.status === "ordered" && (
              <button onClick={() => receive(po)} disabled={busy === po.id} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === po.id ? "…" : "Receive (create QC lots)"}</button>
            )}
            {po.status === "ordered" && <button onClick={() => setStatus(po, "cancelled")} className="btn-outline text-xs px-3 py-1.5">Cancel order</button>}
            {po.status === "cancelled" && <button onClick={() => setStatus(po, "ordered")} className="btn-outline text-xs px-3 py-1.5">Reopen</button>}
            {po.archived_at
              ? <button onClick={() => archivePo(po, true)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground px-2">Unarchive</button>
              : <button onClick={() => archivePo(po)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground px-2">Archive</button>}
          </div>

          {po.raw_text && (
            <details className="mt-4">
              <summary className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground cursor-pointer">Original confirmation text</summary>
              <pre className="mt-2 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap border border-border p-3 max-h-64 overflow-y-auto">{po.raw_text}</pre>
            </details>
          )}
        </div>

        {/* Records: supporting documents, retained permanently (no delete). */}
        <div className="border border-border p-4">
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">Records</p>
          <p className="mt-1 text-xs font-body text-muted-foreground">
            Payment receipts, tax invoices, delivery notices. Paste the text or attach the file; records are kept permanently against this order.
          </p>

          {docs.length > 0 && (
            <div className="mt-3 border border-border divide-y divide-border">
              {docs.map((d) => (
                <div key={d.id} className="px-3 py-2 text-sm font-body">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-typewriter text-[10px] uppercase tracking-widest border border-border px-1.5 py-0.5 mr-2">
                        {DOC_TYPES.find((t) => t.key === d.doc_type)?.label ?? d.doc_type}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDate(d.uploaded_at)}{d.uploaded_by ? ` · ${d.uploaded_by}` : ""}</span>
                    </span>
                    <span className="flex gap-2">
                      {d.raw_text && (
                        <button onClick={() => setDocOpen(docOpen === d.id ? null : d.id)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">
                          {docOpen === d.id ? "Close" : "View"}
                        </button>
                      )}
                      {d.file_url && (
                        <button onClick={() => openDocFile(d.file_url as string)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">
                          Open file
                        </button>
                      )}
                    </span>
                  </div>
                  {docOpen === d.id && d.raw_text && (
                    <pre className="mt-2 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap border border-border p-3 max-h-64 overflow-y-auto">{d.raw_text}</pre>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <select value={docKind} onChange={(e) => setDocKind(e.target.value)} className={`${inputCls} text-xs`}>
                {DOC_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <input
                type="file"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="text-xs font-body text-muted-foreground"
              />
            </div>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              rows={3}
              placeholder="…or paste the receipt / invoice text here, verbatim"
              className={`${inputCls} w-full font-mono text-xs leading-relaxed`}
            />
            <button onClick={addDoc} disabled={busy === "doc"} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-50">
              {busy === "doc" ? "…" : "Retain record"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------- main
  return (
    <div className="space-y-8 max-w-[900px]">
      <div>
        <h3 className="font-typewriter text-lg uppercase tracking-wider">Purchasing</h3>
        <p className="mt-1 text-sm font-body text-muted-foreground">
          Paste a supplier order confirmation, parse it, review, save. Orders link to a saved batch so coverage stays visible; receiving creates quarantined lots for incoming QC.
        </p>
      </div>

      {/* Capture */}
      {!draft && (
        <section className={`border p-4 space-y-3 ${attachFor ? "border-foreground border-2" : "border-border"}`}>
          <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">
            {attachFor ? (
              <>Attach confirmation to the <span className="text-foreground">{attachFor.supplier}</span> draft
                <button onClick={() => setAttachFor(null)} className="ml-3 text-muted-foreground hover:text-foreground normal-case tracking-normal font-body">(cancel)</button>
              </>
            ) : "Log an order"}
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder="Paste the whole order confirmation here (webshop page or email, any format, mess and all)…"
            className={`${inputCls} w-full font-mono text-xs leading-relaxed`}
          />
          <div className="flex gap-2">
            <button onClick={parse} disabled={busy === "parse"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "parse" ? "Parsing…" : "Parse"}</button>
            <button onClick={() => setDraft(blankDraft())} className="btn-outline text-xs px-3 py-1.5">Enter manually</button>
          </div>
        </section>
      )}

      {/* Review form */}
      {draft && (
        <section className="border-2 border-foreground p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-typewriter text-[11px] uppercase tracking-widest">
              Review before saving {draft.parsed_by === "ai" && <span className="ml-1 text-muted-foreground">(AI-parsed — check the numbers)</span>}
            </p>
            <button onClick={() => setDraft(null)} className="text-xs font-body text-muted-foreground hover:text-foreground">Discard</button>
          </div>

          {draft.warnings.length > 0 && (
            <ul className="border border-border bg-secondary px-3 py-2 space-y-1">
              {draft.warnings.map((w, i) => <li key={i} className="text-xs font-body">⚠ {w}</li>)}
            </ul>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <L label="Supplier *"><input value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Order no."><input value={draft.supplier_order_no} onChange={(e) => setDraft({ ...draft, supplier_order_no: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Customer no."><input value={draft.customer_no} onChange={(e) => setDraft({ ...draft, customer_no: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Order date"><input type="date" value={draft.order_date} onChange={(e) => setDraft({ ...draft, order_date: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Subtotal ex GST"><input value={draft.subtotal} inputMode="decimal" onChange={(e) => setDraft({ ...draft, subtotal: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Shipping ex GST"><input value={draft.shipping} inputMode="decimal" onChange={(e) => setDraft({ ...draft, shipping: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="GST"><input value={draft.gst} inputMode="decimal" onChange={(e) => setDraft({ ...draft, gst: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Total inc GST"><input value={draft.total} inputMode="decimal" onChange={(e) => setDraft({ ...draft, total: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Payment method"><input value={draft.payment_method} onChange={(e) => setDraft({ ...draft, payment_method: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Payment ref"><input value={draft.payment_ref} onChange={(e) => setDraft({ ...draft, payment_ref: e.target.value })} className={`${inputCls} w-full`} /></L>
            <L label="Link to batch">
              <select value={draft.batch_id} onChange={(e) => setDraft({ ...draft, batch_id: e.target.value })} className={`${inputCls} w-full`}>
                <option value="">No batch</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_ref} · {b.label}</option>)}
              </select>
            </L>
            <L label="Notes"><input value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={`${inputCls} w-full`} /></L>
          </div>

          <div className="border border-border overflow-x-auto">
            <table className="w-full text-xs min-w-[760px]">
              <thead>
                <tr className="text-left font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-normal">Code</th>
                  <th className="px-2 py-2 font-normal">Name</th>
                  <th className="px-2 py-2 font-normal text-right">Qty</th>
                  <th className="px-2 py-2 font-normal">Unit</th>
                  <th className="px-2 py-2 font-normal text-right">Unit price</th>
                  <th className="px-2 py-2 font-normal text-right">Line total</th>
                  <th className="px-2 py-2 font-normal">Matches</th>
                  <th className="px-2 py-2 font-normal text-right">Normalised</th>
                  <th className="px-2 py-2 font-normal" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {draft.items.map((it, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 w-28"><input value={it.product_code} onChange={(e) => patchItem(i, { product_code: e.target.value })} className={cellCls} /></td>
                    <td className="px-2 py-1.5"><input value={it.name} onChange={(e) => patchItem(i, { name: e.target.value })} className={cellCls} /></td>
                    <td className="px-2 py-1.5 w-14"><input value={it.quantity} inputMode="decimal" onChange={(e) => patchItem(i, { quantity: e.target.value })} className={`${cellCls} text-right`} /></td>
                    <td className="px-2 py-1.5 w-20"><input value={it.unit} onChange={(e) => patchItem(i, { unit: e.target.value })} className={cellCls} /></td>
                    <td className="px-2 py-1.5 w-20"><input value={it.unit_price} inputMode="decimal" onChange={(e) => patchItem(i, { unit_price: e.target.value })} className={`${cellCls} text-right`} /></td>
                    <td className="px-2 py-1.5 w-20"><input value={it.total} inputMode="decimal" onChange={(e) => patchItem(i, { total: e.target.value })} className={`${cellCls} text-right`} /></td>
                    <td className="px-2 py-1.5 w-40">
                      <select value={it.match} onChange={(e) => patchItem(i, { match: e.target.value })} className={`${cellCls}`}>
                        <option value="">— unmatched —</option>
                        {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}{c.kind === "packaging_component" ? " (pkg)" : ""}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-28">
                      <div className="flex gap-1 justify-end">
                        <input value={it.qty_in_base} inputMode="decimal" onChange={(e) => patchItem(i, { qty_in_base: e.target.value })} className={`${cellCls} w-14 text-right`} />
                        <select value={it.base_unit} onChange={(e) => patchItem(i, { base_unit: e.target.value as DraftItem["base_unit"] })} className="border border-border bg-background text-[10px] rounded-none px-0.5">
                          <option value="">—</option><option value="L">L</option><option value="kg">kg</option><option value="units">units</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 w-8 text-center">
                      <button onClick={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive" title="Remove line">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDraft({ ...draft, items: [...draft.items, { ...BLANK_ITEM, line_no: draft.items.length + 1 }] })} className="btn-outline text-xs px-3 py-1.5">+ Line</button>
            <span className="flex-1" />
            <button onClick={saveDraft} disabled={busy === "save"} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy === "save" ? "…" : "Save order"}</button>
          </div>
        </section>
      )}

      {/* Coverage */}
      {coverage && (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h4 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground">Coverage</h4>
            <select value={coverageBatch} onChange={(e) => setCoverageBatch(e.target.value)} className={`${inputCls} text-xs`}>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_ref} · {b.label}</option>)}
            </select>
          </div>
          <div className="border border-border divide-y divide-border">
            <div className="grid grid-cols-[1fr_6rem_6rem_6rem] gap-3 px-3 py-2 bg-secondary text-[11px] font-typewriter uppercase tracking-widest text-muted-foreground">
              <span>Ingredient</span><span className="text-right">Required</span><span className="text-right">Ordered</span><span className="text-right">Outstanding</span>
            </div>
            {coverage.rows.map((r) => (
              <div key={r.name} className="grid grid-cols-[1fr_6rem_6rem_6rem] gap-3 px-3 py-2 text-sm items-baseline">
                <span className="font-body">
                  {r.name}
                  {r.sources.length > 0 && <span className="block text-[10px] text-muted-foreground">{[...new Set(r.sources)].join(", ")}</span>}
                  {r.unitMismatch && <span className="block text-[10px] text-destructive">ordered in {r.orderedUnit}, required in {r.requiredUnit} — check</span>}
                </span>
                <span className="text-right font-body tabular-nums">{r.required.toFixed(2)} {r.requiredUnit}</span>
                <span className="text-right font-body tabular-nums">{r.ordered > 0 ? `${r.ordered.toFixed(2)} ${r.orderedUnit}` : "—"}</span>
                <span className={`text-right font-body tabular-nums ${r.outstanding > 0.005 ? "font-medium" : "text-muted-foreground"}`}>
                  {r.outstanding > 0.005 ? `${r.outstanding.toFixed(2)} ${r.requiredUnit}` : "✓ covered"}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-body text-muted-foreground">
            Ordered totals count non-cancelled orders linked to this batch, using each line's normalised quantity (incl. the ordering buffer on the required side).
          </p>
        </section>
      )}

      {/* PO list */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h4 className="font-typewriter text-sm uppercase tracking-widest text-muted-foreground">Orders</h4>
          <label className="text-xs font-body text-muted-foreground flex items-center gap-1.5">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
        </div>
        <div className="border border-border divide-y divide-border">
          {pos.filter((p) => showArchived || !p.archived_at).map((po) => (
            <button key={po.id} onClick={() => setViewing(po)} className="w-full text-left grid md:grid-cols-[1fr_7rem_6rem_6rem_6rem] grid-cols-2 gap-x-3 gap-y-1 px-3 py-2.5 text-sm hover:bg-secondary/60 transition-colors">
              <span className="font-body truncate">
                {po.supplier}{po.supplier_order_no && <span className="text-muted-foreground"> #{po.supplier_order_no}</span>}
                <span className="block text-[10px] text-muted-foreground">{po.purchase_order_items.length} line(s){po.batch_calculation_id ? ` · ${batches.find((b) => b.id === po.batch_calculation_id)?.batch_ref ?? ""}` : ""}</span>
              </span>
              <span className="font-body text-xs pt-0.5 text-muted-foreground">{fmtDate(po.order_date)}</span>
              <span className="font-body tabular-nums md:text-right">{fmtMoney(po.total_cents, po.currency)}</span>
              <span className={`font-typewriter text-[10px] uppercase tracking-widest pt-1 md:text-right ${po.status === "received" ? "" : po.status === "cancelled" ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>{po.status}{po.archived_at ? " ⌀" : ""}</span>
              <span className="font-body text-xs pt-0.5 md:text-right text-muted-foreground">{fmtDate(po.created_at)}</span>
            </button>
          ))}
          {pos.filter((p) => showArchived || !p.archived_at).length === 0 && (
            <p className="px-3 py-4 text-sm font-body text-muted-foreground">No orders logged yet. Paste a confirmation above.</p>
          )}
        </div>
      </section>
    </div>
  );

  function patchItem(i: number, patch: Partial<DraftItem>) {
    setDraft((d) => (d ? { ...d, items: d.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) } : d));
  }
};

const L = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="block font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    {children}
  </label>
);

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-body text-sm break-words">{value}</p>
  </div>
);

export default Purchasing;
