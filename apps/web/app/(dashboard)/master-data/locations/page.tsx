'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2, MapPin, Store, Globe } from 'lucide-react';
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
import { LocationForm } from '@/components/forms/location-form';
import { SalesLocation } from '@/types';
import { LocationFormData } from '@/lib/validations/location';

const typeIcons: Record<string, React.ElementType> = {
  STORE: Store,
  OUTLET: MapPin,
  ONLINE: Globe,
};

const typeColors: Record<string, string> = {
  STORE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OUTLET: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  ONLINE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function LocationsPage() {
  const t = useTranslations('pages.masterData');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const [locations, setLocations] = useState<SalesLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SalesLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/locations');
      const result = await response.json();
      if (result.success) {
        setLocations(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error(t('loadError', { item: t('locationsTitle').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreate = () => {
    setSelectedLocation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (location: SalesLocation) => {
    setSelectedLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = (location: SalesLocation) => {
    setSelectedLocation(location);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedLocation
        ? `/api/v1/locations/${selectedLocation.id}`
        : '/api/v1/locations';
      const method = selectedLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          selectedLocation
            ? t('updateSuccess', { item: t('locationsTitle') })
            : t('createSuccess', { item: t('locationsTitle') })
        );
        setIsFormOpen(false);
        fetchLocations();
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
    if (!selectedLocation) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/locations/${selectedLocation.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('deleteSuccess', { item: t('locationsTitle') }));
        setIsDeleteOpen(false);
        fetchLocations();
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

  const columns: ColumnDef<SalesLocation>[] = [
    {
      accessorKey: 'name',
      header: tForms('name'),
      cell: ({ row }) => {
        const Icon = typeIcons[row.original.type] || MapPin;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
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
      accessorKey: 'type',
      header: tForms('type'),
      cell: ({ row }) => (
        <Badge className={typeColors[row.original.type]} variant="secondary">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'address',
      header: tForms('address'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.address || '-'}
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
        title={t('locationsTitle')}
        description={t('locationsDescription')}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addLocation')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={locations}
        searchKey="name"
        searchPlaceholder={`${tCommon('search')}...`}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedLocation ? t('editLocation') : t('addLocation')}
            </DialogTitle>
            <DialogDescription>
              {selectedLocation
                ? t('locationsDescription')
                : t('locationsDescription')}
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            initialData={
              selectedLocation
                ? {
                    id: selectedLocation.id,
                    name: selectedLocation.name,
                    code: selectedLocation.code,
                    type: selectedLocation.type as 'STORE' | 'OUTLET' | 'ONLINE',
                    address: selectedLocation.address,
                    isActive: selectedLocation.isActive,
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
        title={t('deleteLocation')}
        description={t('deleteConfirm', { name: selectedLocation?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
