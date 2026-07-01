import { useState } from "react";
import Materials from "@/components/production/Materials";
import Formula from "@/components/production/Formula";
import Batches from "@/components/production/Batches";
import QCLog from "@/components/production/QCLog";
import Traceability from "@/components/production/Traceability";
import Retains from "@/components/production/Retains";

// Self-contained Production & QC module: a batch-manufacturing-record (BMR) system.
// Reads from the existing world; writes only to its own tables. Does NOT touch
// stock, orders, or the admins model.
type SubTab = "materials" | "formula" | "batches" | "qc" | "trace" | "retains";

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: "materials", label: "Materials" },
  { key: "formula", label: "Formula" },
  { key: "batches", label: "Batches" },
  { key: "qc", label: "QC log" },
  { key: "trace", label: "Traceability" },
  { key: "retains", label: "Retains" },
];

const ProductionAdmin = () => {
  const [tab, setTab] = useState<SubTab>("materials");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-typewriter uppercase">Production &amp; QC</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">
          Batch manufacturing records, incoming/finished QC, and traceability. Stock stays manual — edit it from the store after a batch releases.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mb-8 border-b border-border pb-3">
        {SUBTABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`px-3 py-1.5 text-sm font-typewriter uppercase tracking-wider transition-colors ${
              tab === s.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {tab === "materials" && <Materials />}
      {tab === "formula" && <Formula />}
      {tab === "batches" && <Batches />}
      {tab === "qc" && <QCLog />}
      {tab === "trace" && <Traceability />}
      {tab === "retains" && <Retains />}
    </div>
  );
};

export default ProductionAdmin;
