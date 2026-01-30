'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Ticket, Paperclip, DollarSign } from 'lucide-react';
import {
  TicketType,
  TicketPriority,
  CreateTicketInput,
  TICKET_TYPE_CONFIG,
  TICKET_PRIORITY_CONFIG,
} from './types';

interface AvailableItem {
  id: string;
  type: 'otb_plan' | 'sku_proposal' | 'sizing';
  name: string;
  version: string;
  budget: number;
}

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTicketInput) => void;
  availableItems: AvailableItem[];
  defaultSeason?: string;
  defaultBrand?: string;
  isLoading?: boolean;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  onSubmit,
  availableItems,
  defaultSeason = 'SS26',
  defaultBrand = 'REX',
  isLoading = false,
}: CreateTicketDialogProps) {
  const t = useTranslations('ticket');
  const tCommon = useTranslations('common');

  const [type, setType] = useState<TicketType>('otb_plan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      if (type === 'otb_plan') return item.type === 'otb_plan';
      if (type === 'sku_proposal') return item.type === 'sku_proposal';
      if (type === 'sizing_change') return item.type === 'sizing';
      return true;
    });
  }, [availableItems, type]);

  const selectedTotal = useMemo(() => {
    return filteredItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.budget, 0);
  }, [filteredItems, selectedItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || selectedItems.length === 0) return;

    const items = filteredItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({
        type: item.type,
        entityId: item.id,
        name: item.name,
        version: item.version,
        budget: item.budget,
      }));

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      season: defaultSeason,
      brand: defaultBrand,
      items,
      deadline,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPriority('normal');
    setDeadline(undefined);
    setSelectedItems([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form on close
    setTitle('');
    setDescription('');
    setPriority('normal');
    setDeadline(undefined);
    setSelectedItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>{t('create')}</DialogTitle>
              <DialogDescription>
                Bundle your plans into a ticket for approval
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ticket Type */}
          <div className="space-y-2">
            <Label>{t('fields.type')} *</Label>
            <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TICKET_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {t(`type.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>{t('fields.title')} *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${defaultSeason} ${defaultBrand} ${TICKET_TYPE_CONFIG[type].label}`}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('fields.description')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="min-h-[80px]"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>{t('fields.priority')} *</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(TICKET_PRIORITY_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  type="button"
                  variant={priority === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(key as TicketPriority)}
                  className={cn(
                    priority === key && config.bgColor,
                    priority === key && config.color
                  )}
                >
                  {config.dot} {t(`priority.${key}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>{t('fields.deadline')}</Label>
            <Input
              type="date"
              value={deadline ? deadline.toISOString().split('T')[0] : ''}
              onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full"
            />
          </div>

          <Separator />

          {/* Items Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <Label>{t('actions.selectItems')}</Label>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400 py-4 text-center">
                No items available for this type
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedItems.includes(item.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800'
                    )}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {item.name} {item.version}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                      {formatCurrency(item.budget)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Selection Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-neutral-700">
              <span className="text-sm text-slate-500 dark:text-neutral-400">
                {t('actions.selectedCount', { count: selectedItems.length })}
              </span>
              <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                <DollarSign className="h-4 w-4" />
                <span>{t('actions.totalBudget', { amount: formatCurrency(selectedTotal) })}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || selectedItems.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Ticket className="h-4 w-4 mr-2" />
            {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTicketDialog;
