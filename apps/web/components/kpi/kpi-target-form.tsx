'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Target, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { KPIDisplay } from '@/types/kpi';

const targetSchema = z.object({
  value: z.number().positive('Target must be positive'),
  type: z.enum(['MINIMUM', 'MAXIMUM', 'EXACT', 'RANGE']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEASONAL', 'ANNUAL']),
  warningThreshold: z.number().min(0).max(100),
  criticalThreshold: z.number().min(0).max(100),
});

type TargetFormData = z.infer<typeof targetSchema>;

interface KPITargetFormProps {
  kpi: KPIDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TargetFormData) => void;
}

export function KPITargetForm({
  kpi,
  open,
  onOpenChange,
  onSave,
}: KPITargetFormProps) {
  const form = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      value: kpi.target?.value || kpi.value * 1.1,
      type: (kpi.target?.type as TargetFormData['type']) || 'MINIMUM',
      period: 'MONTHLY',
      warningThreshold: 85,
      criticalThreshold: 70,
    },
  });

  const _targetType = form.watch('type');
  const warningThreshold = form.watch('warningThreshold');
  const criticalThreshold = form.watch('criticalThreshold');

  const handleSubmit = (data: TargetFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Target for {kpi.name}
          </DialogTitle>
          <DialogDescription>
            Define the target value and thresholds for tracking this KPI.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Value</span>
                <span className="text-lg font-semibold">{kpi.formattedValue}</span>
              </div>
              {kpi.previousValue !== undefined && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Previous Period</span>
                  <span className="text-sm">{kpi.previousValue.toLocaleString()}</span>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value</FormLabel>
                  <FormControl>
                    <NumberInput
                      value={field.value}
                      onChange={(val) => field.onChange(val || 0)}
                      allowDecimals={true}
                      decimalPlaces={2}
                      placeholder="Enter target value"
                    />
                  </FormControl>
                  <FormDescription>
                    Suggested: {(kpi.value * 1.1).toLocaleString()} (10% improvement)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Target Type
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            <strong>Minimum:</strong> Value should be above target
                            <br />
                            <strong>Maximum:</strong> Value should be below target
                            <br />
                            <strong>Exact:</strong> Value should match target
                            <br />
                            <strong>Range:</strong> Value should be within range
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MINIMUM">
                        Minimum (≥ target)
                      </SelectItem>
                      <SelectItem value="MAXIMUM">
                        Maximum (≤ target)
                      </SelectItem>
                      <SelectItem value="EXACT">
                        Exact (= target ± tolerance)
                      </SelectItem>
                      <SelectItem value="RANGE">
                        Range (within bounds)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Period</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="SEASONAL">Seasonal</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Status Thresholds</FormLabel>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="warningThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel className="text-yellow-600 text-sm font-normal">
                          Warning Threshold
                        </FormLabel>
                        <span className="text-sm text-muted-foreground">
                          {field.value}% of target
                        </span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={0}
                          max={100}
                          step={5}
                          className="[&_[role=slider]]:bg-yellow-500"
                        />
                      </FormControl>
                      <FormDescription>
                        Status becomes &quot;At Risk&quot; below this threshold
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criticalThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel className="text-red-600 text-sm font-normal">
                          Critical Threshold
                        </FormLabel>
                        <span className="text-sm text-muted-foreground">
                          {field.value}% of target
                        </span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={0}
                          max={warningThreshold}
                          step={5}
                          className="[&_[role=slider]]:bg-red-500"
                        />
                      </FormControl>
                      <FormDescription>
                        Status becomes &quot;Off Track&quot; below this threshold
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* Visual preview */}
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium mb-3">Status Preview</div>
                <div className="h-4 rounded-full overflow-hidden flex">
                  <div
                    className="bg-red-500"
                    style={{ width: `${criticalThreshold}%` }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${warningThreshold - criticalThreshold}%` }}
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${100 - warningThreshold}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>{criticalThreshold}%</span>
                  <span>{warningThreshold}%</span>
                  <span>100%</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-red-500">Off Track</span>
                  <span className="text-yellow-500">At Risk</span>
                  <span className="text-green-500">On Track</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Target</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
