import { describe, it, expect } from "vitest";
import {
  MYPOST_HEADERS,
  buildMyPostCsv,
  parseCsv,
  shortRef,
  detectConsignmentColumns,
  matchConsignments,
  type DeliveryLite,
} from "./fulfilment";

describe("buildMyPostCsv", () => {
  it("writes the MyPost template headers in template order", () => {
    const csv = buildMyPostCsv([]);
    const [header] = parseCsv(csv);
    expect(header).toEqual([...MYPOST_HEADERS]);
    expect(header[0]).toBe("Additional Label Information 1");
    expect(header[header.length - 1]).toBe("Extra Cover Amount");
  });

  it("writes row values under their headers and ignores meta columns", () => {
    const csv = buildMyPostCsv([
      {
        delivery_id: "not-in-the-csv",
        "Additional Label Information 1": "CE-1A2B3C4D",
        "Deliver To Name": "Sam Rider",
        "Item Delivery Service": "EXP",
        "Item Weight": "0.25",
      },
    ]);
    const [header, row] = parseCsv(csv);
    expect(row[header.indexOf("Additional Label Information 1")]).toBe("CE-1A2B3C4D");
    expect(row[header.indexOf("Deliver To Name")]).toBe("Sam Rider");
    expect(row[header.indexOf("Item Delivery Service")]).toBe("EXP");
    expect(row[header.indexOf("Item Weight")]).toBe("0.25");
    expect(row).toHaveLength(MYPOST_HEADERS.length);
    expect(csv).not.toContain("not-in-the-csv");
  });

  it("escapes commas, quotes and newlines so the file round-trips", () => {
    const csv = buildMyPostCsv([
      {
        "Deliver To Name": 'Sam "Salty" Rider',
        "Deliver To Address Line 1": "Unit 2, 14 Beach Rd",
        "Item Description": "Field Oil 30ml\nfragile",
      },
    ]);
    const [header, row] = parseCsv(csv);
    expect(row[header.indexOf("Deliver To Name")]).toBe('Sam "Salty" Rider');
    expect(row[header.indexOf("Deliver To Address Line 1")]).toBe("Unit 2, 14 Beach Rd");
    expect(row[header.indexOf("Item Description")]).toBe("Field Oil 30ml\nfragile");
  });
});

describe("parseCsv", () => {
  it("handles quoted fields, CRLF, a BOM, and blank lines", () => {
    const text = '﻿a,b,c\r\n"1,1","he said ""hi""",plain\r\n\r\nx,y,z\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b", "c"],
      ["1,1", 'he said "hi"', "plain"],
      ["x", "y", "z"],
    ]);
  });

  it("keeps newlines inside quoted fields", () => {
    expect(parseCsv('a,"line1\nline2",c')).toEqual([["a", "line1\nline2", "c"]]);
  });

  it("returns nothing for an empty file", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\r\n\n")).toEqual([]);
  });
});

describe("shortRef", () => {
  it("is CE- plus the first 8 hex of the delivery id, uppercased", () => {
    expect(shortRef("1a2b3c4d-5e6f-4a70-8b90-000000000000")).toBe("CE-1A2B3C4D");
  });
});

describe("detectConsignmentColumns", () => {
  it("finds columns by keyword whatever the exact header wording", () => {
    expect(
      detectConsignmentColumns(["Order date", "Additional label information 1", "Tracking number"]),
    ).toEqual({ refIdx: 1, trackIdx: 2 });
    expect(detectConsignmentColumns(["Reference", "Article ID"])).toEqual({ refIdx: 0, trackIdx: 1 });
    expect(detectConsignmentColumns(["Sender Reference 1", "Consignment no."])).toEqual({ refIdx: 0, trackIdx: 1 });
  });

  it("reports which column is missing, listing the headers it saw", () => {
    const res = detectConsignmentColumns(["Date", "Recipient"]);
    expect(res).toHaveProperty("error");
    expect((res as { error: string }).error).toContain('"Recipient"');
  });
});

describe("matchConsignments", () => {
  const cols = { refIdx: 0, trackIdx: 1 };
  const scheduled = (id: string, tracking: string | null = null): DeliveryLite => ({
    id,
    status: "scheduled",
    tracking_number: tracking,
  });
  const shipped = (id: string, tracking: string | null): DeliveryLite => ({
    id,
    status: "shipped",
    tracking_number: tracking,
  });
  const D1 = "1a2b3c4d-0000-4000-8000-000000000001";
  const D2 = "9f8e7d6c-0000-4000-8000-000000000002";

  it("matches rows to scheduled deliveries by CE reference", () => {
    const res = matchConsignments([["CE-1A2B3C4D", "33ABC123456"]], cols, [scheduled(D1)]);
    expect(res.matched).toHaveLength(1);
    expect(res.matched[0].delivery.id).toBe(D1);
    expect(res.matched[0].tracking).toBe("33ABC123456");
    expect(res.unmatched).toHaveLength(0);
  });

  it("finds the reference even when the cell carries extra text or no dash", () => {
    const res = matchConsignments(
      [
        ["Order CE-1A2B3C4D / batch 4", "T1"],
        ["CE9F8E7D6C", "T2"],
      ],
      cols,
      [scheduled(D1), scheduled(D2)],
    );
    expect(res.matched.map((m) => m.delivery.id)).toEqual([D1, D2]);
  });

  it("keeps unknown references and blank tracking as unmatched, with the raw row", () => {
    const rows = [
      ["CE-DEADBEEF", "T1"], // no such delivery
      ["not a ref", "T2"],
      ["CE-1A2B3C4D", ""], // no tracking value
    ];
    const res = matchConsignments(rows, cols, [scheduled(D1)]);
    expect(res.matched).toHaveLength(0);
    expect(res.unmatched).toEqual(rows);
  });

  it("classifies an identical re-import as already shipped, not a change", () => {
    const res = matchConsignments([["CE-1A2B3C4D", "T1"]], cols, [shipped(D1, "T1")]);
    expect(res.alreadyShipped).toHaveLength(1);
    expect(res.matched).toHaveLength(0);
    expect(res.conflicts).toHaveLength(0);
  });

  it("never overwrites an existing tracking number silently: different value is a conflict", () => {
    const res = matchConsignments([["CE-1A2B3C4D", "NEW-TRACK"]], cols, [shipped(D1, "OLD-TRACK")]);
    expect(res.conflicts).toHaveLength(1);
    expect(res.conflicts[0].tracking).toBe("NEW-TRACK");
    expect(res.matched).toHaveLength(0);
  });

  it("treats a scheduled delivery that already has tracking as a conflict too", () => {
    const res = matchConsignments([["CE-1A2B3C4D", "NEW-TRACK"]], cols, [scheduled(D1, "OLD-TRACK")]);
    expect(res.conflicts).toHaveLength(1);
  });

  it("ignores a duplicate row for the same parcel", () => {
    const res = matchConsignments(
      [
        ["CE-1A2B3C4D", "T1"],
        ["CE-1A2B3C4D", "T1"],
      ],
      cols,
      [scheduled(D1)],
    );
    expect(res.matched).toHaveLength(1);
  });
});
