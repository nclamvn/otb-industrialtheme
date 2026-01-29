'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  Bell,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';

interface WSSIRecord {
  id: string;
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  division: { id: string; name: string; code: string };
  brand: { id: string; name: string; code: string };
  category: { id: string; name: string; code: string } | null;
  subcategory: { id: string; name: string; code: string } | null;
  season: { id: string; name: string; code: string };
  location: { id: string; name: string; code: string } | null;
  openingStockValue: number;
  closingStockValue: number;
  salesPlanValue: number;
  salesActualValue: number;
  intakePlanValue: number;
  intakeActualValue: number;
  weeksOfCover: number;
  salesVariancePct: number;
  intakeVariancePct: number;
  sellThroughPct: number;
  forecastType: 'PLAN' | 'REFORECAST' | 'ACTUAL';
  alerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    title: string;
    isAcknowledged: boolean;
  }>;
}

// Demo data
function generateDemoData(): WSSIRecord[] {
  const brands = [
    { id: '1', name: 'Nike', code: 'NK' },
    { id: '2', name: 'Adidas', code: 'AD' },
    { id: '3', name: 'Puma', code: 'PM' },
  ];

  const categories = [
    { id: '1', name: 'Footwear', code: 'FW' },
    { id: '2', name: 'Apparel', code: 'AP' },
    { id: '3', name: 'Accessories', code: 'AC' },
  ];

  const divisions = [
    { id: '1', name: 'North', code: 'N' },
    { id: '2', name: 'South', code: 'S' },
  ];

  const records: WSSIRecord[] = [];
  const currentYear = new Date().getFullYear();

  for (let week = 1; week <= 12; week++) {
    brands.forEach((brand, brandIdx) => {
      categories.forEach((category, catIdx) => {
        const salesPlan = 50000 + Math.random() * 100000;
        const salesActual = salesPlan * (0.85 + Math.random() * 0.3);
        const variance = ((salesActual - salesPlan) / salesPlan) * 100;
        const intakePlan = 40000 + Math.random() * 80000;
        const intakeActual = intakePlan * (0.9 + Math.random() * 0.2);
        const closingStock = 200000 + Math.random() * 300000;
        const woc = closingStock / (salesActual / 4);

        const alerts: WSSIRecord['alerts'] = [];
        if (woc < 3) {
          alerts.push({
            id: `alert-${week}-${brandIdx}-${catIdx}-1`,
            alertType: 'LOW_STOCK',
            severity: 'HIGH',
            title: 'Low stock alert',
            isAcknowledged: false,
          });
        }
        if (variance < -15) {
          alerts.push({
            id: `alert-${week}-${brandIdx}-${catIdx}-2`,
            alertType: 'SALES_VARIANCE',
            severity: 'MEDIUM',
            title: 'Sales below plan',
            isAcknowledged: Math.random() > 0.5,
          });
        }

        records.push({
          id: `wssi-${week}-${brand.id}-${category.id}`,
          year: currentYear,
          weekNumber: week,
          weekStartDate: new Date(currentYear, 0, 1 + (week - 1) * 7).toISOString(),
          weekEndDate: new Date(currentYear, 0, 7 + (week - 1) * 7).toISOString(),
          division: divisions[brandIdx % 2],
          brand,
          category,
          subcategory: null,
          season: { id: '1', name: 'Spring/Summer 2026', code: 'SS26' },
          location: null,
          openingStockValue: closingStock * 1.1,
          closingStockValue: closingStock,
          salesPlanValue: salesPlan,
          salesActualValue: salesActual,
          intakePlanValue: intakePlan,
          intakeActualValue: intakeActual,
          weeksOfCover: woc,
          salesVariancePct: variance,
          intakeVariancePct: ((intakeActual - intakePlan) / intakePlan) * 100,
          sellThroughPct: (salesActual / (closingStock + salesActual)) * 100,
          forecastType: week <= 4 ? 'ACTUAL' : week <= 8 ? 'REFORECAST' : 'PLAN',
          alerts,
        });
      });
    });
  }

  return records;
}

const demoRecords = generateDemoData();

const demoBrands = [
  { id: '1', name: 'Nike', code: 'NK' },
  { id: '2', name: 'Adidas', code: 'AD' },
  { id: '3', name: 'Puma', code: 'PM' },
];

const demoDivisions = [
  { id: '1', name: 'North', code: 'N' },
  { id: '2', name: 'South', code: 'S' },
];

const demoSeasons = [
  { id: '1', name: 'Spring/Summer 2026', code: 'SS26' },
  { id: '2', name: 'Fall/Winter 2025', code: 'FW25' },
];

