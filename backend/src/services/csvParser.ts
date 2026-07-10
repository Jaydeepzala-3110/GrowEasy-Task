import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (fatal) {
      throw new Error(`CSV parse error: ${fatal.message}`);
    }
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    throw new Error("CSV has no headers or is empty.");
  }

  const rows = result.data.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = value == null ? "" : String(value).trim();
    }
    return normalized;
  });

  return { headers, rows };
}
