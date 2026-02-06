'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  LayoutList,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBudgetCurrency } from '@/components/ui/budget';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { BudgetCharts } from '@/components/budget';
import { BudgetAllocation, Season, Brand, BUDGET_STATUS_LABELS } from '@/types';

interface BudgetWithRelations extends Omit<BudgetAllocation, 'season' | 'brand' | 'location' | 'createdBy'> {
  season: Season;
  brand: Brand;
  location: { id: string; name: string; code: string };
  createdBy: { id: string; name: string; email: string };
}

export default function BudgetPage() {
  const router = useRouter();
  const t = useTranslations('pages.budget');
  const tCommon = useTranslations('common');
  const tFilters = useTranslations('filters');
  const tBudget = useTranslations('budget');
  const [budgets, setBudgets] = useState<BudgetWithRelations[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithRelations | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    approvedBudget: 0,
    pendingBudget: 0,
    count: 0,
  });

  // Filters
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch budgets with filters
      const params = new URLSearchParams();
      if (seasonFilter !== 'all') params.append('seasonId', seasonFilter);
      if (brandFilter !== 'all') params.append('brandId', brandFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [budgetsRes, seasonsRes, brandsRes] = await Promise.all([
        fetch(`/api/v1/budgets?${params.toString()}`),
        fetch('/api/v1/seasons'),
        fetch('/api/v1/brands'),
      ]);

      const budgetsData = await budgetsRes.json();
      const seasonsData = await seasonsRes.json();
      const brandsData = await brandsRes.json();

      if (budgetsData.success) {
        setBudgets(budgetsData.data);
        setSummary(budgetsData.summary);
      }
      if (seasonsData.success) setSeasons(seasonsData.data);
      if (brandsData.success) setBrands(brandsData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [seasonFilter, brandFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!selectedBudget) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/budgets/${selectedBudget.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success(t('deleteSuccess'));
        setIsDeleteOpen(false);
        fetchData();
      } else {
        toast.error(result.error || t('deleteError'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (budget: BudgetWithRelations) => {
    try {
      const response = await fetch(`/api/v1/budgets/${budget.id}/submit`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        toast.success(t('submitSuccess'));
        fetchData();
      } else {
        toast.error(result.error || t('submitError'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(tCommon('error'));
    }
  };

  // Unified status badge colors
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-muted/50 text-slate-700 border border-border dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
      SUBMITTED: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      UNDER_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      APPROVED: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
      REJECTED: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      REVISED: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {BUDGET_STATUS_LABELS[status as keyof typeof BUDGET_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const columns: ColumnDef<BudgetWithRelations>[] = [
    {
      id: 'season',
      accessorFn: (row) => row.season.code,
      header: t('columnSeason'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.season.code}</span>
      ),
    },
    {
      id: 'brand',
      accessorFn: (row) => row.brand.name,
      header: t('columnBrand'),
      cell: ({ row }) => row.original.brand.name,
    },
    {
      id: 'location',
      accessorFn: (row) => row.location.name,
      header: t('columnLocation'),
      cell: ({ row }) => row.original.location.name,
    },
    {
      accessorKey: 'totalBudget',
      header: t('columnTotalBudget'),
      cell: ({ row }) => (
        <span className="font-medium">
          ${Number(row.original.totalBudget).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('columnStatus'),
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'version',
      header: t('columnVersion'),
      cell: ({ row }) => `v${row.original.version}`,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const budget = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/budget/${budget.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {tCommon('view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/budget-flow/${budget.id}`)}>
                <Layers className="mr-2 h-4 w-4" />
                Budget Flow
              </DropdownMenuItem>
              {['DRAFT', 'REJECTED'].includes(budget.status) && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/budget/${budget.id}?edit=true`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {tCommon('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSubmit(budget)}>
                    <Send className="mr-2 h-4 w-4" />
                    {tCommon('submit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedBudget(budget);
                      setIsDeleteOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {tCommon('delete')}
                  </DropdownMenuItem>
                </>
              )}
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
        <Link href="/budget/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('createBudget')}
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Cards - Flat Design with Large Watermark Icons */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Budget Card */}
        <div
          className={cn(
            'relative rounded-xl border border-border bg-card overflow-hidden',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-slate-800'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <DollarSign className="w-24 h-24 text-slate-600 opacity-[0.08]" />
          </div>
          <div className="relative p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('totalBudgetCard')}</p>
            <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {formatBudgetCurrency(summary.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('allocations', { count: summary.count })}
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div
          className={cn(
            'relative rounded-xl border border-border bg-card overflow-hidden',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-green-500'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <CheckCircle className="w-24 h-24 text-green-600 opacity-[0.08]" />
          </div>
          <div className="relative p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('approved')}</p>
            <div className="text-2xl font-bold text-green-600 mt-1 tabular-nums">
              {formatBudgetCurrency(summary.approvedBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('ofTotal', { percent: ((summary.approvedBudget / summary.totalBudget) * 100 || 0).toFixed(1) })}
            </p>
          </div>
        </div>

        {/* Pending Card */}
        <div
          className={cn(
            'relative rounded-xl border border-border bg-card overflow-hidden',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-amber-500'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Clock className="w-24 h-24 text-amber-600 opacity-[0.08]" />
          </div>
          <div className="relative p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('pending')}</p>
            <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
              {formatBudgetCurrency(summary.pendingBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('awaitingApproval')}</p>
          </div>
        </div>

        {/* Draft Card */}
        <div
          className={cn(
            'relative rounded-xl border border-border bg-card overflow-hidden',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-slate-400'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <XCircle className="w-24 h-24 text-slate-500 opacity-[0.08]" />
          </div>
          <div className="relative p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t('draft')}</p>
            <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              {formatBudgetCurrency(
                summary.totalBudget -
                summary.approvedBudget -
                summary.pendingBudget
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('notSubmitted')}</p>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('columnSeason')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tFilters('allSeasons')}</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('columnBrand')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tFilters('allBrands')}</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('columnStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tFilters('allStatuses')}</SelectItem>
              <SelectItem value="DRAFT">{tBudget('draft')}</SelectItem>
              <SelectItem value="SUBMITTED">{tBudget('submitted')}</SelectItem>
              <SelectItem value="UNDER_REVIEW">{tBudget('underReview')}</SelectItem>
              <SelectItem value="APPROVED">{tBudget('approved')}</SelectItem>
              <SelectItem value="REJECTED">{tBudget('rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'charts' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('charts')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Charts
          </Button>
        </div>
      </div>

      {/* Budget Charts View */}
      {viewMode === 'charts' && (
        <BudgetCharts
          budgets={budgets.map((b) => ({
            id: b.id,
            brandName: b.brand.name,
            seasonName: b.season.name,
            locationName: b.location.name,
            totalBudget: Number(b.totalBudget),
            seasonalBudget: Number(b.seasonalBudget),
            replenishmentBudget: Number(b.replenishmentBudget),
            status: b.status,
          }))}
          summary={summary}
        />
      )}

      {/* Data Table View */}
      {viewMode === 'table' && (
        <DataTable
          columns={columns}
          data={budgets}
          searchKey="brand"
          searchPlaceholder={t('searchPlaceholder')}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deleteBudget')}
        description={t('deleteConfirm', {
          brand: selectedBudget?.brand?.name || '',
          season: selectedBudget?.season?.code || '',
        })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
