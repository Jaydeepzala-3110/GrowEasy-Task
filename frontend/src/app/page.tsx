"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { StepIndicator } from "@/components/StepIndicator";
import { UploadZone } from "@/components/UploadZone";
import { DataTable } from "@/components/DataTable";
import { ImportProgress } from "@/components/ImportProgress";
import { ParseProgress } from "@/components/ParseProgress";
import { ResultsView } from "@/components/ResultsView";
import { importCsvWithProgress } from "@/lib/api";
import { parseCsvFileIncremental } from "@/lib/csv";
import type { AppStep, ImportResult, ParsedCsvPreview } from "@/types/crm";

export default function HomePage() {
  const [step, setStep] = useState<AppStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedCsvPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("Starting import…");
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [importedSoFar, setImportedSoFar] = useState(0);
  const [skippedSoFar, setSkippedSoFar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [parseRowsCount, setParseRowsCount] = useState(0);
  const [parsingFileName, setParsingFileName] = useState("");

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setProgressMessage("Starting import…");
    setCurrentBatch(0);
    setTotalBatches(0);
    setImportedSoFar(0);
    setSkippedSoFar(0);
    setIsLoading(false);
    setParseRowsCount(0);
    setParsingFileName("");
  }, []);

  const handleFileSelect = useCallback(async (selected: File) => {
    setError(null);
    setIsLoading(true);
    setParsingFileName(selected.name);
    setParseRowsCount(0);

    try {
      const parsed = await parseCsvFileIncremental(selected, ({ rowsParsed }) => {
        setParseRowsCount(rowsParsed);
      });
      setFile(selected);
      setPreview(parsed);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;

    setError(null);
    setStep("processing");
    setProgressMessage("Uploading and parsing CSV…");
    setCurrentBatch(0);
    setTotalBatches(0);
    setImportedSoFar(0);
    setSkippedSoFar(0);

    try {
      const importResult = await importCsvWithProgress(file, (update) => {
        setProgressMessage(update.message);
        if (update.currentBatch !== undefined) setCurrentBatch(update.currentBatch);
        if (update.totalBatches !== undefined) setTotalBatches(update.totalBatches);
        if (update.importedSoFar !== undefined) setImportedSoFar(update.importedSoFar);
        if (update.skippedSoFar !== undefined) setSkippedSoFar(update.skippedSoFar);
      });

      setResult(importResult);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStep("preview");
    }
  }, [file]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">GrowEasy Assignment</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            AI CSV Importer
          </h1>
          <p className="mt-3 max-w-2xl text-base text-body">
            Upload any lead export — Facebook, Google Ads, Excel, or CRM dumps — and let AI map columns into
            GrowEasy CRM format.
          </p>
        </div>

        <StepIndicator currentStep={step} />

        {error && (
          <div
            className="mb-6 rounded-lg border border-error/30 bg-canvas px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "upload" && isLoading && parsingFileName && (
          <ParseProgress fileName={parsingFileName} rowsParsed={parseRowsCount} />
        )}

        {step === "upload" && !isLoading && (
          <UploadZone onFileSelect={handleFileSelect} disabled={isLoading} />
        )}

        {step === "preview" && preview && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hairline bg-surface-card px-5 py-4">
              <div>
                <p className="text-sm font-medium text-body-strong">{preview.fileName}</p>
                <p className="text-xs text-muted">
                  {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"} · {preview.headers.length} columns
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md border border-hairline bg-canvas px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft"
                >
                  Choose another file
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-active"
                >
                  Confirm import
                </button>
              </div>
            </div>

            <DataTable
              headers={preview.headers}
              rows={preview.rows}
              caption="CSV preview — no AI processing yet"
              maxHeight="32rem"
            />
          </div>
        )}

        {step === "processing" && (
          <ImportProgress
            message={progressMessage}
            currentBatch={currentBatch}
            totalBatches={totalBatches}
            importedSoFar={importedSoFar}
            skippedSoFar={skippedSoFar}
          />
        )}

        {step === "results" && result && <ResultsView result={result} onStartOver={reset} />}
      </main>

      <footer className="mt-auto border-t border-hairline bg-surface-dark py-8 text-on-dark-soft">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm sm:px-6 lg:px-8">
          <p>GrowEasy CSV Importer · Built for the GrowEasy developer assignment</p>
        </div>
      </footer>
    </>
  );
}
