'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Mail, Phone, Calendar, Package } from 'lucide-react';
import { Supplier, PlanningRequestItem, SUPPLIER_METHOD_CONFIG } from './types';

interface PlanningRequestPreviewProps {
  supplier: Supplier;
  items: PlanningRequestItem[];
  deliveryDate?: Date;
  notes?: string;
  className?: string;
}

export function PlanningRequestPreview({
  supplier,
  items,
  deliveryDate,
  notes,
  className,
}: PlanningRequestPreviewProps) {
  const totalUnits = items.reduce((sum, item) => sum + item.units, 0);
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const methodConfig = SUPPLIER_METHOD_CONFIG[supplier.method];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Supplier Info Card */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {supplier.name}
              </h3>
              <Badge variant="outline">{supplier.code}</Badge>
              <Badge className={cn('text-xs', methodConfig.label === 'API Integration' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                {methodConfig.label}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-slate-600 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>{supplier.email}</span>
              </div>
              {supplier.contactPerson && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>
                    {supplier.contactPerson}
                    {supplier.phone && ` • ${supplier.phone}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Date & Notes */}
      {(deliveryDate || notes) && (
        <div className="grid grid-cols-2 gap-4">
          {deliveryDate && (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-neutral-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Requested Delivery</span>
              </div>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatDate(deliveryDate)}
              </p>
            </div>
          )}
          {notes && (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-700">
              <div className="text-sm text-slate-500 dark:text-neutral-400 mb-1">
                Notes
              </div>
              <p className="text-sm text-slate-900 dark:text-white">{notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="border rounded-lg overflow-hidden dark:border-neutral-700">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-neutral-800">
              <TableHead className="font-semibold">Style Code</TableHead>
              <TableHead className="font-semibold">Product</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="text-right font-semibold">Units</TableHead>
              <TableHead className="text-right font-semibold">Unit Price</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-sm">{item.styleCode}</TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell>
                  <span className="text-slate-500 dark:text-neutral-400">
                    {item.gender} / {item.category}
                  </span>
                </TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell className="text-right font-medium">
                  {item.units.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.totalValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Package className="h-5 w-5" />
          <span className="font-medium">
            {items.length} items • {totalUnits.toLocaleString()} total units
          </span>
        </div>
        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
          {formatCurrency(totalValue)}
        </div>
      </div>
    </div>
  );
}

export default PlanningRequestPreview;