export default function WSSIPage() {
  const router = useRouter();
  const t = useTranslations('wssi');
  const currentYear = new Date().getFullYear();

  // Filters
  const [yearFilter, setYearFilter] = useState<number>(currentYear);
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  // Filter records
  const filteredRecords = useMemo(() => {
    return demoRecords.filter((record) => {
      if (record.year !== yearFilter) return false;
      if (brandFilter !== 'all' && record.brand.id !== brandFilter) return false;
      if (divisionFilter !== 'all' && record.division.id !== divisionFilter) return false;
      if (seasonFilter !== 'all' && record.season.id !== seasonFilter) return false;
      return true;
    });
  }, [yearFilter, brandFilter, divisionFilter, seasonFilter]);

  // Calculate summary
  const summary = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    const totals = filteredRecords.reduce(
      (acc, record) => ({
        totalSalesPlan: acc.totalSalesPlan + record.salesPlanValue,
        totalSalesActual: acc.totalSalesActual + record.salesActualValue,
        totalIntakePlan: acc.totalIntakePlan + record.intakePlanValue,
        totalIntakeActual: acc.totalIntakeActual + record.intakeActualValue,
        sumWoC: acc.sumWoC + record.weeksOfCover,
        sumSellThrough: acc.sumSellThrough + record.sellThroughPct,
        sumVariance: acc.sumVariance + record.salesVariancePct,
      }),
      { totalSalesPlan: 0, totalSalesActual: 0, totalIntakePlan: 0, totalIntakeActual: 0, sumWoC: 0, sumSellThrough: 0, sumVariance: 0 }
    );

    return {
      year: yearFilter,
      recordCount: filteredRecords.length,
      totals: {
        totalSalesPlan: totals.totalSalesPlan,
        totalSalesActual: totals.totalSalesActual,
        totalIntakePlan: totals.totalIntakePlan,
        totalIntakeActual: totals.totalIntakeActual,
        averageWoC: totals.sumWoC / filteredRecords.length,
        averageSellThrough: totals.sumSellThrough / filteredRecords.length,
        averageSalesVariance: totals.sumVariance / filteredRecords.length,
      },
    };
  }, [filteredRecords, yearFilter]);

  const alertCount = useMemo(() => {
    return filteredRecords.reduce(
      (count, record) => count + record.alerts.filter(a => !a.isAcknowledged).length,
      0
    );
  }, [filteredRecords]);

  const getVarianceBadge = (variance: number) => {
    if (variance >= 10) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <TrendingUp className="mr-1 h-3 w-3" />
          +{variance.toFixed(1)}%
        </Badge>
      );
    } else if (variance <= -10) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <TrendingDown className="mr-1 h-3 w-3" />
          {variance.toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
      </Badge>
    );
  };

  const getWoCBadge = (woc: number) => {
    if (woc < 3) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{woc.toFixed(1)} {t('wks')}</Badge>;
    } else if (woc > 8) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{woc.toFixed(1)} {t('wks')}</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{woc.toFixed(1)} {t('wks')}</Badge>;
  };

  const getForecastTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PLAN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      REFORECAST: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      ACTUAL: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const columns: ColumnDef<WSSIRecord>[] = [
    {
      accessorKey: 'weekNumber',
      header: t('week'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">W{row.original.weekNumber}</p>
          <p className="text-xs text-muted-foreground">{row.original.year}</p>
        </div>
      ),
    },
    {
      id: 'brand',
      accessorFn: (row) => row.brand?.name || '',
      header: t('brand'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.brand?.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.category?.name || t('allCategories')}
          </p>
        </div>
      ),
      filterFn: 'includesString',
    },
    {
      accessorKey: 'salesActualValue',
      header: t('actualSales'),
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-medium">{formatCurrency(row.original.salesActualValue)}</p>
          <p className="text-xs text-muted-foreground">
            {t('plan')}: {formatCurrency(row.original.salesPlanValue)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'salesVariancePct',
      header: t('variance'),
      cell: ({ row }) => getVarianceBadge(Number(row.original.salesVariancePct)),
    },
    {
      accessorKey: 'closingStockValue',
      header: t('stock'),
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.closingStockValue)}
        </span>
      ),
    },
    {
      accessorKey: 'weeksOfCover',
      header: t('woc'),
      cell: ({ row }) => getWoCBadge(Number(row.original.weeksOfCover)),
    },
    {
      accessorKey: 'sellThroughPct',
      header: t('sellThrough'),
      cell: ({ row }) => `${Number(row.original.sellThroughPct).toFixed(1)}%`,
    },
    {
      accessorKey: 'forecastType',
      header: t('type'),
      cell: ({ row }) => getForecastTypeBadge(row.original.forecastType),
    },
    {
      accessorKey: 'alerts',
      header: t('alert'),
      cell: ({ row }) => {
        const activeAlerts = row.original.alerts?.filter(a => !a.isAcknowledged) || [];
        if (activeAlerts.length === 0) return null;
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {activeAlerts.length}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/wssi/${record.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/wssi/${record.id}?reforecast=true`)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('reforecast')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button variant="outline" onClick={() => router.push('/wssi/alerts')}>
          <Bell className="mr-2 h-4 w-4" />
          {t('alerts')}
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alertCount}
            </Badge>
          )}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <BarChart3 className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('salesVsPlan')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">
              {summary?.totals.averageSalesVariance
                ? `${summary.totals.averageSalesVariance > 0 ? '+' : ''}${summary.totals.averageSalesVariance.toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('actual')}: {formatCurrency(summary?.totals.totalSalesActual || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('weeksOfCover')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">
              {summary?.totals.averageWoC?.toFixed(1) || '0'} {t('weeks')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('target')}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('sellThruRate')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">
              {summary?.totals.averageSellThrough?.toFixed(1) || '0'}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('records', { count: summary?.recordCount || 0 })}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('activeAlerts')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-orange-600">{alertCount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('needsAction')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={yearFilter.toString()} onValueChange={(v) => setYearFilter(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder={t('year')} />
          </SelectTrigger>
          <SelectContent>
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('region')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRegions')}</SelectItem>
            {demoDivisions.map((division) => (
              <SelectItem key={division.id} value={division.id}>
                {division.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('brand')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allBrands')}</SelectItem>
            {demoBrands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('season')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allSeasons')}</SelectItem>
            {demoSeasons.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                {season.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => {}}>
          <Filter className="mr-2 h-4 w-4" />
          {t('apply')}
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        searchKey="brand"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={false}
      />
    </div>
  );
}
