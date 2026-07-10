import type { ImportResult } from "@/types/crm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ProgressUpdate {
  type: "progress" | "complete" | "error";
  message: string;
  currentBatch?: number;
  totalBatches?: number;
  importedSoFar?: number;
  skippedSoFar?: number;
  result?: ImportResult;
}

export async function importCsvWithProgress(
  file: File,
  onProgress: (update: ProgressUpdate) => void,
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/import?stream=true`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Import failed (${response.status})`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported by the server.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const event = JSON.parse(line.slice(6)) as ProgressUpdate;
      onProgress(event);

      if (event.type === "complete" && event.result) {
        return event.result;
      }
      if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }

  throw new Error("Import ended without a result.");
}
