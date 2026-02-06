'use client';

import { cn } from '@/lib/utils';
import { PlanningCSVRow, COLUMN_HEADERS } from './utils/csv-generator';

interface ExportPreviewProps {
  data: PlanningCSVRow[];
  columns: (keyof PlanningCSVRow)[];
  className?: string;
}

export function ExportPreview({ data, columns, className }: ExportPreviewProps) {
  if (data.length === 0) {
    return (
      <div className={cn('text-center py-4 text-slate-500 dark:text-neutral-400', className)}>
        No data to preview
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {columns.map((column) => (
              <th
                key={column}
                className="px-3 py-2 text-left font-medium text-slate-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {COLUMN_HEADERS[column]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={cn(
                'border-t border-slate-100 dark:border-neutral-800',
                index % 2 === 0 ? 'bg-card dark:bg-neutral-900' : 'bg-muted/50/50 dark:bg-neutral-800/50'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-3 py-2 text-slate-600 dark:text-neutral-400 whitespace-nowrap"
                >
                  {typeof row[column] === 'number'
                    ? column === 'unitPrice' || column === 'totalValue'
                      ? `$${row[column].toLocaleString()}`
                      : row[column].toLocaleString()
                    : row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExportPreview;
