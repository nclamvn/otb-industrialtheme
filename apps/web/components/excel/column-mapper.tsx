'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowRight, CheckCircle, XCircle, Wand2, RotateCcw } from 'lucide-react';

export interface ColumnMapping {
  [systemField: string]: string | null;
}

interface SystemField {
  key: string;
  label: string;
  required: boolean;
  description?: string;
}

const SYSTEM_FIELDS: SystemField[] = [
  { key: 'skuCode', label: 'SKU Code', required: true, description: 'Unique product identifier' },
  { key: 'styleName', label: 'Style Name', required: true, description: 'Product name' },
  { key: 'gender', label: 'Gender', required: true, description: 'MEN, WOMEN, UNISEX, KIDS' },
  { key: 'category', label: 'Category', required: true, description: 'Product category' },
  { key: 'retailPrice', label: 'Retail Price', required: true, description: 'Selling price' },
  { key: 'costPrice', label: 'Cost Price', required: true, description: 'Purchase cost' },
  { key: 'orderQuantity', label: 'Order Quantity', required: true, description: 'Units to order' },
  { key: 'colorCode', label: 'Color Code', required: false },
  { key: 'colorName', label: 'Color Name', required: false },
  { key: 'material', label: 'Material', required: false },
  { key: 'collection', label: 'Collection', required: false },
  { key: 'subcategory', label: 'Subcategory', required: false },
  { key: 'supplierSKU', label: 'Supplier SKU', required: false },
  { key: 'leadTime', label: 'Lead Time', required: false },
  { key: 'moq', label: 'MOQ', required: false },
  { key: 'countryOfOrigin', label: 'Country of Origin', required: false },
];

// Auto-mapping aliases
const COLUMN_ALIASES: Record<string, string[]> = {
  skuCode: ['sku', 'sku_code', 'skucode', 'sku code', 'item code', 'product code'],
  styleName: ['style', 'style_name', 'name', 'product name', 'description'],
  colorCode: ['color_code', 'colorcode', 'color code'],
  colorName: ['color', 'color_name', 'colour'],
  material: ['material', 'fabric', 'composition'],
  collection: ['collection', 'line', 'season collection'],
  gender: ['gender', 'sex', 'target'],
  category: ['category', 'cat', 'product category'],
  subcategory: ['subcategory', 'sub_category', 'sub category'],
  retailPrice: ['retail', 'retail_price', 'price', 'rrp', 'selling price'],
  costPrice: ['cost', 'cost_price', 'wholesale', 'unit cost'],
  orderQuantity: ['qty', 'quantity', 'order_qty', 'order quantity', 'units'],
  supplierSKU: ['supplier_sku', 'vendor sku', 'factory code'],
  leadTime: ['lead_time', 'leadtime', 'delivery days'],
  moq: ['moq', 'min_order', 'minimum order'],
  countryOfOrigin: ['coo', 'country', 'origin', 'made in'],
};

interface ColumnMapperProps {
  sourceColumns: string[];
  sampleData?: Record<string, unknown>[];
  initialMapping?: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
  onComplete: () => void;
  className?: string;
}

export function ColumnMapper({
  sourceColumns,
  sampleData = [],
  initialMapping,
  onMappingChange,
  onComplete,
  className,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(
    initialMapping || autoMapColumns(sourceColumns)
  );

  // Auto-map columns based on aliases
  function autoMapColumns(columns: string[]): ColumnMapping {
    const result: ColumnMapping = {};

    for (const field of SYSTEM_FIELDS) {
      const aliases = COLUMN_ALIASES[field.key] || [field.key];
      const matchedColumn = columns.find((col) =>
        aliases.some((alias) => col.toLowerCase().trim() === alias.toLowerCase())
      );
      result[field.key] = matchedColumn || null;
    }

    return result;
  }

  // Handle mapping change
  const handleMappingChange = (systemField: string, sourceColumn: string | null) => {
    const newMapping = { ...mapping, [systemField]: sourceColumn };
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  // Reset to auto-mapped values
  const handleAutoMap = () => {
    const autoMapped = autoMapColumns(sourceColumns);
    setMapping(autoMapped);
    onMappingChange(autoMapped);
  };

  // Clear all mappings
  const handleClearAll = () => {
    const cleared: ColumnMapping = {};
    for (const field of SYSTEM_FIELDS) {
      cleared[field.key] = null;
    }
    setMapping(cleared);
    onMappingChange(cleared);
  };

  // Check if all required fields are mapped
  const requiredMapped = useMemo(() => {
    return SYSTEM_FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);
  }, [mapping]);

  // Get sample value for a column
  const getSampleValue = (column: string | null): string => {
    if (!column || sampleData.length === 0) return '-';
    const value = sampleData[0][column];
    if (value === null || value === undefined) return '-';
    const str = String(value);
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
  };

  // Count mapped fields
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>
              Map your Excel columns to system fields
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Map
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Mapping Status */}
        <div className="flex items-center gap-4 mt-4">
          <Badge variant={requiredMapped ? 'default' : 'destructive'}>
            {mappedCount} / {SYSTEM_FIELDS.length} fields mapped
          </Badge>
          {!requiredMapped && (
            <span className="text-sm text-red-600">
              Required fields not mapped
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">System Field</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[200px]">Excel Column</TableHead>
              <TableHead>Sample Value</TableHead>
              <TableHead className="w-[50px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SYSTEM_FIELDS.map((field) => (
              <TableRow key={field.key}>
                <TableCell>
                  <div>
                    <span className="font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping[field.key] || ''}
                    onValueChange={(value) =>
                      handleMappingChange(field.key, value || null)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not mapped</SelectItem>
                      {sourceColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getSampleValue(mapping[field.key])}
                </TableCell>
                <TableCell>
                  {mapping[field.key] ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : field.required ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end mt-6">
          <Button onClick={onComplete} disabled={!requiredMapped}>
            Continue with Mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
