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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Mail, MessageSquare } from 'lucide-react';
import type { KPIDisplay, KPIAlert } from '@/types/kpi';

const alertSchema = z.object({
  type: z.enum(['THRESHOLD_BREACH', 'TREND_CHANGE', 'TARGET_AT_RISK', 'TARGET_ACHIEVED']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  threshold: z.number().optional(),
  isEnabled: z.boolean(),
  channels: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
    slack: z.boolean(),
  }),
});

type AlertFormData = z.infer<typeof alertSchema>;

interface KPIAlertConfigProps {
  kpi: KPIDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AlertFormData) => void;
  existingAlerts?: KPIAlert[];
}

export function KPIAlertConfig({
  kpi,
  open,
  onOpenChange,
  onSave,
  existingAlerts: _existingAlerts = [],
}: KPIAlertConfigProps) {
  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      type: 'THRESHOLD_BREACH',
      severity: 'WARNING',
      threshold: kpi.target?.value ? kpi.target.value * 0.9 : undefined,
      isEnabled: true,
      channels: {
        email: true,
        inApp: true,
        slack: false,
      },
    },
  });

  const alertType = form.watch('type');

  const handleSubmit = (data: AlertFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Configure Alert for {kpi.name}
          </DialogTitle>
          <DialogDescription>
            Set up notifications when this KPI reaches specific thresholds or conditions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alert type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="THRESHOLD_BREACH">
                        Threshold Breach
                      </SelectItem>
                      <SelectItem value="TREND_CHANGE">
                        Trend Change Detection
                      </SelectItem>
                      <SelectItem value="TARGET_AT_RISK">
                        Target at Risk
                      </SelectItem>
                      <SelectItem value="TARGET_ACHIEVED">
                        Target Achieved
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {alertType === 'THRESHOLD_BREACH' &&
                      'Trigger when value crosses a specific threshold'}
                    {alertType === 'TREND_CHANGE' &&
                      'Trigger when the trend direction changes significantly'}
                    {alertType === 'TARGET_AT_RISK' &&
                      'Trigger when on track to miss the target'}
                    {alertType === 'TARGET_ACHIEVED' &&
                      'Trigger when the target is achieved'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INFO">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Info</Badge>
                          <span>Low priority notification</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="WARNING">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500">Warning</Badge>
                          <span>Requires attention</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CRITICAL">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Critical</Badge>
                          <span>Immediate action needed</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {alertType === 'THRESHOLD_BREACH' && (
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threshold Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter threshold value"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Current value: {kpi.formattedValue}
                      {kpi.target && ` | Target: ${kpi.target.formattedValue}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4">
              <FormLabel>Notification Channels</FormLabel>
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="channels.inApp"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="font-normal">In-App Notification</FormLabel>
                          <FormDescription className="text-xs">
                            Show in notification center
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channels.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="font-normal">Email</FormLabel>
                          <FormDescription className="text-xs">
                            Send email notification
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channels.slack"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <FormLabel className="font-normal">Slack</FormLabel>
                          <FormDescription className="text-xs">
                            Post to Slack channel
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                  <div>
                    <FormLabel className="font-normal">Enable Alert</FormLabel>
                    <FormDescription className="text-xs">
                      Turn this alert on or off
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Alert</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
