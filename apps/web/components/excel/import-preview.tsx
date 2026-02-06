'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Trash2, Edit2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ParsedSKU } from '@/lib/excel';

interface ImportPreviewProps {
  data: ParsedSKU[];
  onEdit: (index: number, field: keyof ParsedSKU, value: unknown) => void;
  onDelete: (index: number) => void;
  categories?: { id: string; code: string; name: string }[];
  pageSize?: number;
  className?: string;
}

const GENDER_OPTIONS = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'];

export function ImportPreview({
  data,
  onEdit,
  onDelete,
  categories = [],
  pageSize = 10,
  className,
}: ImportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ParsedSKU } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [filter, setFilter] = useState('');

  // Filter data
  const filteredData = useMemo(() => {
    if (!filter) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter(
      (item) =>
        item.skuCode.toLowerCase().includes(lowerFilter) ||
        item.styleName.toLowerCase().includes(lowerFilter) ||
        item.category.toLowerCase().includes(lowerFilter)
    );
  }, [data, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Start editing
  const handleStartEdit = (row: number, field: keyof ParsedSKU) => {
    setEditingCell({ row, field });
    setEditValue(String(data[row][field] || ''));
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingCell) return;

    const { row, field } = editingCell;
    let value: unknown = editValue;

    // Convert to number for numeric fields
    if (['retailPrice', 'costPrice', 'orderQuantity', 'leadTime', 'moq'].includes(field)) {
      value = parseFloat(editValue) || 0;
    }

    onEdit(row, field, value);
    setEditingCell(null);
    setEditValue('');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Get actual index in original data
  const getActualIndex = (pageIndex: number) => {
    return currentPage * pageSize + pageIndex;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Render editable cell
  const renderEditableCell = (
    item: ParsedSKU,
    index: number,
    field: keyof ParsedSKU,
    displayValue: string | number
  ) => {
    const actualIndex = getActualIndex(index);
    const isEditing = editingCell?.row === actualIndex && editingCell?.field === field;

    if (isEditing) {
      if (field === 'gender') {
        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        );
      }

      if (field === 'category' && categories.length > 0) {
        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 w-24"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded -mx-2 group"
        onClick={() => handleStartEdit(actualIndex, field)}
      >
        <span>{displayValue}</span>
        <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        {/* Filter and Pagination */}
        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder="Search SKU, name, or category..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="w-64"
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {currentPage * pageSize + 1}-
              {Math.min((currentPage + 1) * pageSize, filteredData.length)} of{' '}
              {filteredData.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>SKU Code</TableHead>
                <TableHead>Style Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => {
                const margin = item.retailPrice > 0
                  ? ((item.retailPrice - item.costPrice) / item.retailPrice) * 100
                  : 0;
                const value = item.orderQuantity * item.retailPrice;
                const actualIndex = getActualIndex(index);

                return (
                  <TableRow key={actualIndex}>
                    <TableCell className="text-muted-foreground">
                      {item.rowNumber}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {renderEditableCell(item, index, 'skuCode', item.skuCode)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(item, index, 'styleName', item.styleName)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(
                        item,
                        index,
                        'gender',
                        item.gender
                      )}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(item, index, 'category', item.category)}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderEditableCell(item, index, 'retailPrice', formatCurrency(item.retailPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderEditableCell(item, index, 'costPrice', formatCurrency(item.costPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          margin < 40 ? 'text-red-600' : margin > 70 ? 'text-green-600' : ''
                        )}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {renderEditableCell(
                        item,
                        index,
                        'orderQuantity',
                        item.orderQuantity.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(value)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(actualIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {paginatedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {filter ? 'No matching records found' : 'No data to preview'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
