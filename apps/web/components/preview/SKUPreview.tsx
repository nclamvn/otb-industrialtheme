'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Ruler,
  Tag,
  ArrowRight,
  ShoppingCart,
  Percent,
  Calendar,
  Box,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface SizeBreakdown {
  size: string;
  quantity: number;
  percentage: number;
}

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  type: 'currency' | 'percentage' | 'number';
}

interface SKUPreviewProps {
  skuId: string;
  skuCode: string;
  productName: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  retailPrice: number;
  wholesalePrice: number;
  margin: number;
  totalQuantity: number;
  totalValue: number;
  status: 'proposed' | 'approved' | 'rejected' | 'on-hold';
  sizeBreakdown: SizeBreakdown[];
  performance: PerformanceMetric[];
  season: string;
  deliveryDate?: string;
  lastUpdated: string;
  onViewDetails?: () => void;
  onEditSKU?: () => void;
  className?: string;
}

export function SKUPreview({
  skuId,
  skuCode,
  productName,
  category,
  subcategory,
  imageUrl,
  retailPrice,
  wholesalePrice,
  margin,
  totalQuantity,
  totalValue,
  status,
  sizeBreakdown,
  performance,
  season,
  deliveryDate,
  lastUpdated,
  onViewDetails,
  onEditSKU,
  className,
}: SKUPreviewProps) {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'approved':
        return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Approved' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' };
      case 'on-hold':
        return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'On Hold' };
      default:
        return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Proposed' };
    }
  };

  const statusConfig = getStatusConfig(status);

  const formatPerformanceValue = (value: number, type: string) => {
    switch (type) {
      case 'currency': return `$${value.toLocaleString()}`;
      case 'percentage': return `${value.toFixed(1)}%`;
      default: return value.toLocaleString();
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Product Image & Header */}
      <div className="p-4 space-y-4">
        {/* Image */}
        <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden bg-muted border">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <Badge className={cn('absolute top-2 right-2 text-xs', statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Product Info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-mono">{skuCode}</p>
          <h3 className="font-semibold text-lg mt-1">{productName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{category}</span>
            {subcategory && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>{subcategory}</span>
              </>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 border text-center">
            <p className="text-xs text-muted-foreground">Retail</p>
            <p className="text-sm font-bold font-mono">${retailPrice.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 border text-center">
            <p className="text-xs text-muted-foreground">Wholesale</p>
            <p className="text-sm font-bold font-mono">${wholesalePrice.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-[#127749]/10 border border-[#127749]/20 text-center">
            <p className="text-xs text-muted-foreground">Margin</p>
            <p className="text-sm font-bold font-mono text-[#127749]">{margin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Quantity & Value */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-[#D7B797]/10 to-transparent">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Box className="w-3 h-3" />
              Total Quantity
            </div>
            <p className="text-lg font-bold font-mono">{totalQuantity.toLocaleString()}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              Total Value
            </div>
            <p className="text-lg font-bold font-mono text-[#127749]">${totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Size Breakdown */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Ruler className="w-4 h-4 text-[#D7B797]" />
          Size Breakdown
        </div>
        <div className="flex flex-wrap gap-2">
          {sizeBreakdown.map((size, idx) => (
            <div
              key={idx}
              className="flex-1 min-w-[60px] p-2 rounded-lg bg-muted/50 border text-center"
            >
              <p className="text-xs font-semibold">{size.size}</p>
              <p className="text-sm font-mono">{size.quantity}</p>
              <p className="text-[9px] text-muted-foreground">{size.percentage}%</p>
            </div>
          ))}
        </div>
        {/* Size Distribution Bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
          {sizeBreakdown.map((size, idx) => (
            <div
              key={idx}
              className="transition-all"
              style={{
                width: `${size.percentage}%`,
                backgroundColor: `hsl(${150 + idx * 30}, 60%, ${45 + idx * 5}%)`,
              }}
              title={`${size.size}: ${size.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="w-4 h-4 text-[#127749]" />
          Historical Performance
        </div>
        <div className="space-y-2">
          {performance.map((metric, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">
                  {formatPerformanceValue(metric.value, metric.type)}
                </span>
                {metric.change !== 0 && (
                  <span
                    className={cn(
                      'flex items-center text-xs',
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {metric.change > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(metric.change)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {season}
          </div>
          {deliveryDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Delivery: {deliveryDate}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </span>
          <div className="flex gap-2">
            {onEditSKU && status !== 'approved' && (
              <Button variant="outline" size="sm" onClick={onEditSKU}>
                Edit
              </Button>
            )}
            <Button
              size="sm"
              onClick={onViewDetails}
              className="bg-[#127749] hover:bg-[#0d5a36]"
            >
              View Details
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data generator
export function generateMockSKUPreview(): Omit<SKUPreviewProps, 'onViewDetails' | 'onEditSKU' | 'className'> {
  return {
    skuId: 'sku-001',
    skuCode: 'WB-SS25-0042',
    productName: 'Classic Leather Tote',
    category: 'Bags',
    subcategory: 'Totes',
    imageUrl: undefined, // Will show placeholder
    retailPrice: 2450,
    wholesalePrice: 980,
    margin: 60,
    totalQuantity: 450,
    totalValue: 441000,
    status: 'proposed',
    sizeBreakdown: [
      { size: 'S', quantity: 90, percentage: 20 },
      { size: 'M', quantity: 180, percentage: 40 },
      { size: 'L', quantity: 135, percentage: 30 },
      { size: 'XL', quantity: 45, percentage: 10 },
    ],
    performance: [
      { label: 'Sell-Through Rate', value: 78.5, change: 5, type: 'percentage' },
      { label: 'Last Season Revenue', value: 385000, change: 12, type: 'currency' },
      { label: 'Units Sold (LY)', value: 412, change: -3, type: 'number' },
    ],
    season: 'SS25',
    deliveryDate: 'Feb 15, 2025',
    lastUpdated: '30 minutes ago',
  };
}
