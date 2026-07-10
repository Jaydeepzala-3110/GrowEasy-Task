interface ImportProgressProps {
  message: string;
  currentBatch?: number;
  totalBatches?: number;
  importedSoFar?: number;
  skippedSoFar?: number;
}

export function ImportProgress({
  message,
  currentBatch = 0,
  totalBatches = 0,
  importedSoFar = 0,
  skippedSoFar = 0,
}: ImportProgressProps) {
  const percent =
    totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : undefined;

  return (
    <div className="rounded-lg border border-hairline bg-surface-card p-8 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-canvas border border-hairline">
        <svg
          className="h-8 w-8 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <h2 className="font-display text-2xl font-medium text-ink">Extracting CRM leads</h2>
      <p className="mt-2 animate-pulse-soft text-sm text-muted">{message}</p>

      {(importedSoFar > 0 || skippedSoFar > 0) && (
        <div className="mx-auto mt-4 flex max-w-md justify-center gap-6 text-sm">
          <span className="text-success">{importedSoFar.toLocaleString()} imported</span>
          <span className="text-warning">{skippedSoFar.toLocaleString()} skipped</span>
        </div>
      )}

      {totalBatches > 0 && (
        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-2 flex justify-between text-xs text-muted">
            <span>
              Batch {currentBatch} of {totalBatches}
            </span>
            {percent !== undefined && <span>{percent}%</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${percent ?? 5}%` }}
            />
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-soft">
        Streaming AI results batch-by-batch via Server-Sent Events.
      </p>
    </div>
  );
}
