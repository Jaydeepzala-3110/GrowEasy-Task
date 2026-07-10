import { describe, expect, it } from "vitest";
import {
  escapeCrmNote,
  hasContact,
  isIndianMobile,
  isValidCreatedAt,
  normalizeCreatedAt,
  normalizeCrmStatus,
  normalizeDataSource,
  normalizeLead,
  isBlankRow,
} from "./leadNormalizer.js";

describe("normalizeCrmStatus", () => {
  it("maps human-readable status to enum", () => {
    expect(normalizeCrmStatus("Follow Up").value).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(normalizeCrmStatus("Sale Done").value).toBe("SALE_DONE");
    expect(normalizeCrmStatus("DID_NOT_CONNECT").value).toBe("DID_NOT_CONNECT");
  });

  it("moves unknown status to overflow", () => {
    const result = normalizeCrmStatus("maybe later");
    expect(result.value).toBe("");
    expect(result.overflow).toContain("maybe later");
  });
});

describe("normalizeDataSource", () => {
  it("maps project names to enum", () => {
    expect(normalizeDataSource("Meridian Tower").value).toBe("meridian_tower");
    expect(normalizeDataSource("eden park").value).toBe("eden_park");
    expect(normalizeDataSource("sarjapur_plots").value).toBe("sarjapur_plots");
  });
});

describe("normalizeCreatedAt", () => {
  it("accepts ISO-like dates", () => {
    const result = normalizeCreatedAt("2026-05-13 14:20:48");
    expect(result.value).toBe("2026-05-13 14:20:48");
    expect(isValidCreatedAt(result.value)).toBe(true);
  });

  it("parses DD/MM/YYYY with meridiem", () => {
    const result = normalizeCreatedAt("13/05/2026 2:20 PM");
    expect(result.value).toBe("2026-05-13 14:20:00");
  });

  it("parses ambiguous date as DD/MM (India default)", () => {
    const result = normalizeCreatedAt("05/06/2026");
    expect(result.value).toBe("2026-06-05 00:00:00");
  });

  it("does not use US MM/DD for ambiguous slash dates", () => {
    const result = normalizeCreatedAt("05/06/2026");
    expect(result.value).not.toBe("2026-05-06 00:00:00");
  });

  it("overflows invalid dates", () => {
    const result = normalizeCreatedAt("not-a-date");
    expect(result.value).toBe("");
    expect(result.overflow).toContain("not-a-date");
  });
});

describe("isIndianMobile", () => {
  it("accepts valid Indian mobiles", () => {
    expect(isIndianMobile("9876543210")).toBe(true);
    expect(isIndianMobile("6123456789")).toBe(true);
  });

  it("rejects invalid lengths and leading digits", () => {
    expect(isIndianMobile("5876543210")).toBe(false);
    expect(isIndianMobile("987654321")).toBe(false);
    expect(isIndianMobile("98765432101")).toBe(false);
  });
});

describe("escapeCrmNote", () => {
  it("escapes line breaks for CSV safety", () => {
    expect(escapeCrmNote("line1\nline2")).toBe("line1\\nline2");
  });
});

describe("isBlankRow", () => {
  it("detects all-empty rows", () => {
    expect(isBlankRow({ Name: "", Email: "", Phone: "" })).toBe(true);
    expect(isBlankRow({ Name: "  ", Email: "" })).toBe(true);
    expect(isBlankRow({ Name: "John" })).toBe(false);
  });
});

describe("hasContact", () => {
  it("requires email or valid mobile", () => {
    expect(hasContact(normalizeLead({ email: "a@b.com" }))).toBe(true);
    expect(hasContact(normalizeLead({ mobile_without_country_code: "9876543210" }))).toBe(true);
    expect(hasContact(normalizeLead({ mobile_without_country_code: "12345" }))).toBe(false);
    expect(hasContact(normalizeLead({ name: "John" }))).toBe(false);
  });
});

describe("normalizeLead", () => {
  it("normalizes a full messy row", () => {
    const lead = normalizeLead({
      created_at: "13/05/2026 2:20 PM",
      crm_status: "Follow Up",
      data_source: "Meridian Tower",
      crm_note: "busy\ncall back",
      email: "test@example.com",
      mobile_without_country_code: "9876543210",
    });

    expect(lead.crm_status).toBe("GOOD_LEAD_FOLLOW_UP");
    expect(lead.data_source).toBe("meridian_tower");
    expect(lead.created_at).toBe("2026-05-13 14:20:00");
    expect(lead.crm_note).toBe("busy\\ncall back");
    expect(lead.country_code).toBe("+91");
  });

  it("parses 12-digit 91-prefixed numbers", () => {
    const lead = normalizeLead({ mobile_without_country_code: "919876543210" });
    expect(lead.country_code).toBe("+91");
    expect(lead.mobile_without_country_code).toBe("9876543210");
  });

  it("does not assign +91 to non-Indian numbers", () => {
    const lead = normalizeLead({ mobile_without_country_code: "1234567890" });
    expect(lead.country_code).toBe("");
  });
});
