// Batch fulfilment: build the MyPost Business import CSV and read back the
// consignment export so tracking numbers land on the right deliveries. Pure
// functions only (no supabase), so all of it is unit-testable.

// The MyPost Business DOMESTIC bulk-import headers, in template column order —
// verified against auspost.com.au's order-import-template.xlsx (Sep 2026).
// MyPost rejects files whose header row doesn't match the template.
export const MYPOST_HEADERS = [
  "Additional Label Information 1",
  "Send From Name",
  "Send From Business Name",
  "Send From Address Line 1",
  "Send From Address Line 2",
  "Send From Address Line 3",
  "Send From Suburb",
  "Send From State",
  "Send From Postcode",
  "Send From Phone Number",
  "Send From Email Address",
  "Deliver To Name",
  "Deliver To Business Name",
  "Deliver To Address Line 1",
  "Deliver To Address Line 2",
  "Deliver To Address Line 3",
  "Deliver To Suburb",
  "Deliver To State",
  "Deliver To Postcode",
  "Deliver To Phone Number",
  "Deliver To Email Address",
  "Item Packaging Type",
  "Item Delivery Service",
  "Item Description",
  "Item Length",
  "Item Width",
  "Item Height",
  "Item Weight",
  "Item Dangerous Goods Flag",
  "Schedule 8 or medicinal cannabis",
  "Signature On Delivery",
  "Extra Cover Amount",
] as const;

export type ExportRow = Record<string, unknown>;

const csvEscape = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Rows are the fulfilment_export_v records (meta columns are simply ignored —
// only the template headers are written, in template order).
export function buildMyPostCsv(rows: ExportRow[]): string {
  const lines = [MYPOST_HEADERS.map(csvEscape).join(",")];
  for (const row of rows) lines.push(MYPOST_HEADERS.map((h) => csvEscape(row[h])).join(","));
  return lines.join("\r\n") + "\r\n";
}

// Minimal RFC 4180 parser: quoted fields, doubled quotes, commas and newlines
// inside quotes, CRLF or LF, optional BOM. Blank lines are dropped.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

// Short reference printed on the label ("CE-" + first 8 hex of the delivery id).
// Matches what fulfilment_export_v puts in Additional Label Information 1.
export const shortRef = (deliveryId: string): string =>
  "CE-" + deliveryId.replace(/-/g, "").slice(0, 8).toUpperCase();

// MyPost's consignment/order export column names aren't published, so find the
// reference and tracking columns by header keywords rather than exact names.
export interface ConsignmentColumns { refIdx: number; trackIdx: number }

export function detectConsignmentColumns(header: string[]): ConsignmentColumns | { error: string } {
  const lower = header.map((h) => h.trim().toLowerCase());
  const find = (...needles: string[]) =>
    lower.findIndex((h) => needles.some((n) => h.includes(n)));
  const refIdx = find("additional label information", "label information", "reference");
  const trackIdx = find("tracking", "article", "consignment");
  if (refIdx < 0 || trackIdx < 0) {
    return {
      error:
        `Couldn't find the ${refIdx < 0 ? "reference" : "tracking"} column. ` +
        `Headers found: ${header.map((h) => `"${h}"`).join(", ")}`,
    };
  }
  return { refIdx, trackIdx };
}

export interface DeliveryLite {
  id: string;
  status: string;
  tracking_number: string | null;
}

export interface MatchedRow<D extends DeliveryLite = DeliveryLite> {
  delivery: D;
  tracking: string;
  raw: string[];
}

export interface MatchResult<D extends DeliveryLite = DeliveryLite> {
  /** Scheduled deliveries with no tracking yet: safe to mark shipped. */
  matched: MatchedRow<D>[];
  /** Already shipped with this same tracking number: nothing to do. */
  alreadyShipped: MatchedRow<D>[];
  /** Delivery already carries a DIFFERENT tracking number (or is shipped with
   *  one): only written over after an explicit confirm. */
  conflicts: MatchedRow<D>[];
  /** No delivery found for the row's reference (or no usable reference /
   *  tracking value): shown raw for manual handling. */
  unmatched: string[][];
}

// Match consignment rows to deliveries via the CE-xxxxxxxx label reference.
// The reference cell may carry extra text around the ref (some exports merge
// label lines), so search for the pattern anywhere in the cell.
export function matchConsignments<D extends DeliveryLite>(
  dataRows: string[][],
  cols: ConsignmentColumns,
  deliveries: D[],
): MatchResult<D> {
  const byPrefix = new Map<string, D>();
  for (const d of deliveries) byPrefix.set(d.id.replace(/-/g, "").slice(0, 8).toLowerCase(), d);

  const result: MatchResult<D> = { matched: [], alreadyShipped: [], conflicts: [], unmatched: [] };
  const seen = new Set<string>();

  for (const raw of dataRows) {
    const refCell = (raw[cols.refIdx] ?? "").trim();
    const tracking = (raw[cols.trackIdx] ?? "").trim();
    const refMatch = refCell.match(/CE-?([0-9a-fA-F]{8})/);
    const delivery = refMatch ? byPrefix.get(refMatch[1].toLowerCase()) : undefined;

    if (!delivery || !tracking) {
      result.unmatched.push(raw);
      continue;
    }
    // The same parcel occasionally appears twice in an export; keep the first.
    if (seen.has(delivery.id)) continue;
    seen.add(delivery.id);

    const existing = (delivery.tracking_number ?? "").trim();
    if (existing && existing === tracking) {
      result.alreadyShipped.push({ delivery, tracking, raw });
    } else if (existing || delivery.status !== "scheduled") {
      result.conflicts.push({ delivery, tracking, raw });
    } else {
      result.matched.push({ delivery, tracking, raw });
    }
  }
  return result;
}
