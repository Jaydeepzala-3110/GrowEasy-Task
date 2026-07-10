interface ParseProgressProps {
  fileName: string;
  rowsParsed: number;
  message?: string;
}

export function ParseProgress({ fileName, rowsParsed, message }: ParseProgressProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-hairline bg-canvas">
        <svg className="h-7 w-7 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-medium text-ink">Parsing CSV</h2>
      <p className="mt-2 text-sm text-muted">{message ?? `Reading ${fileName}…`}</p>
      <p className="mt-4 font-mono text-lg text-body-strong">{rowsParsed.toLocaleString()} rows parsed</p>
      <p className="mt-2 text-xs text-muted-soft">Incremental parsing — rows stream in as they are read</p>
    </div>
  );
}
