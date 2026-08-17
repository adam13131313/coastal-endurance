import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface IpRight {
  id: string; kind: string; title: string; number: string | null; jurisdiction: string | null;
  tm_class: string | null; status: string | null; filed_on: string | null; accepted_on: string | null;
  opposition_until: string | null; registered_on: string | null; applicant: string | null;
  categories: string[]; notes: string | null;
}
interface IpDoc { id: string; doc_type: string; file_url: string | null; uploaded_by: string | null; uploaded_at: string; }

const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—");
const daysUntil = (s: string | null) => (s ? Math.ceil((new Date(s).getTime() - Date.now()) / 86400000) : null);

const IPAdmin = () => {
  const [rights, setRights] = useState<IpRight[]>([]);
  const [docs, setDocs] = useState<Map<string, IpDoc[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: r } = await sb.from("ip_rights").select("*").order("accepted_on", { ascending: false, nullsFirst: false });
    const list = (r as IpRight[]) ?? [];
    setRights(list);
    const { data: d } = await sb.from("production_documents")
      .select("id, doc_type, file_url, uploaded_by, uploaded_at, entity_id")
      .eq("entity_type", "ip_right").order("uploaded_at", { ascending: false });
    const m = new Map<string, IpDoc[]>();
    for (const row of (d as (IpDoc & { entity_id: string })[]) ?? []) {
      if (!m.has(row.entity_id)) m.set(row.entity_id, []);
      m.get(row.entity_id)!.push(row);
    }
    setDocs(m);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (right: IpRight, file: File) => {
    setBusy(right.id);
    const { data: userData } = await supabase.auth.getUser();
    const path = `ip-right/${right.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("production-docs").upload(path, file);
    if (upErr) { setBusy(null); toast.error("Upload failed."); return; }
    const { error } = await sb.from("production_documents").insert({
      doc_type: right.kind, entity_type: "ip_right", entity_id: right.id, file_url: path, uploaded_by: userData?.user?.email ?? null,
    });
    setBusy(null);
    if (error) { toast.error("Couldn't record the document."); return; }
    toast.success("Document attached.");
    load();
  };

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("production-docs").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error("Couldn't open the file."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  if (loading) return <p className="font-body text-muted-foreground">Loading IP register…</p>;

  return (
    <div className="max-w-[820px] space-y-8">
      <div>
        <h2 className="text-2xl font-typewriter uppercase">IP &amp; Trademarks</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">Registered rights and their documents. Reference — the source of truth is IP Australia.</p>
      </div>

      {rights.map((r) => {
        const oppDays = daysUntil(r.opposition_until);
        const rDocs = docs.get(r.id) ?? [];
        return (
          <section key={r.id} className="border border-border">
            <div className="p-5 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground">{r.kind} · {r.jurisdiction}</p>
                  <h3 className="mt-1 text-xl font-typewriter uppercase">{r.title}</h3>
                </div>
                <span className="text-[10px] font-typewriter uppercase tracking-widest bg-foreground text-background px-2 py-1">{r.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Meta label="TM number" value={r.number ?? "—"} />
                <Meta label="Class" value={r.tm_class ?? "—"} />
                <Meta label="Applicant" value={r.applicant ?? "—"} />
                <Meta label="Filed" value={fmt(r.filed_on)} />
                <Meta label="Accepted" value={fmt(r.accepted_on)} />
                <Meta label="Opposition until" value={r.opposition_until ? `${fmt(r.opposition_until)}${oppDays != null && oppDays > 0 ? ` (${oppDays}d)` : ""}` : "—"} />
                <Meta label="Registered" value={fmt(r.registered_on)} />
              </div>
              {r.notes && <p className="mt-4 text-[13px] font-body text-muted-foreground leading-relaxed">{r.notes}</p>}
            </div>

            {/* Categories */}
            {r.categories.length > 0 && (
              <div className="p-5 border-b border-border">
                <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Goods &amp; services covered · Class {r.tm_class} ({r.categories.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.categories.map((c, i) => (
                    <span key={i} className="text-[12px] font-body border border-border px-2 py-1 leading-none">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="p-5">
              <p className="font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Documents</p>
              {rDocs.length > 0 ? (
                <div className="border border-border divide-y divide-border mb-3">
                  {rDocs.map((d) => (
                    <div key={d.id} className="px-3 py-2 text-sm font-body flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{d.doc_type} · {fmt(d.uploaded_at)}{d.uploaded_by ? ` · ${d.uploaded_by}` : ""}</span>
                      {d.file_url && <button onClick={() => openDoc(d.file_url as string)} className="text-xs font-typewriter uppercase tracking-wider text-muted-foreground hover:text-foreground">Open file</button>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] font-body text-muted-foreground mb-3">No documents attached yet — upload the acceptance letter / certificate below.</p>
              )}
              <label className="inline-flex items-center gap-2 text-xs font-body text-muted-foreground cursor-pointer">
                <span className="btn-outline text-xs px-3 py-1.5">{busy === r.id ? "Uploading…" : "Attach document"}</span>
                <input type="file" className="hidden" disabled={busy === r.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(r, f); e.target.value = ""; }} />
              </label>
            </div>
          </section>
        );
      })}
    </div>
  );
};

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-typewriter text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-body text-sm break-words">{value}</p>
  </div>
);

export default IPAdmin;
