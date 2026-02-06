'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Plus, Minus } from 'lucide-react';
import type {
  SizeProfile,
  SizeDefinition,
  SizeProfileType,
  CreateSizeProfileInput,
  UpdateSizeProfileInput,
} from '@/types/size-profile';
import { SIZE_PROFILE_TYPE_LABELS } from '@/types/size-profile';

interface SizeProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: SizeProfile;
  sizeDefinitions: SizeDefinition[];
  categories?: { id: string; name: string }[];
  seasons?: { id: string; name: string }[];
  locations?: { id: string; name: string }[];
  brands?: { id: string; name: string }[];
  onSubmit: (data: CreateSizeProfileInput | UpdateSizeProfileInput) => Promise<void>;
  isLoading?: boolean;
}

interface SizeEntry {
  sizeId: string;
  sizeName: string;
  sizeCode: string;
  percentage: number;
}

export function SizeProfileForm({
  open,
  onOpenChange,
  profile,
  sizeDefinitions,
  categories = [],
  seasons = [],
  locations = [],
  brands = [],
  onSubmit,
  isLoading = false,
}: SizeProfileFormProps) {
  const isEdit = !!profile;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<{
    name: string;
    profileType: SizeProfileType;
    categoryId?: string;
    seasonId?: string;
    locationId?: string;
    brandId?: string;
    notes?: string;
  }>();

  const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        profileType: profile.profileType,
        categoryId: profile.categoryId,
        seasonId: profile.seasonId,
        locationId: profile.locationId,
        brandId: profile.brandId,
        notes: profile.notes,
      });
      setSizeEntries(
        profile.sizeDistribution.map((s) => ({
          sizeId: s.sizeId,
          sizeName: s.sizeName,
          sizeCode: s.sizeCode,
          percentage: s.percentage,
        }))
      );
    } else {
      reset({
        name: '',
        profileType: 'USER_ADJUSTED' as SizeProfileType,
        categoryId: undefined,
        seasonId: undefined,
        locationId: undefined,
        brandId: undefined,
        notes: '',
      });
      // Initialize with all active sizes at equal distribution
      const activeSizes = sizeDefinitions.filter((s) => s.isActive);
      const equalPct = activeSizes.length > 0 ? 100 / activeSizes.length : 0;
      setSizeEntries(
        activeSizes.map((s) => ({
          sizeId: s.id,
          sizeName: s.name,
          sizeCode: s.code,
          percentage: parseFloat(equalPct.toFixed(1)),
        }))
      );
    }
  }, [profile, sizeDefinitions, reset]);

  const totalPercentage = sizeEntries.reduce((sum, s) => sum + s.percentage, 0);
  const isValidTotal = Math.abs(totalPercentage - 100) < 0.1;

  const handleSizePercentageChange = (sizeId: string, value: number) => {
    setSizeEntries((prev) =>
      prev.map((s) =>
        s.sizeId === sizeId ? { ...s, percentage: Math.max(0, Math.min(100, value)) } : s
      )
    );
  };

  const normalizePercentages = () => {
    if (totalPercentage === 0) return;
    const factor = 100 / totalPercentage;
    setSizeEntries((prev) =>
      prev.map((s) => ({ ...s, percentage: parseFloat((s.percentage * factor).toFixed(1)) }))
    );
  };

  const onFormSubmit = async (data: {
    name: string;
    profileType: SizeProfileType;
    categoryId?: string;
    seasonId?: string;
    locationId?: string;
    brandId?: string;
    notes?: string;
  }) => {
    setError(null);

    if (!isValidTotal) {
      setError(`Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(1)}%`);
      return;
    }

    try {
      await onSubmit({
        ...data,
        sizeDistribution: sizeEntries.map((s) => ({
          sizeId: s.sizeId,
          percentage: s.percentage,
        })),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const profileTypeOptions = Object.entries(SIZE_PROFILE_TYPE_LABELS).filter(
    ([key]) => key !== 'SYSTEM_OPTIMAL' // System optimal is auto-generated
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Size Profile' : 'Create Size Profile'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the size distribution percentages for this profile.'
              : 'Define the size distribution percentages. Total must equal 100%.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="e.g., SS24 T-Shirts"
              />
              {errors.name && (
                <span className="text-xs text-destructive">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileType">Profile Type *</Label>
              <Select
                value={watch('profileType')}
                onValueChange={(v) => setValue('profileType', v as SizeProfileType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {profileTypeOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Context Selection */}
          <div className="grid grid-cols-2 gap-4">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={watch('categoryId') || ''}
                  onValueChange={(v) => setValue('categoryId', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {seasons.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="seasonId">Season</Label>
                <Select
                  value={watch('seasonId') || ''}
                  onValueChange={(v) => setValue('seasonId', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All seasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All seasons</SelectItem>
                    {seasons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {locations.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="locationId">Location</Label>
                <Select
                  value={watch('locationId') || ''}
                  onValueChange={(v) => setValue('locationId', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {brands.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="brandId">Brand</Label>
                <Select
                  value={watch('brandId') || ''}
                  onValueChange={(v) => setValue('brandId', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All brands</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Size Distribution */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Size Distribution</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isValidTotal ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  Total: {totalPercentage.toFixed(1)}%
                </span>
                {!isValidTotal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={normalizePercentages}
                  >
                    Normalize to 100%
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sizeEntries.map((entry) => (
                <div key={entry.sizeId} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium">{entry.sizeCode}</span>
                  <Slider
                    value={[entry.percentage]}
                    onValueChange={([value]) => handleSizePercentageChange(entry.sizeId, value)}
                    max={100}
                    step={0.5}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        handleSizePercentageChange(entry.sizeId, entry.percentage - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={entry.percentage}
                      onChange={(e) =>
                        handleSizePercentageChange(entry.sizeId, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 h-7 text-sm text-center"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        handleSizePercentageChange(entry.sizeId, entry.percentage + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optional notes about this profile..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isValidTotal}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Update Profile' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
