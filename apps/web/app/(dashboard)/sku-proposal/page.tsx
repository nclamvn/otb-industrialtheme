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
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
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
import { Season, Brand, SKU_STATUS_LABELS } from '@/types';

interface SKUProposalWithRelations {
  id: string;
  name: string;
  version: number;
  status: string;
  createdAt: string;
  otbPlan: {
    id: string;
    name: string;
    budget: {
      id: string;
      totalBudget: number;
      season: { id: string; code: string; name: string };
      brand: { id: string; name: string };
      location: { id: string; name: string };
    };
  };
  createdBy: { id: string; name: string };
  summary: {
    itemCount: number;
    totalQuantity: number;
    totalAmount: number;
    validCount: number;
    errorCount: number;
  };
}

export default function SKUProposalPage() {
  const router = useRouter();
  const t = useTranslations('pages.sku');
  const tCommon = useTranslations('common');
  const tFilters = useTranslations('filters');
  const tBudget = useTranslations('budget');
  const [proposals, setProposals] = useState<SKUProposalWithRelations[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] =
    useState<SKUProposalWithRelations | null>(null);
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

      const [proposalsRes, seasonsRes, brandsRes] = await Promise.all([
        fetch(`/api/v1/sku-proposals?${params.toString()}`),
        fetch('/api/v1/seasons'),
        fetch('/api/v1/brands'),
      ]);

      const proposalsData = await proposalsRes.json();
      const seasonsData = await seasonsRes.json();
      const brandsData = await brandsRes.json();

      if (proposalsData.success) setProposals(proposalsData.data);
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
    if (!selectedProposal) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/sku-proposals/${selectedProposal.id}`, {
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

  const handleSubmit = async (proposal: SKUProposalWithRelations) => {
    try {
      const response = await fetch(`/api/v1/sku-proposals/${proposal.id}/submit`, {
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
      SUBMITTED: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
      UNDER_REVIEW: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300',
      APPROVED: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300',
      REJECTED: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
      ORDERED: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {SKU_STATUS_LABELS[status as keyof typeof SKU_STATUS_LABELS] || status}
      </Badge>
    );
  };

  // Calculate totals
  const totals = proposals.reduce(
    (acc, p) => ({
      totalItems: acc.totalItems + p.summary.itemCount,
      totalQuantity: acc.totalQuantity + p.summary.totalQuantity,
      totalAmount: acc.totalAmount + p.summary.totalAmount,
      count: acc.count + 1,
    }),
    { totalItems: 0, totalQuantity: 0, totalAmount: 0, count: 0 }
  );

  const columns: ColumnDef<SKUProposalWithRelations>[] = [
    {
      accessorKey: 'name',
      header: t('columnProposalName'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.otbPlan.budget.season.code} -{' '}
            {row.original.otbPlan.budget.brand.name}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'summary.itemCount',
      header: t('columnSkus'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.summary.itemCount}</span>
          {row.original.summary.errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {row.original.summary.errorCount} {t('errors')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'summary.totalQuantity',
      header: t('columnTotalQty'),
      cell: ({ row }) => row.original.summary.totalQuantity.toLocaleString(),
    },
    {
      accessorKey: 'summary.totalAmount',
      header: t('columnTotalAmount'),
      cell: ({ row }) => (
        <span className="font-medium">
          ${row.original.summary.totalAmount.toLocaleString()}
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
        const proposal = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/sku-proposal/${proposal.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {tCommon('view')}
              </DropdownMenuItem>
              {['DRAFT', 'REJECTED'].includes(proposal.status) && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/sku-proposal/${proposal.id}?edit=true`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {tCommon('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSubmit(proposal)}>
                    <Send className="mr-2 h-4 w-4" />
                    {tCommon('submit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProposal(proposal);
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
        <div className="flex items-center gap-2">
          <Link href="/sku-proposal/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              {t('importExcel') || 'Import Excel'}
            </Button>
          </Link>
          <Link href="/sku-proposal/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('createProposal')}
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Summary Cards - Unified Design */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          'hover:border-border/80 transition-all duration-200',
          'border-l-4 border-l-blue-500'
        )}>
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <FileSpreadsheet className="w-24 h-24 text-blue-500 opacity-[0.08]" />
          </div>
          <div className="p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">{t('totalProposals')}</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">{totals.count}</div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('activeProposals')}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          'hover:border-border/80 transition-all duration-200',
          'border-l-4 border-l-purple-500'
        )}>
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Upload className="w-24 h-24 text-purple-500 opacity-[0.08]" />
          </div>
          <div className="p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">{t('totalSkus')}</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">{totals.totalItems.toLocaleString()}</div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('acrossProposals')}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          'hover:border-border/80 transition-all duration-200',
          'border-l-4 border-l-green-500'
        )}>
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <CheckCircle className="w-24 h-24 text-green-500 opacity-[0.08]" />
          </div>
          <div className="p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">{t('totalQuantity')}</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
                {totals.totalQuantity.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('unitsOrdered')}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'relative overflow-hidden rounded-xl border border-border bg-card',
          'hover:border-border/80 transition-all duration-200',
          'border-l-4 border-l-amber-500'
        )}>
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-amber-500 opacity-[0.08]" />
          </div>
          <div className="p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">{t('totalValue')}</p>
              <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
                ${totals.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{t('retailValue')}</p>
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
        data={proposals}
        searchKey="name"
        searchPlaceholder={t('searchPlaceholder')}
        isLoading={isLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deleteProposal')}
        description={t('deleteConfirm', { name: selectedProposal?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
