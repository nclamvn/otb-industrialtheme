'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { BrandForm } from '@/components/forms/brand-form';
import { Brand } from '@/types';
import { BrandFormData } from '@/lib/validations/brand';

export default function BrandsPage() {
  const t = useTranslations('pages.masterData');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/brands?limit=100');
      const result = await response.json();
      if (result.success) {
        setBrands(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      toast.error(t('loadError', { item: t('brandsTitle').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleCreate = () => {
    setSelectedBrand(null);
    setIsFormOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsFormOpen(true);
  };

  const handleDelete = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedBrand
        ? `/api/v1/brands/${selectedBrand.id}`
        : '/api/v1/brands';
      const method = selectedBrand ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          selectedBrand
            ? t('updateSuccess', { item: t('brandsTitle') })
            : t('createSuccess', { item: t('brandsTitle') })
        );
        setIsFormOpen(false);
        fetchBrands();
      } else {
        toast.error(result.error || tCommon('error'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/brands/${selectedBrand.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('deleteSuccess', { item: t('brandsTitle') }));
        setIsDeleteOpen(false);
        fetchBrands();
      } else {
        toast.error(result.error || tCommon('error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: 'name',
      header: tForms('name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {row.original.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.code}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'division.name',
      header: tForms('division'),
      cell: ({ row }) => row.original.division?.name || '-',
    },
    {
      accessorKey: 'isActive',
      header: tForms('status'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? tForms('active') : tForms('inactive')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{tCommon('actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" />
              {tCommon('edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('brandsTitle')}
        description={t('brandsDescription')}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addBrand')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={brands}
        searchKey="name"
        searchPlaceholder={`${tCommon('search')}...`}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedBrand ? t('editBrand') : t('addBrand')}
            </DialogTitle>
            <DialogDescription>
              {selectedBrand
                ? t('brandsDescription')
                : t('brandsDescription')}
            </DialogDescription>
          </DialogHeader>
          <BrandForm
            initialData={
              selectedBrand
                ? {
                    id: selectedBrand.id,
                    name: selectedBrand.name,
                    code: selectedBrand.code,
                    divisionId: selectedBrand.divisionId,
                    description: selectedBrand.description,
                    logoUrl: selectedBrand.logoUrl,
                    isActive: selectedBrand.isActive,
                  }
                : undefined
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t('deleteBrand')}
        description={t('deleteConfirm', { name: selectedBrand?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
