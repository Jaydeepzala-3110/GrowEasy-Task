import OpenAI from "openai";
import type { CrmLead, SkippedRecord } from "../types/crm.js";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "../prompts/systemprompt.js";
import { hasContact, isBlankRow, normalizeLead } from "./leadNormalizer.js";

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 10;
const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 2;

interface AiRowResult {
  status: "imported" | "skipped";
  lead?: Partial<CrmLead>;
  rowIndex?: number;
  reason?: string;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

async function extractBatch(
  rows: Array<{ rowIndex: number; data: Record<string, string> }>,
): Promise<AiRowResult[]> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildExtractionUserPrompt(rows),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from AI model.");
  }

  const parsed = JSON.parse(content) as { results?: AiRowResult[] };
  const results = parsed.results ?? (Array.isArray(parsed) ? parsed : []);

  if (!Array.isArray(results)) {
    throw new Error("AI response was not a valid results array.");
  }

  return results;
}

async function extractBatchWithRetry(
  rows: Array<{ rowIndex: number; data: Record<string, string> }>,
): Promise<AiRowResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await extractBatch(rows);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("AI extraction failed.");
}

export interface ExtractionProgress {
  currentBatch: number;
  totalBatches: number;
  message: string;
  importedSoFar: number;
  skippedSoFar: number;
}

export async function extractLeadsFromRows(
  rows: Record<string, string>[],
  onProgress?: (progress: ExtractionProgress) => void,
): Promise<{ imported: CrmLead[]; skipped: SkippedRecord[] }> {
  const imported: CrmLead[] = [];
  const skipped: SkippedRecord[] = [];

  const batches: Array<Array<{ rowIndex: number; data: Record<string, string> }>> = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((data, offset) => ({
      rowIndex: i + offset + 1,
      data,
    }));
    batches.push(batch);
  }

  const totalBatches = batches.length || 1;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    onProgress?.({
      currentBatch: batchIndex + 1,
      totalBatches,
      message: `Processing batch ${batchIndex + 1} of ${totalBatches}…`,
      importedSoFar: imported.length,
      skippedSoFar: skipped.length,
    });

    const results = await extractBatchWithRetry(batch);

    for (let i = 0; i < batch.length; i++) {
      const input = batch[i];
      const result = results[i];

      if (isBlankRow(input.data)) {
        skipped.push({
          rowIndex: input.rowIndex,
          rawData: input.data,
          reason: "Blank row — no contact information",
        });
        continue;
      }

      if (!result || result.status === "skipped") {
        skipped.push({
          rowIndex: result?.rowIndex ?? input.rowIndex,
          rawData: input.data,
          reason: result?.reason ?? "Missing email and mobile number",
        });
        continue;
      }

      if (result.rowIndex !== undefined && result.rowIndex !== input.rowIndex) {
        skipped.push({
          rowIndex: input.rowIndex,
          rawData: input.data,
          reason: `AI rowIndex mismatch: expected ${input.rowIndex}, got ${result.rowIndex}`,
        });
        continue;
      }

      const lead = normalizeLead(result.lead ?? {});
      if (!hasContact(lead)) {
        skipped.push({
          rowIndex: input.rowIndex,
          rawData: input.data,
          reason: "Missing email and mobile number after extraction",
        });
        continue;
      }

      imported.push(lead);
    }

    onProgress?.({
      currentBatch: batchIndex + 1,
      totalBatches,
      message: `Completed batch ${batchIndex + 1} of ${totalBatches}`,
      importedSoFar: imported.length,
      skippedSoFar: skipped.length,
    });
  }

  return { imported, skipped };
}
