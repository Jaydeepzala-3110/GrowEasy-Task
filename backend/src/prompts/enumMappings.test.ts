import { describe, expect, it } from "vitest";
import { CRM_STATUSES, DATA_SOURCES } from "../types/crm.js";
import {
  assertMappingIntegrity,
  STATUS_ALIAS_GROUPS,
  SOURCE_ALIAS_GROUPS,
  buildStatusAliases,
  buildSourceAliases,
} from "./enumMappings.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./systemprompt.js";

describe("enumMappings integrity", () => {
  it("has an alias group for every CRM status", () => {
    assertMappingIntegrity();
    for (const status of CRM_STATUSES) {
      expect(STATUS_ALIAS_GROUPS[status]).toBeDefined();
      expect(STATUS_ALIAS_GROUPS[status].length).toBeGreaterThan(0);
    }
  });

  it("has an alias group for every data source", () => {
    for (const source of DATA_SOURCES) {
      expect(SOURCE_ALIAS_GROUPS[source]).toBeDefined();
      expect(SOURCE_ALIAS_GROUPS[source].length).toBeGreaterThan(0);
    }
  });

  it("maps all aliases to valid enum values", () => {
    for (const target of Object.values(buildStatusAliases())) {
      expect(CRM_STATUSES).toContain(target);
    }
    for (const target of Object.values(buildSourceAliases())) {
      expect(DATA_SOURCES).toContain(target);
    }
  });
});

describe("systemprompt", () => {
  it("includes every CRM status in the prompt text", () => {
    for (const status of CRM_STATUSES) {
      expect(EXTRACTION_SYSTEM_PROMPT).toContain(status);
    }
  });

  it("includes every data source in the prompt text", () => {
    for (const source of DATA_SOURCES) {
      expect(EXTRACTION_SYSTEM_PROMPT).toContain(source);
    }
  });

  it("documents DD/MM ambiguity rule", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("DD/MM/YYYY");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("05/06/2026");
  });

  it("documents Indian mobile rule", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("6, 7, 8, or 9");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Exactly 10 digits");
  });

  it("requires rowIndex on all results", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("EVERY result (imported or skipped) MUST include rowIndex");
  });

  it("includes few-shot examples", () => {
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Worked examples");
    expect(EXTRACTION_SYSTEM_PROMPT).toContain("Blank row");
  });
});
