import { CRM_COLUMNS, type CrmLead, type ImportResult } from "@/types/crm";
import { DataTable } from "./DataTable";

interface ResultsViewProps {
  result: ImportResult;
  onStartOver: () => void;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "neutral" }) {
  const tones = {
    success: "border-success/30 bg-canvas text-success",
    warning: "border-warning/30 bg-canvas text-warning",
    neutral: "border-hairline bg-surface-card text-ink",
  };

  return (
    <div className={`rounded-lg border px-5 py-4 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-medium">{value}</p>
    </div>
  );
}

function leadsToRows(leads: CrmLead[]): Record<string, string>[] {
  return leads.map((lead) => {
    const row: Record<string, string> = {};
    for (const col of CRM_COLUMNS) {
      row[col.key] = lead[col.key] ?? "";
    }
    return row;
  });
}

function skippedToRows(
  skipped: ImportResult["skipped"],
): { headers: string[]; rows: Record<string, string>[] } {
  if (skipped.length === 0) return { headers: [], rows: [] };

  const headers = ["Row", "Reason", ...Object.keys(skipped[0].rawData)];
  const rows = skipped.map((item) => ({
    Row: String(item.rowIndex),
    Reason: item.reason,
    ...item.rawData,
  }));

  return { headers, rows };
}

export function ResultsView({ result, onStartOver }: ResultsViewProps) {
  const importedHeaders = CRM_COLUMNS.map((c) => c.label);
  const importedRows = leadsToRows(result.imported).map((row) => {
    const mapped: Record<string, string> = {};
    CRM_COLUMNS.forEach((col) => {
      mapped[col.label] = row[col.key];
    });
    return mapped;
  });

  const skippedData = skippedToRows(result.skipped);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Imported" value={result.totalImported} tone="success" />
        <StatCard label="Total Skipped" value={result.totalSkipped} tone="warning" />
        <StatCard
          label="Total Processed"
          value={result.totalImported + result.totalSkipped}
          tone="neutral"
        />
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-ink">Imported leads</h2>
            <p className="mt-1 text-sm text-muted">AI-mapped GrowEasy CRM records</p>
          </div>
        </div>
        <DataTable
          headers={importedHeaders}
          rows={importedRows}
          caption={`${result.totalImported} record${result.totalImported === 1 ? "" : "s"} imported`}
          maxHeight="24rem"
          emptyMessage="No records were imported."
        />
      </section>

      {result.skipped.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="font-display text-2xl font-medium text-ink">Skipped records</h2>
            <p className="mt-1 text-sm text-muted">Rows without valid email or mobile contact</p>
          </div>
          <DataTable
            headers={skippedData.headers}
            rows={skippedData.rows}
            caption={`${result.totalSkipped} record${result.totalSkipped === 1 ? "" : "s"} skipped`}
            maxHeight="20rem"
          />
        </section>
      )}

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-md border border-hairline bg-canvas px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-soft"
        >
          Import another file
        </button>
      </div>
    </div>
  );
}
