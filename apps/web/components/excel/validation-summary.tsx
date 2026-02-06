'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ParseError } from '@/lib/excel';

interface ValidationSummaryProps {
  errors: ParseError[];
  onFixError?: (row: number, field: string) => void;
  className?: string;
}

export function ValidationSummary({
  errors,
  onFixError,
  className,
}: ValidationSummaryProps) {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');

  // Group errors by severity
  const groupedErrors = useMemo(() => {
    const errorList = errors.filter((e) => e.severity === 'error');
    const warningList = errors.filter((e) => e.severity === 'warning');
    return { errors: errorList, warnings: warningList };
  }, [errors]);

  // Group errors by field
  const errorsByField = useMemo(() => {
    const grouped: Record<string, ParseError[]> = {};
    const filteredErrors =
      filterSeverity === 'all'
        ? errors
        : errors.filter((e) => e.severity === filterSeverity);

    for (const error of filteredErrors) {
      const field = error.column || 'General';
      if (!grouped[field]) {
        grouped[field] = [];
      }
      grouped[field].push(error);
    }

    // Sort by count (descending)
    return Object.entries(grouped)
      .sort((a, b) => b[1].length - a[1].length)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, ParseError[]>);
  }, [errors, filterSeverity]);

  // Get unique rows with errors
  const affectedRows = useMemo(() => {
    return new Set(errors.map((e) => e.row)).size;
  }, [errors]);

  if (errors.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-8 w-8" />
            <div>
              <p className="font-medium">All validations passed!</p>
              <p className="text-sm text-muted-foreground">
                Your data is ready for import.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Validation Issues</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={filterSeverity === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterSeverity('all')}
            >
              All ({errors.length})
            </Button>
            <Button
              variant={filterSeverity === 'error' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterSeverity('error')}
              className="text-red-600"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Errors ({groupedErrors.errors.length})
            </Button>
            <Button
              variant={filterSeverity === 'warning' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterSeverity('warning')}
              className="text-yellow-600"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Warnings ({groupedErrors.warnings.length})
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Issues:</span>
            <Badge variant="outline">{errors.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Affected Rows:</span>
            <Badge variant="outline">{affectedRows}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Can Import:</span>
            <Badge variant={groupedErrors.errors.length === 0 ? 'default' : 'destructive'}>
              {groupedErrors.errors.length === 0 ? 'Yes' : 'Fix Errors First'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <Accordion type="multiple" className="w-full">
            {Object.entries(errorsByField).map(([field, fieldErrors]) => {
              const hasErrors = fieldErrors.some((e) => e.severity === 'error');
              const errorCount = fieldErrors.filter((e) => e.severity === 'error').length;
              const warningCount = fieldErrors.filter((e) => e.severity === 'warning').length;

              return (
                <AccordionItem key={field} value={field}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {hasErrors ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium">{field}</span>
                      <div className="flex items-center gap-2">
                        {errorCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {errorCount} error{errorCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                            {warningCount} warning{warningCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Row</TableHead>
                          <TableHead className="w-[80px]">Severity</TableHead>
                          <TableHead>Message</TableHead>
                          {onFixError && <TableHead className="w-[80px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fieldErrors.slice(0, 20).map((error, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{error.row}</TableCell>
                            <TableCell>
                              {error.severity === 'error' ? (
                                <Badge variant="destructive" className="text-xs">
                                  Error
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-yellow-600">
                                  Warning
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{error.message}</TableCell>
                            {onFixError && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onFixError(error.row, error.column)}
                                >
                                  Fix
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {fieldErrors.length > 20 && (
                          <TableRow>
                            <TableCell colSpan={onFixError ? 4 : 3} className="text-center text-muted-foreground">
                              ...and {fieldErrors.length - 20} more issues
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>

        {/* Common Fixes Suggestions */}
        {groupedErrors.errors.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Quick Fixes
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {errorsByField['Category'] && (
                <li>• Check that all categories match the system categories (see Reference sheet)</li>
              )}
              {errorsByField['Gender'] && (
                <li>• Use MEN, WOMEN, UNISEX, or KIDS for gender values</li>
              )}
              {errorsByField['SKU Code'] && (
                <li>• Ensure SKU codes are unique and follow the format BRAND-CAT-CODE</li>
              )}
              {errorsByField['Pricing'] && (
                <li>• Verify that cost price is less than retail price</li>
              )}
              {errorsByField['Quantity'] && (
                <li>• Order quantities must be positive numbers</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact validation badge for inline use
export function ValidationBadge({
  errorCount,
  warningCount,
  className,
}: {
  errorCount: number;
  warningCount: number;
  className?: string;
}) {
  if (errorCount === 0 && warningCount === 0) {
    return (
      <Badge variant="outline" className={cn('text-green-600 border-green-600', className)}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Valid
      </Badge>
    );
  }

  if (errorCount > 0) {
    return (
      <Badge variant="destructive" className={className}>
        <XCircle className="h-3 w-3 mr-1" />
        {errorCount} error{errorCount !== 1 ? 's' : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('text-yellow-600 border-yellow-600', className)}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      {warningCount} warning{warningCount !== 1 ? 's' : ''}
    </Badge>
  );
}
