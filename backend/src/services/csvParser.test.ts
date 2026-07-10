import { describe, expect, it } from "vitest";
import { parseCsvBuffer } from "./csvParser.js";

describe("parseCsvBuffer", () => {
  it("parses headers and rows", () => {
    const csv = `name,email,phone
John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,9876543211`;

    const result = parseCsvBuffer(Buffer.from(csv, "utf-8"));

    expect(result.headers).toEqual(["name", "email", "phone"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe("John Doe");
    expect(result.rows[1].email).toBe("jane@example.com");
  });

  it("throws on empty csv", () => {
    expect(() => parseCsvBuffer(Buffer.from("", "utf-8"))).toThrow();
  });
});
