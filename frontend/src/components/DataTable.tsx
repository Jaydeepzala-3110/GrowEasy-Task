"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface DataTableProps {
  headers: string[];
  rows: Record<string, string>[];
  caption?: string;
  maxHeight?: string;
  emptyMessage?: string;
}

const ROW_HEIGHT = 40;

export function DataTable({
  headers,
  rows,
  caption,
  maxHeight = "28rem",
  emptyMessage = "No data to display.",
}: DataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  if (headers.length === 0) {
    return (
      <p className="rounded-lg border border-hairline bg-surface-card px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
      {caption && (
        <div className="border-b border-hairline bg-surface-soft px-4 py-3">
          <p className="text-sm font-medium text-body-strong">{caption}</p>
        </div>
      )}
      <div ref={parentRef} className="overflow-auto" style={{ maxHeight }}>
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-card">
            <tr>
              <th className="whitespace-nowrap border-b border-hairline px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap border-b border-hairline px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                  <tr aria-hidden style={{ height: virtualRows[0].start }}>
                    <td colSpan={headers.length + 1} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const index = virtualRow.index;
                  return (
                    <tr
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className="border-b border-hairline-soft last:border-0 even:bg-surface-soft/50"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-soft">
                        {index + 1}
                      </td>
                      {headers.map((header) => (
                        <td
                          key={`${index}-${header}`}
                          className="max-w-xs truncate whitespace-nowrap px-4 py-2.5 text-body"
                          title={row[header] || ""}
                        >
                          {row[header] || "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {virtualRows.length > 0 && (
                  <tr
                    aria-hidden
                    style={{
                      height:
                        rowVirtualizer.getTotalSize() -
                        (virtualRows[virtualRows.length - 1]?.end ?? 0),
                    }}
                  >
                    <td colSpan={headers.length + 1} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="border-t border-hairline bg-surface-soft px-4 py-2 text-xs text-muted">
          Showing {rows.length.toLocaleString()} rows · virtualized scroll
        </div>
      )}
    </div>
  );
}
