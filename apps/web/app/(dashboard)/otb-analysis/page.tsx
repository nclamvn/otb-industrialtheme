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
  Sparkles,
  TrendingUp,
  Package,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
import { Season, Brand, OTB_STATUS_LABELS, OTB_VERSION_LABELS } from '@/types';

interface OTBPlanWithRelations {
  id: string;
  name: string;
  version: number;
  versionType: string;
  status: string;
  createdAt: string;
  budget: {
    id: string;
    totalBudget: number;
    season: { id: string; code: string; name: string };
    brand: { id: string; name: string };
    location: { id: string; name: string };
  };
  createdBy: { id: string; name: string };
  summary: {
    totalPlannedUnits: number;
    totalPlannedAmount: number;
    avgMargin: number;
    itemCount: number;
  };
}

export default function OTBAnalysisPage() {
  const router = useRouter();
  const t = useTranslations('pages.otbAnalysis');
  const tCommon = useTranslations('common');
  const tFilters = useTranslations('filters');
  const tBudget = useTranslations('budget');
  const [plans, setPlans] = useState<OTBPlanWithRelations[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<OTBPlanWithRelations | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (seasonFilter !== 'all') params.append('seasonId', seasonFilter);
      if (brandFilter !== 'all') params.append('brandId', brandFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [plansRes, seasonsRes, brandsRes] = await Promise.all([
        fetch(`/api/v1/otb-plans?${params.toString()}`),
        fetch('/api/v1/seasons'),
        fetch('/api/v1/brands'),
      ]);

      const plansData = await plansRes.json();
      const seasonsData = await seasonsRes.json();
      const brandsData = await brandsRes.json();

      if (plansData.success) setPlans(plansData.data);
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
    if (!selectedPlan) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${selectedPlan.id}`, {
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

  const handleSubmit = async (plan: OTBPlanWithRelations) => {
    try {
      const response = await fetch(`/api/v1/otb-plans/${plan.id}/submit`, {
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      LOCKED: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {OTB_STATUS_LABELS[status as keyof typeof OTB_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const getVersionBadge = (versionType: string) => {
    const colors: Record<string, string> = {
      INITIAL: 'bg-blue-100 text-blue-800',
      REVISED: 'bg-yellow-100 text-yellow-800',
      FINAL: 'bg-green-100 text-green-800',
    };

    return (
      <Badge variant="outline" className={colors[versionType]}>
        {OTB_VERSION_LABELS[versionType as keyof typeof OTB_VERSION_LABELS] || versionType}
      </Badge>
    );
  };

  // Calculate totals
  const totals = plans.reduce(
    (acc, plan) => ({
      totalAmount: acc.totalAmount + plan.summary.totalPlannedAmount,
      totalUnits: acc.totalUnits + plan.summary.totalPlannedUnits,
      count: acc.count + 1,
    }),
    { totalAmount: 0, totalUnits: 0, count: 0 }
  );

  const columns: ColumnDef<OTBPlanWithRelations>[] = [
    {
      accessorKey: 'name',
      header: t('columnPlanName'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.budget.season.code} - {row.original.budget.brand.name}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'version',
      header: t('columnVersion'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>v{row.original.version}</span>
          {getVersionBadge(row.original.versionType)}
        </div>
      ),
    },
    {
      accessorKey: 'summary.totalPlannedAmount',
      header: t('columnPlannedAmount'),
      cell: ({ row }) => (
        <span className="font-medium">
          ${(row.original.summary?.totalPlannedAmount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'summary.totalPlannedUnits',
      header: t('columnUnits'),
      cell: ({ row }) => (row.original.summary?.totalPlannedUnits ?? 0).toLocaleString(),
    },
    {
      accessorKey: 'summary.avgMargin',
      header: t('columnAvgMargin'),
      cell: ({ row }) => `${(row.original.summary?.avgMargin ?? 0).toFixed(1)}%`,
    },
    {
      accessorKey: 'status',
      header: t('columnStatus'),
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/otb-analysis/${plan.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                {tCommon('view')}
              </DropdownMenuItem>
              {['DRAFT', 'REJECTED'].includes(plan.status) && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/otb-analysis/${plan.id}?edit=true`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {tCommon('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSubmit(plan)}>
                    <Send className="mr-2 h-4 w-4" />
                    {tCommon('submit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedPlan(plan);
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
        <Link href="/otb-analysis/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('createPlan')}
          </Button>
        </Link>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-blue-500'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('totalPlans')}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                  {totals.count}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('activePlans')}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-purple-500'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('totalAmount')}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                  ${totals.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('plannedSpend')}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-green-500'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('totalUnits')}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                  {totals.totalUnits.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('plannedUnits')}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-amber-500'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {t('aiProposals')}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                  {t('ready')}
                </p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('generateProposals')}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={tBudget('season')} />
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
            <SelectValue placeholder={tBudget('brand')} />
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
            <SelectValue placeholder={tBudget('status')} />
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={plans}
        searchKey="name"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={isLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deletePlan')}
        description={t('deleteConfirm', { name: selectedPlan?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
