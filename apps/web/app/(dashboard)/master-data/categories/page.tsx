'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
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
import { CategoryForm } from '@/components/forms/category-form';
import { Category } from '@/types';
import { CategoryFormData } from '@/lib/validations/category';

export default function CategoriesPage() {
  const t = useTranslations('pages.masterData');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error(t('loadError', { item: t('categoriesTitle').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedCategory
        ? `/api/v1/categories/${selectedCategory.id}`
        : '/api/v1/categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          selectedCategory
            ? t('updateSuccess', { item: t('categoriesTitle') })
            : t('createSuccess', { item: t('categoriesTitle') })
        );
        setIsFormOpen(false);
        fetchCategories();
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
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('deleteSuccess', { item: t('categoriesTitle') }));
        setIsDeleteOpen(false);
        fetchCategories();
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

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: tForms('name'),
      cell: ({ row }) => {
        const hasSubcategories = row.original.subcategories && row.original.subcategories.length > 0;
        const isExpanded = expandedRows.has(row.original.id);

        return (
          <div className="flex items-center gap-2">
            {hasSubcategories && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleRow(row.original.id)}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </Button>
            )}
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-accent">
                {row.original.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-sm text-muted-foreground">{row.original.code}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'subcategories',
      header: tForms('subcategories'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original._count?.subcategories || row.original.subcategories?.length || 0}
        </span>
      ),
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
        title={t('categoriesTitle')}
        description={t('categoriesDescription')}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addCategory')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder={`${tCommon('search')}...`}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? t('editCategory') : t('addCategory')}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? t('categoriesDescription')
                : t('categoriesDescription')}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            initialData={
              selectedCategory
                ? {
                    id: selectedCategory.id,
                    name: selectedCategory.name,
                    code: selectedCategory.code,
                    description: selectedCategory.description,
                    isActive: selectedCategory.isActive,
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
        title={t('deleteCategory')}
        description={t('deleteCategoryConfirm', { name: selectedCategory?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
