import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  sb, fmtDate, type ProductionBatch, type RawMaterialLot, type BatchComponent, type ProductionDocument,
} from "@/lib/production";

// Traceability + recall + documents.
//   Forward / recall: pick a raw-material lot → every batch that consumed it (the
//     units potentially affected if that lot is implicated).
//   Backward: pick a batch → the lots + COAs behind it.
// Documents live in the private 'production-docs' bucket; we store the path and
// mint short-lived signed URLs to view.
const DOC_TYPES = ["coa", "sds", "stability", "safety", "coo", "other"];

const Traceability = () => {
  const [lots, setLots] = useState<(RawMaterialLot & { raw_materials?: { name: string } })[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [lotId, setLotId] = useState("");
  const [affected, setAffected] = useState<(BatchComponent & { production_batches?: ProductionBatch })[]>([]);

  const [batchId, setBatchId] = useState("");
  const [batchComps, setBatchComps] = useState<(BatchComponent & { raw_materials?: { name: string }; raw_material_lots?: { id: string; supplier_lot_number: string | null; supplier: string | null } })[]>([]);
  const [docs, setDocs] = useState<ProductionDocument[]>([]);

  const [upload, setUpload] = useState({ docType: "coa", entityId: "", file: null as File | null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [l, b] = await Promise.all([
      sb.from("raw_material_lots").select("*, raw_materials ( name )").order("created_at", { ascending: false }),
      sb.from("production_batches").select("*").order("created_at", { ascending: false }),
    ]);
    setLots((l.data as (RawMaterialLot & { raw_materials?: { name: string } })[]) ?? []);
    setBatches((b.data as ProductionBatch[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Forward / recall.
  useEffect(() => {
    if (!lotId) { setAffected([]); return; }
    (async () => {
      const { data } = await sb.from("batch_components").select("*, production_batches ( * )").eq("raw_material_lot_id", lotId);
      setAffected((data as (BatchComponent & { production_batches?: ProductionBatch })[]) ?? []);
    })();
  }, [lotId]);

  const loadBatchTrace = useCallback(async (id: string) => {
    const { data: comps } = await sb
      .from("batch_components")
      .select("*, raw_materials ( name ), raw_material_lots ( id, supplier_lot_number, supplier )")
      .eq("batch_id", id);
    const rows = (comps as (BatchComponent & { raw_material_lots?: { id: string } })[]) ?? [];
    setBatchComps(rows as never);
    const lotIds = rows.map((r) => r.raw_material_lots?.id).filter(Boolean) as string[];
    const entityIds = [id, ...lotIds];
    const { data: d } = await sb.from("production_documents").select("*").in("entity_id", entityIds);
    setDocs((d as ProductionDocument[]) ?? []);
  }, []);

  useEffect(() => {
    if (!batchId) { setBatchComps([]); setDocs([]); return; }
    setUpload((u) => ({ ...u, entityId: batchId }));
    loadBatchTrace(batchId);
  }, [batchId, loadBatchTrace]);

  const affectedUnits = useMemo(() => affected.reduce((s, a) => s + (a.production_batches?.yield_units ?? 0), 0), [affected]);

  const uploadDoc = async () => {
    if (!upload.file || !upload.entityId) { toast.error("Pick a target and a file."); return; }
    setBusy(true);
    const entityType = upload.entityId === batchId ? "batch" : "raw_lot";
    const safeName = upload.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${entityType}/${upload.entityId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage.from("production-docs").upload(path, upload.file);
    if (upErr) { setBusy(false); toast.error("Upload failed."); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await sb.from("production_documents").insert({
      doc_type: upload.docType, entity_type: entityType, entity_id: upload.entityId, file_url: path, uploaded_by: session?.user?.email ?? null,
    });
    setBusy(false);
    if (error) { toast.error("Saved the file but couldn't record it."); return; }
    toast.success("Document uploaded.");
    setUpload((u) => ({ ...u, file: null }));
    loadBatchTrace(batchId);
  };

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("production-docs").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error("Couldn't open that file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading…</p>;

  const usedLotIds = new Set(batchComps.map((c) => c.raw_material_lots?.id).filter(Boolean) as string[]);

  return (
    <div className="max-w-[880px] space-y-12">
      {/* Forward / recall */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-1">Recall / forward trace</h3>
        <p className="text-xs font-body text-muted-foreground mb-4">Pick a raw-material lot to see every batch it went into.</p>
        <select value={lotId} onChange={(e) => setLotId(e.target.value)}
          className="w-full max-w-md px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
          <option value="">Select a lot…</option>
          {lots.map((l) => <option key={l.id} value={l.id}>{l.raw_materials?.name} · lot {l.supplier_lot_number || "?"} ({l.status})</option>)}
        </select>
        {lotId && (
          affected.length === 0 ? (
            <p className="mt-4 font-body text-muted-foreground text-sm">This lot hasn't been used in any batch.</p>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-body mb-2">Affected batches — <span className="font-medium">{affectedUnits.toLocaleString("en-AU")} units</span> potentially involved:</p>
              <div className="border border-border divide-y divide-border text-sm">
                {affected.map((a) => (
                  <div key={a.id} className="p-3 flex flex-wrap items-center gap-x-4">
                    <span className="font-body font-medium w-40 shrink-0">{a.production_batches?.batch_number}</span>
                    <span className="text-muted-foreground w-28 shrink-0">{a.production_batches?.yield_units ?? "—"} units</span>
                    <span className="text-muted-foreground w-28 shrink-0">{a.production_batches?.status}</span>
                    <span className="text-muted-foreground">BB {fmtDate(a.production_batches?.best_before ?? null)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      {/* Backward trace + documents */}
      <section>
        <h3 className="font-typewriter text-lg uppercase tracking-wider mb-1">Backward trace</h3>
        <p className="text-xs font-body text-muted-foreground mb-4">Pick a batch to see the lots and COAs behind it.</p>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}
          className="w-full max-w-md px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
          <option value="">Select a batch…</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.batch_number} ({b.status})</option>)}
        </select>

        {batchId && (
          <>
            <div className="mt-4 border border-border divide-y divide-border text-sm">
              {batchComps.map((c) => {
                const lotDocs = docs.filter((d) => d.entity_id === c.raw_material_lots?.id);
                return (
                  <div key={c.id} className="p-3">
                    <div className="flex flex-wrap items-center gap-x-4">
                      <span className="font-body font-medium w-44 shrink-0">{c.raw_materials?.name}</span>
                      <span className="text-muted-foreground w-40 shrink-0">lot {c.raw_material_lots?.supplier_lot_number || "—"}</span>
                      <span className="text-muted-foreground">{c.raw_material_lots?.supplier || ""}</span>
                    </div>
                    {lotDocs.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {lotDocs.map((d) => (
                          <button key={d.id} onClick={() => viewDoc(d.file_url)} className="text-xs font-typewriter uppercase tracking-widest border border-border px-2 py-0.5 hover:text-foreground text-muted-foreground">
                            {d.doc_type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Batch-level documents */}
            <div className="mt-4">
              <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-2">Batch documents</p>
              <div className="flex flex-wrap gap-2">
                {docs.filter((d) => d.entity_id === batchId).map((d) => (
                  <button key={d.id} onClick={() => viewDoc(d.file_url)} className="text-xs font-typewriter uppercase tracking-widest border border-border px-2 py-0.5 hover:text-foreground text-muted-foreground">
                    {d.doc_type}
                  </button>
                ))}
                {docs.filter((d) => d.entity_id === batchId).length === 0 && <span className="text-xs font-body text-muted-foreground">None yet.</span>}
              </div>
            </div>

            {/* Upload */}
            <div className="mt-6 border border-border p-4">
              <p className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mb-3">Upload a document</p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                  <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Type</span>
                  <select value={upload.docType} onChange={(e) => setUpload((u) => ({ ...u, docType: e.target.value }))}
                    className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
                    {DOC_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="block font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Attach to</span>
                  <select value={upload.entityId} onChange={(e) => setUpload((u) => ({ ...u, entityId: e.target.value }))}
                    className="px-2 py-1.5 border border-border bg-background text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-foreground">
                    <option value={batchId}>This batch</option>
                    {batchComps.filter((c) => c.raw_material_lots?.id && usedLotIds.has(c.raw_material_lots.id)).map((c) => (
                      <option key={c.id} value={c.raw_material_lots!.id}>{c.raw_materials?.name} lot {c.raw_material_lots?.supplier_lot_number || "?"}</option>
                    ))}
                  </select>
                </label>
                <input type="file" onChange={(e) => setUpload((u) => ({ ...u, file: e.target.files?.[0] ?? null }))} className="text-sm font-body" />
                <button onClick={uploadDoc} disabled={busy || !upload.file} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{busy ? "…" : "Upload"}</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Traceability;
