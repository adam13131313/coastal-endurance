import { describe, it, expect, vi } from "vitest";
import {
  interpolate, hasUnfilledCode, codeIsDead, NO_CODE_PLACEHOLDER, CODE_STATUS_LABEL, type Contact,
} from "./crm";

// crm.ts builds a Supabase client on import; it isn't used by anything tested here.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const contact = { name: "Mark Tyrrell", email: "mark@example.com" } as Contact;

describe("interpolate {{code}}", () => {
  it("fills in the contact's own code and first name", () => {
    expect(interpolate("Hi {{first_name}}, your code is {{code}}.", contact, { code: "FIELD-QZMMP" }))
      .toBe("Hi Mark, your code is FIELD-QZMMP.");
  });

  it("tolerates spaces inside the braces and fills every occurrence", () => {
    expect(interpolate("{{ code }} / {{code}}", contact, { code: "FIELD-QZMMP" })).toBe("FIELD-QZMMP / FIELD-QZMMP");
  });

  it("uses the visible placeholder when no code has been issued", () => {
    expect(interpolate("Your code: {{code}}", contact, { code: null })).toBe(`Your code: ${NO_CODE_PLACEHOLDER}`);
    expect(interpolate("Your code: {{code}}", contact)).toBe(`Your code: ${NO_CODE_PLACEHOLDER}`);
  });
});

describe("hasUnfilledCode", () => {
  it("flags a message that still carries the no-code placeholder", () => {
    expect(hasUnfilledCode(interpolate("Your code is {{code}}.", contact, { code: null }))).toBe(true);
  });

  it("passes a message with a real code, or with no code in it at all", () => {
    expect(hasUnfilledCode(interpolate("Your code is {{code}}.", contact, { code: "FIELD-QZMMP" }))).toBe(false);
    expect(hasUnfilledCode("How's the oil going?")).toBe(false);
  });

  it("lifts once the placeholder is edited away", () => {
    const body = interpolate("Your code is {{code}}.", contact, { code: null });
    expect(hasUnfilledCode(body.replace(NO_CODE_PLACEHOLDER, "FIELD-QZMMP"))).toBe(false);
  });
});

describe("codeIsDead", () => {
  it("is true for spent, switched-off and unknown codes", () => {
    for (const s of ["redeemed", "inactive", "missing"] as const) {
      expect(codeIsDead(s)).toBe(true);
      expect(CODE_STATUS_LABEL[s]).toBeTruthy();
    }
  });

  it("is false for a live code, and for no answer from Stripe", () => {
    expect(codeIsDead("active")).toBe(false);
    expect(codeIsDead(undefined)).toBe(false);
  });
});
