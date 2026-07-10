import Papa from "papaparse";
import type { ParsedCsvPreview } from "@/types/crm";

export interface ParseProgressUpdate {
  rowsParsed: number;
  headers: string[];
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim()] = value == null ? "" : String(value).trim();
  }
  return normalized;
}

function trimHeaders(fields: string[] | undefined): string[] {
  return (fields ?? []).map((header) => header.trim());
}

export function parseCsvFile(file: File): Promise<ParsedCsvPreview> {
  return parseCsvFileIncremental(file);
}

/** Incremental CSV parse — calls onProgress as each row chunk is parsed. */
export function parseCsvFileIncremental(
  file: File,
  onProgress?: (update: ParseProgressUpdate) => void,
): Promise<ParsedCsvPreview> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    let headers: string[] = [];

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      // Worker mode cannot clone step/transformHeader callbacks — parse on main thread.
      step: (results) => {
        if (results.meta.fields && headers.length === 0) {
          headers = trimHeaders(results.meta.fields);
        }
        rows.push(normalizeRow(results.data as Record<string, unknown>));
        if (rows.length % 25 === 0 || rows.length <= 5) {
          onProgress?.({ rowsParsed: rows.length, headers });
        }
      },
      complete: () => {
        if (headers.length === 0) {
          reject(new Error("CSV has no headers or is empty."));
          return;
        }
        onProgress?.({ rowsParsed: rows.length, headers });
        resolve({ headers, rows, fileName: file.name });
      },
      error: (error) => reject(error),
    });
  });
}

export function isValidCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
}
