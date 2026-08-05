import { useState } from "react";
import BatchSizing from "@/components/production/BatchSizing";
import Purchasing from "@/components/production/Purchasing";
import Inventory from "@/components/production/Inventory";

// Supply: everything before materials exist in-house — sizing a batch,
// purchasing against it, and what's on hand. The boundary with Production is
// the released lot: Supply ends when a lot clears incoming QC; Production
// (BMR, QC, traceability) consumes lots.
type SubTab = "sizing" | "purchasing" | "inventory";

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: "sizing", label: "Batch sizing" },
  { key: "purchasing", label: "Purchasing" },
  { key: "inventory", label: "Inventory" },
];

const SupplyAdmin = () => {
  const [tab, setTab] = useState<SubTab>("sizing");

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-typewriter uppercase">Supply</h2>
        <p className="mt-1 text-sm font-body text-muted-foreground">
          What a batch needs, what's on order, and what's on hand. Received deliveries land as quarantined lots for incoming QC under Production → Materials.
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

      {tab === "sizing" && <BatchSizing />}
      {tab === "purchasing" && <Purchasing />}
      {tab === "inventory" && <Inventory />}
    </div>
  );
};

export default SupplyAdmin;
