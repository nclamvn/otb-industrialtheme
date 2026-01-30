'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Sparkles,
  ListChecks,
  GitCompare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import {
  SizeProfileCard,
  SizeProfileForm,
  SizeDistributionChart,
  SizeProfileComparison,
  SizeOptimizationForm,
} from '@/components/size-profiles';
import { sizeProfilesApi } from '@/lib/api-client';
import type {
  SizeProfile,
  SizeDefinition,
  ProfileComparison,
  SizeProfileType,
  CreateSizeProfileInput,
  UpdateSizeProfileInput,
} from '@/types/size-profile';
import { SIZE_PROFILE_TYPE_LABELS, SIZE_PROFILE_TYPE_COLORS } from '@/types/size-profile';

export default function SizeProfilesPage() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState<SizeProfile[]>([]);
  const [definitions, setDefinitions] = useState<SizeDefinition[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SizeProfile | undefined>();
  const [deleteProfile, setDeleteProfile] = useState<SizeProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>('all');

  // Comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ProfileComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: Record<string, string | boolean | number | undefined> = {};
      if (categoryFilter !== 'all') params.categoryId = categoryFilter;
      if (profileTypeFilter !== 'all') params.profileType = profileTypeFilter;

      const [profilesRes, definitionsRes, categoriesRes, seasonsRes, locationsRes, brandsRes] =
        await Promise.all([
          sizeProfilesApi.getAll(params),
          sizeProfilesApi.getDefinitions(),
          fetch('/api/v1/categories').then((r) => r.json()),
          fetch('/api/v1/seasons').then((r) => r.json()),
          fetch('/api/v1/locations').then((r) => r.json()),
          fetch('/api/v1/brands').then((r) => r.json()),
        ]);

      if (profilesRes.data) setProfiles(profilesRes.data as SizeProfile[]);
      if (definitionsRes.data) setDefinitions(definitionsRes.data as SizeDefinition[]);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (seasonsRes.success) setSeasons(seasonsRes.data);
      if (locationsRes.success) setLocations(locationsRes.data);
      if (brandsRes.success) setBrands(brandsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load size profiles');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, profileTypeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateProfile = async (data: CreateSizeProfileInput | UpdateSizeProfileInput) => {
    setIsSubmitting(true);
    try {
      if (editingProfile) {
        await sizeProfilesApi.update(editingProfile.id, data as UpdateSizeProfileInput);
        toast.success('Profile updated successfully');
      } else {
        await sizeProfilesApi.create(data as CreateSizeProfileInput);
        toast.success('Profile created successfully');
      }
      fetchData();
      setIsFormOpen(false);
      setEditingProfile(undefined);
    } catch (error) {
      toast.error('Failed to save profile');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteProfile) return;
    try {
      await sizeProfilesApi.delete(deleteProfile.id);
      toast.success('Profile deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete profile');
    } finally {
      setDeleteProfile(null);
    }
  };

  const handleDuplicateProfile = async (profile: SizeProfile) => {
    try {
      await sizeProfilesApi.create({
        name: `${profile.name} (Copy)`,
        profileType: 'USER_ADJUSTED' as SizeProfileType,
        categoryId: profile.categoryId,
        seasonId: profile.seasonId,
        locationId: profile.locationId,
        brandId: profile.brandId,
        sizeDistribution: profile.sizeDistribution.map((s) => ({
          sizeId: s.sizeId,
          percentage: s.percentage,
        })),
        notes: profile.notes,
      });
      toast.success('Profile duplicated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to duplicate profile');
    }
  };

  const handleCompare = async () => {
    if (selectedForComparison.length < 2) {
      toast.error('Select at least 2 profiles to compare');
      return;
    }
    setIsComparing(true);
    try {
      const res = await sizeProfilesApi.compare(selectedForComparison);
      if (res.data) {
        setComparison(res.data as ProfileComparison);
        setActiveTab('compare');
      }
    } catch (error) {
      toast.error('Failed to compare profiles');
    } finally {
      setIsComparing(false);
    }
  };

  const handleOptimize = async (params: {
    categoryId: string;
    seasonId?: string;
    locationId?: string;
    historicalProfileId?: string;
    trendProfileId?: string;
    historicalWeight?: number;
    trendWeight?: number;
  }) => {
    const res = await sizeProfilesApi.optimize(params);
    if (res.data) {
      fetchData();
      return res.data as SizeProfile;
    }
    throw new Error('Optimization failed');
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedForComparison((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    );
  };

  const columns: ColumnDef<SizeProfile>[] = [
    {
      accessorKey: 'name',
      header: 'Profile Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedForComparison.includes(row.original.id)}
            onChange={() => toggleProfileSelection(row.original.id)}
            className="rounded border-gray-300"
          />
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.notes && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {row.original.notes}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'profileType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          className={`text-white ${SIZE_PROFILE_TYPE_COLORS[row.original.profileType]}`}
        >
          {SIZE_PROFILE_TYPE_LABELS[row.original.profileType]}
        </Badge>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => row.original.categoryName || 'All',
    },
    {
      accessorKey: 'seasonName',
      header: 'Season',
      cell: ({ row }) => row.original.seasonName || 'All',
    },
    {
      accessorKey: 'sizeDistribution',
      header: 'Distribution',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.sizeDistribution.slice(0, 4).map((s) => (
            <span
              key={s.sizeId}
              className="text-xs bg-muted px-1.5 py-0.5 rounded"
            >
              {s.sizeCode}: {s.percentage.toFixed(0)}%
            </span>
          ))}
          {row.original.sizeDistribution.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{row.original.sizeDistribution.length - 4}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingProfile(row.original);
                setIsFormOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDuplicateProfile(row.original)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteProfile(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Stats
  const activeProfiles = profiles.filter((p) => p.isActive).length;
  const byType = profiles.reduce((acc, p) => {
    acc[p.profileType] = (acc[p.profileType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Size Profiles"
        description="Manage size distribution curves for accurate purchasing decisions"
      >
        <div className="flex gap-2">
          {selectedForComparison.length >= 2 && (
            <Button variant="outline" onClick={handleCompare} disabled={isComparing}>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare ({selectedForComparison.length})
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Profile
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-blue-500 p-4'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Total Profiles</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{profiles.length}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">{activeProfiles} active</p>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-purple-500 p-4'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">System Optimal</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{byType['SYSTEM_OPTIMAL'] || 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">AI-generated</p>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-green-500 p-4'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Final Approved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{byType['FINAL'] || 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">Ready for use</p>
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-amber-500 p-4'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">Size Definitions</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">{definitions.length}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">
            {definitions.filter((d) => d.isActive).length} active
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profiles">
            <ListChecks className="mr-2 h-4 w-4" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="optimize">
            <Sparkles className="mr-2 h-4 w-4" />
            Optimize
          </TabsTrigger>
          <TabsTrigger value="compare" disabled={!comparison}>
            <GitCompare className="mr-2 h-4 w-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Profile Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(SIZE_PROFILE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={profiles}
            searchKey="name"
            searchPlaceholder="Search profiles..."
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="optimize">
          <SizeOptimizationForm
            categories={categories}
            seasons={seasons}
            locations={locations}
            historicalProfiles={profiles.filter((p) => p.profileType === 'HISTORICAL')}
            trendProfiles={profiles.filter((p) => p.profileType === 'CURRENT_TREND')}
            onOptimize={handleOptimize}
            isLoading={isSubmitting}
          />
        </TabsContent>

        <TabsContent value="compare">
          {comparison && <SizeProfileComparison comparison={comparison} viewMode="chart" />}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Form Dialog */}
      <SizeProfileForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProfile(undefined);
        }}
        profile={editingProfile}
        sizeDefinitions={definitions}
        categories={categories}
        seasons={seasons}
        locations={locations}
        brands={brands}
        onSubmit={handleCreateProfile}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Size Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProfile?.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
