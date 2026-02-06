'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { budgetFormSchema, BudgetFormData } from '@/lib/validations/budget';
import { Season, Brand, SalesLocation } from '@/types';

interface BudgetFormProps {
  initialData?: Partial<BudgetFormData> & { id?: string };
  seasons: Season[];
  brands: Brand[];
  locations: SalesLocation[];
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  comparison?: {
    id: string;
    totalBudget: number;
    season: { code: string; name: string };
  } | null;
}

export function BudgetForm({
  initialData,
  seasons,
  brands,
  locations,
  onSubmit,
  onCancel,
  isLoading = false,
  comparison,
}: BudgetFormProps) {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      seasonId: initialData?.seasonId || '',
      brandId: initialData?.brandId || '',
      locationId: initialData?.locationId || '',
      totalBudget: initialData?.totalBudget || 0,
      seasonalBudget: initialData?.seasonalBudget || undefined,
      replenishmentBudget: initialData?.replenishmentBudget || undefined,
      currency: initialData?.currency || 'USD',
      comments: initialData?.comments || '',
    },
  });

  const watchTotalBudget = form.watch('totalBudget');
  const watchSeasonalBudget = form.watch('seasonalBudget');
  const watchReplenishmentBudget = form.watch('replenishmentBudget');

  // Calculate variance from previous season
  const variance = comparison
    ? ((watchTotalBudget - Number(comparison.totalBudget)) /
        Number(comparison.totalBudget)) *
      100
    : null;

  // Validate seasonal + replenishment = total
  const budgetSum = (watchSeasonalBudget || 0) + (watchReplenishmentBudget || 0);
  const hasBudgetMismatch =
    watchSeasonalBudget !== undefined &&
    watchReplenishmentBudget !== undefined &&
    Math.abs(budgetSum - watchTotalBudget) > 0.01;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="seasonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season *</FormLabel>
                    <Select
                      disabled={!!initialData?.id || isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            {season.code} - {season.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand *</FormLabel>
                    <Select
                      disabled={!!initialData?.id || isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <Select
                      disabled={!!initialData?.id || isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Budget *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val || 0)}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="VND">VND</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seasonalBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seasonal Budget</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Budget for seasonal collection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replenishmentBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replenishment Budget</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="0.00"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Budget for stock replenishment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {hasBudgetMismatch && (
              <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                Note: Seasonal (${watchSeasonalBudget?.toLocaleString()}) +
                Replenishment (${watchReplenishmentBudget?.toLocaleString()}) =
                ${budgetSum.toLocaleString()} does not equal Total Budget ($
                {watchTotalBudget.toLocaleString()})
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison with Previous Season */}
        {comparison && (
          <Card>
            <CardHeader>
              <CardTitle>Comparison with Previous Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {comparison.season.code} Budget
                  </p>
                  <p className="text-lg font-semibold">
                    ${Number(comparison.totalBudget).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div>
                  <p className="text-sm text-muted-foreground">New Budget</p>
                  <p className="text-lg font-semibold">
                    ${watchTotalBudget.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p
                    className={`text-lg font-semibold ${
                      variance && variance > 0
                        ? 'text-green-600'
                        : variance && variance < 0
                          ? 'text-red-600'
                          : ''
                    }`}
                  >
                    {variance !== null
                      ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comments & Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any comments or assumptions about this budget..."
                      className="min-h-[100px]"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData?.id ? 'Update Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
