"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setError(null);

      if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
        setError("Please upload a valid CSV file.");
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "rounded-lg border-2 border-dashed p-10 text-center transition-colors sm:p-14",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          isDragging
            ? "border-primary bg-surface-soft"
            : "border-hairline bg-surface-card hover:border-primary/50",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-canvas border border-hairline">
          <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h2 className="font-display text-2xl font-medium text-ink">Upload your CSV</h2>
        <p className="mt-2 text-sm text-muted">
          Drag and drop a file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-soft">Supports Facebook exports, Google Ads, Excel, CRM dumps, and more</p>
      </div>

      {error && (
        <p className="rounded-md border border-error/30 bg-canvas px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
