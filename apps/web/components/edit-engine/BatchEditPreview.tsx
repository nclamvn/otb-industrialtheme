'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// ADV-2: BatchEditPreview — Preview Changes Before Applying
// DAFC OTB Platform — Phase 4 Advanced Features
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface PreviewItem {
  id: string;
  row: Record<string, unknown>;
  changes: Record<string, { from: unknown; to: unknown }>;
  hasChanges: boolean;
}

interface BatchEditPreviewProps {
  preview: PreviewItem[];
  idField: string;
  displayField?: string;
  fieldLabels?: Record<string, string>;
  formatValue?: (field: string, value: unknown) => string;
  maxHeight?: string;
  className?: string;
}

// ─── Batch Edit Preview Component ───────────────────────────────────────────────
export function BatchEditPreview({
  preview,
  idField,
  displayField,
  fieldLabels = {},
  formatValue = defaultFormatValue,
  maxHeight = '400px',
  className,
}: BatchEditPreviewProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRows(new Set(preview.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  // Calculate summary statistics
  const totalRows = preview.length;
  const totalChanges = preview.reduce(
    (sum, item) => sum + Object.keys(item.changes).length,
    0
  );
  const uniqueFields = new Set(preview.flatMap((p) => Object.keys(p.changes)));

  if (preview.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Không có thay đổi để xem trước</p>
          <p className="text-sm mt-1">Chọn các dòng và nhập giá trị mới để xem trước thay đổi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Xem trước thay đổi</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalRows} dòng</Badge>
            <Badge variant="secondary">{totalChanges} thay đổi</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <button
            onClick={expandAll}
            className="text-primary hover:underline"
          >
            Mở rộng tất cả
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-primary hover:underline"
          >
            Thu gọn tất cả
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg mb-4 text-sm">
          <p className="font-medium mb-1">Tóm tắt thay đổi:</p>
          <div className="flex flex-wrap gap-2">
            {Array.from(uniqueFields).map((field) => {
              const count = preview.filter((p) => field in p.changes).length;
              return (
                <span
                  key={field}
                  className="px-2 py-0.5 bg-background rounded text-xs"
                >
                  {fieldLabels[field] || field}: {count} dòng
                </span>
              );
            })}
          </div>
        </div>

        {/* Preview List */}
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-2">
            {preview.map((item) => {
              const isExpanded = expandedRows.has(item.id);
              const displayValue = displayField
                ? String(item.row[displayField] || item.id)
                : item.id;
              const changeCount = Object.keys(item.changes).length;

              return (
                <Collapsible
                  key={item.id}
                  open={isExpanded}
                  onOpenChange={() => toggleRow(item.id)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium truncate">{displayValue}</span>
                        <Badge variant="outline" className="ml-auto">
                          {changeCount} thay đổi
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-3 space-y-2 bg-muted/30">
                        {Object.entries(item.changes).map(([field, change]) => (
                          <ChangeRow
                            key={field}
                            field={field}
                            label={fieldLabels[field] || field}
                            from={formatValue(field, change.from)}
                            to={formatValue(field, change.to)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        {/* Warning if many changes */}
        {totalRows > 50 && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p>
              Bạn đang thay đổi {totalRows} dòng. Vui lòng kiểm tra kỹ trước khi áp dụng.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Change Row Component ───────────────────────────────────────────────────────
interface ChangeRowProps {
  field: string;
  label: string;
  from: string;
  to: string;
}

function ChangeRow({ label, from, to }: ChangeRowProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-24 truncate">{label}:</span>
      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded line-through">
        {from || '(trống)'}
      </span>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
        {to || '(trống)'}
      </span>
    </div>
  );
}

// ─── Compact Preview Component ──────────────────────────────────────────────────
interface BatchEditPreviewCompactProps {
  preview: PreviewItem[];
  fieldLabels?: Record<string, string>;
  className?: string;
}

export function BatchEditPreviewCompact({
  preview,
  fieldLabels = {},
  className,
}: BatchEditPreviewCompactProps) {
  const totalRows = preview.length;
  const uniqueFields = new Set(preview.flatMap((p) => Object.keys(p.changes)));

  if (preview.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm',
        className
      )}
    >
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Sẵn sàng áp dụng {totalRows} thay đổi</p>
        <p className="text-xs text-muted-foreground">
          Các trường: {Array.from(uniqueFields).map((f) => fieldLabels[f] || f).join(', ')}
        </p>
      </div>
    </div>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function defaultFormatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    // Check if it looks like currency
    if (value > 10000) {
      return new Intl.NumberFormat('vi-VN').format(value);
    }
    return value.toLocaleString('vi-VN');
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('vi-VN');
  }
  return String(value);
}

export default BatchEditPreview;
