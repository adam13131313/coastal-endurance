import { describe, it, expect } from "vitest";
import { classifyPromo, statusesFor, normCode } from "./promo-status";

// Stripe shows the same "invalid" at checkout for a spent code and a switched-off
// one, so this classification is the only thing that tells them apart for the CRM.

describe("classifyPromo", () => {
  it("live and unused is active", () => {
    expect(classifyPromo({ code: "FIELD-QZMMP", active: true, times_redeemed: 0 })).toBe("active");
  });

  it("any redemption is redeemed, even if Stripe still says active", () => {
    expect(classifyPromo({ code: "A", active: true, times_redeemed: 1 })).toBe("redeemed");
  });

  it("a code Stripe flipped off after its single redemption is redeemed, not merely inactive", () => {
    // What FIELD-FRJZS looked like: active false, times_redeemed 1.
    expect(classifyPromo({ code: "FIELD-FRJZS", active: false, times_redeemed: 1 })).toBe("redeemed");
  });

  it("switched off before anyone used it is inactive", () => {
    expect(classifyPromo({ code: "A", active: false, times_redeemed: 0 })).toBe("inactive");
  });

  it("treats a missing redemption count as unused", () => {
    expect(classifyPromo({ code: "A", active: true })).toBe("active");
    expect(classifyPromo({ code: "A", active: false, times_redeemed: null })).toBe("inactive");
  });

  it("a code Stripe doesn't know is missing", () => {
    expect(classifyPromo(null)).toBe("missing");
    expect(classifyPromo(undefined)).toBe("missing");
  });
});

describe("statusesFor", () => {
  const promos = [
    { code: "FIELD-QZMMP", active: true, times_redeemed: 0 },
    { code: "FIELD-FRJZS", active: false, times_redeemed: 1 },
  ];

  it("answers every requested code, keyed as asked", () => {
    expect(statusesFor(["FIELD-QZMMP", "FIELD-FRJZS", "FIELD-NOPE1"], promos)).toEqual({
      "FIELD-QZMMP": "active",
      "FIELD-FRJZS": "redeemed",
      "FIELD-NOPE1": "missing",
    });
  });

  it("matches case-insensitively, like Stripe does", () => {
    expect(statusesFor(["field-qzmmp"], promos)).toEqual({ "field-qzmmp": "active" });
  });

  it("ignores stray whitespace around a code", () => {
    expect(normCode("  field-qzmmp \n")).toBe("FIELD-QZMMP");
    expect(statusesFor([" FIELD-QZMMP "], promos)[" FIELD-QZMMP "]).toBe("active");
  });

  it("returns nothing for no codes, and marks everything missing for an empty Stripe list", () => {
    expect(statusesFor([], promos)).toEqual({});
    expect(statusesFor(["FIELD-QZMMP"], [])).toEqual({ "FIELD-QZMMP": "missing" });
  });
});
