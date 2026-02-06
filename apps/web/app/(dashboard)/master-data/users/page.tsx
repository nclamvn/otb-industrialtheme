'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { UserForm } from '@/components/forms/user-form';
import { User, ROLE_LABELS, STATUS_LABELS } from '@/types';
import { UserFormData } from '@/lib/validations/user';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function UsersPage() {
  const t = useTranslations('pages.masterData');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(t('loadError', { item: t('usersTitle').toLowerCase() }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const url = selectedUser
        ? `/api/v1/users/${selectedUser.id}`
        : '/api/v1/users';
      const method = selectedUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          selectedUser
            ? t('updateSuccess', { item: t('usersTitle') })
            : t('createSuccess', { item: t('usersTitle') })
        );
        setIsFormOpen(false);
        fetchUsers();
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
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('deleteSuccess', { item: t('usersTitle') }));
        setIsDeleteOpen(false);
        fetchUsers();
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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: tForms('user'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: tForms('role'),
      cell: ({ row }) => (
        <Badge variant="outline">
          {ROLE_LABELS[row.original.role] || row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedBrands',
      header: tForms('brands'),
      cell: ({ row }) => {
        const brands = row.original.assignedBrands || [];
        if (brands.length === 0) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {brands.slice(0, 2).map((brand) => (
              <Badge key={brand.id} variant="secondary" className="text-xs">
                {brand.name}
              </Badge>
            ))}
            {brands.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{brands.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: tForms('status'),
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]} variant="secondary">
          {STATUS_LABELS[row.original.status] || row.original.status}
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
        title={t('usersTitle')}
        description={t('usersDescription')}
      >
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addUser')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder={`${tCommon('search')}...`}
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? t('editUser') : t('addUser')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? t('usersDescription')
                : t('usersDescription')}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            initialData={
              selectedUser
                ? {
                    id: selectedUser.id,
                    email: selectedUser.email,
                    name: selectedUser.name,
                    role: selectedUser.role,
                    status: selectedUser.status,
                    assignedBrandIds: selectedUser.assignedBrands?.map((b) => b.id) || [],
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
        title={t('deleteUser')}
        description={t('deleteConfirm', { name: selectedUser?.name || '' })}
        confirmText={tCommon('delete')}
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
