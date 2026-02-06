'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/shared/data-table';
import { TrendingUp, TrendingDown, Minus, Medal, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SKUPerformance {
  skuId: string;
  skuCode: string;
  skuName: string;
  brandName?: string;
  categoryName?: string;
  revenue: number;
  unitsSold: number;
  grossMarginPct: number;
  sellThroughRate: number;
  gmroi: number;
  stockTurnover: number;
  currentStock: number;
  weeksOfCover: number;
  revenueChangePct?: number;
  performanceCategory: 'BEST' | 'WORST' | 'RISING' | 'DECLINING';
  rank: number;
}

interface SKUPerformanceTableProps {
  data: SKUPerformance[];
  isLoading?: boolean;
  variant?: 'best' | 'worst' | 'rising' | 'declining';
}

export function SKUPerformanceTable({
  data,
  isLoading = false,
  variant = 'best',
}: SKUPerformanceTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = ['bg-yellow-500', 'bg-gray-400', 'bg-amber-600'];
      return (
        <Badge className={cn('text-white', colors[rank - 1])}>
          <Medal className="h-3 w-3 mr-1" />
          #{rank}
        </Badge>
      );
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const getTrendIcon = (change?: number) => {
    if (change === undefined || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getWocBadge = (woc: number) => {
    if (woc < 2) return <Badge variant="destructive">{woc.toFixed(1)} wks</Badge>;
    if (woc > 10) return <Badge className="bg-yellow-500 text-white">{woc.toFixed(1)} wks</Badge>;
    return <Badge className="bg-green-500 text-white">{woc.toFixed(1)} wks</Badge>;
  };

  const columns: ColumnDef<SKUPerformance>[] = [
    {
      accessorKey: 'rank',
      header: 'Rank',
      cell: ({ row }) => getRankBadge(row.original.rank),
    },
    {
      accessorKey: 'skuCode',
      header: 'SKU',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.skuCode}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {row.original.skuName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'brandName',
      header: 'Brand/Category',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.brandName}</p>
          <p className="text-xs text-muted-foreground">{row.original.categoryName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-medium">{formatCurrency(row.original.revenue)}</p>
          <div className="flex items-center justify-end gap-1 text-xs">
            {getTrendIcon(row.original.revenueChangePct)}
            <span
              className={cn(
                row.original.revenueChangePct && row.original.revenueChangePct > 0
                  ? 'text-green-600'
                  : row.original.revenueChangePct && row.original.revenueChangePct < 0
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            >
              {row.original.revenueChangePct
                ? `${row.original.revenueChangePct > 0 ? '+' : ''}${row.original.revenueChangePct.toFixed(1)}%`
                : '-'}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'unitsSold',
      header: 'Units Sold',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.unitsSold.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'sellThroughRate',
      header: 'Sell-Through',
      cell: ({ row }) => (
        <div className="w-24">
          <div className="flex justify-between text-xs mb-1">
            <span>{row.original.sellThroughRate.toFixed(1)}%</span>
          </div>
          <Progress
            value={row.original.sellThroughRate}
            className={cn(
              'h-2',
              row.original.sellThroughRate >= 70
                ? '[&>div]:bg-green-500'
                : row.original.sellThroughRate >= 40
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-red-500'
            )}
          />
        </div>
      ),
    },
    {
      accessorKey: 'grossMarginPct',
      header: 'Margin %',
      cell: ({ row }) => (
        <Badge
          variant={row.original.grossMarginPct >= 45 ? 'default' : 'secondary'}
          className={cn(
            row.original.grossMarginPct >= 60
              ? 'bg-green-500'
              : row.original.grossMarginPct >= 45
              ? 'bg-blue-500'
              : ''
          )}
        >
          {row.original.grossMarginPct.toFixed(1)}%
        </Badge>
      ),
    },
    {
      accessorKey: 'gmroi',
      header: 'GMROI',
      cell: ({ row }) => (
        <span
          className={cn(
            'font-medium',
            row.original.gmroi >= 3
              ? 'text-green-600'
              : row.original.gmroi >= 2
              ? 'text-blue-600'
              : row.original.gmroi >= 1
              ? 'text-yellow-600'
              : 'text-red-600'
          )}
        >
          {row.original.gmroi.toFixed(2)}x
        </span>
      ),
    },
    {
      accessorKey: 'weeksOfCover',
      header: 'WoC',
      cell: ({ row }) => getWocBadge(row.original.weeksOfCover),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="skuCode"
      searchPlaceholder="Search SKU..."
      isLoading={isLoading}
    />
  );
}
