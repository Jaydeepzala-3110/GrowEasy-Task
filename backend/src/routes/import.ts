import { Router, type Request, type Response } from "express";
import multer from "multer";
import { parseCsvBuffer } from "../services/csvParser.js";
import { extractLeadsFromRows } from "../services/aiExtractor.js";
import type { ImportResult, ProgressEvent } from "../types/crm.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv") && file.mimetype !== "text/csv") {
      cb(new Error("Only CSV files are allowed."));
      return;
    }
    cb(null, true);
  },
});

export const importRouter = Router();

function sendEvent(res: Response, event: ProgressEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

importRouter.post("/", upload.single("file"), async (req: Request, res: Response) => {
  const streamProgress = req.query.stream === "true";

  try {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file uploaded. Use field name 'file'." });
      return;
    }

    const { rows } = parseCsvBuffer(req.file.buffer);

    if (rows.length === 0) {
      res.status(400).json({ error: "CSV file contains no data rows." });
      return;
    }

    if (streamProgress) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      sendEvent(res, {
        type: "progress",
        message: `Parsed ${rows.length} rows. Starting AI extraction…`,
        currentBatch: 0,
        totalBatches: Math.ceil(rows.length / (Number(process.env.BATCH_SIZE) || 10)),
      });

      const { imported, skipped } = await extractLeadsFromRows(rows, (progress) => {
        sendEvent(res, { type: "progress", ...progress });
      });

      const result: ImportResult = {
        imported,
        skipped,
        totalImported: imported.length,
        totalSkipped: skipped.length,
      };

      sendEvent(res, { type: "complete", message: "Import complete.", result });
      res.end();
      return;
    }

    const { imported, skipped } = await extractLeadsFromRows(rows);

    const result: ImportResult = {
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
    };

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";

    if (streamProgress && !res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.flushHeaders?.();
      sendEvent(res, { type: "error", message });
      res.end();
      return;
    }

    if (streamProgress && res.headersSent) {
      sendEvent(res, { type: "error", message });
      res.end();
      return;
    }

    res.status(500).json({ error: message });
  }
});

importRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "csv-importer" });
});
