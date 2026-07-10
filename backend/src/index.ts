import "dotenv/config";
import cors from "cors";
import express from "express";
import { importRouter } from "./routes/import.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/import", importRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(400).json({ error: err.message });
  },
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GrowEasy CSV Importer API running on http://0.0.0.0:${PORT}`);
});
