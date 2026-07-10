import { describe, expect, it } from "vitest";
import { isValidCsvFile } from "./csv";

describe("isValidCsvFile", () => {
  it("accepts .csv extension", () => {
    const file = new File(["a,b\n1,2"], "leads.csv", { type: "text/plain" });
    expect(isValidCsvFile(file)).toBe(true);
  });

  it("rejects non-csv files", () => {
    const file = new File(["{}"], "data.json", { type: "application/json" });
    expect(isValidCsvFile(file)).toBe(false);
  });
});
