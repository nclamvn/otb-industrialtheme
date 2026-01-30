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
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Send,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Supplier, PlanningRequestItem, DEMO_SUPPLIERS } from './types';
import { SupplierSelector } from './SupplierSelector';
import { PlanningRequestPreview } from './PlanningRequestPreview';
import { useSupplierRequest } from './hooks/useSupplierRequest';

type DialogStep = 'select-supplier' | 'review' | 'sending' | 'result';

interface PlanningRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketNumber: string;
  items: PlanningRequestItem[];
  suppliers?: Supplier[];
  onSuccess?: (requestId: string, requestNumber: string) => void;
}

export function PlanningRequestDialog({
  open,
  onOpenChange,
  ticketId,
  ticketNumber,
  items,
  suppliers = DEMO_SUPPLIERS,
  onSuccess,
}: PlanningRequestDialogProps) {
  const t = useTranslations('supplier');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState<DialogStep>('select-supplier');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [attachCSV, setAttachCSV] = useState(true);
  const [attachPDF, setAttachPDF] = useState(false);

  const {
    currentRequest,
    sendStep,
    progress,
    error,
    sendRequest,
    resetState,
  } = useSupplierRequest(suppliers);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.units, 0),
    [items]
  );

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.totalValue, 0),
    [items]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleNext = () => {
    if (step === 'select-supplier' && selectedSupplier) {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('select-supplier');
    }
  };

  const handleSend = async () => {
    if (!selectedSupplier) return;

    setStep('sending');

    const result = await sendRequest({
      ticketId,
      supplierId: selectedSupplier.id,
      items,
      deliveryDate,
      notes: notes || undefined,
      attachCSV,
      attachPDF,
    });

    setStep('result');

    if (result.success && result.requestId && result.requestNumber) {
      onSuccess?.(result.requestId, result.requestNumber);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setStep('select-supplier');
      setSelectedSupplier(null);
      setDeliveryDate(undefined);
      setNotes('');
      setAttachCSV(true);
      setAttachPDF(false);
      resetState();
    }, 200);
  };

  const handleTryAgain = () => {
    resetState();
    setStep('review');
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select-supplier':
        return (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-neutral-400 mb-4">
              Select a supplier to send the planning request for{' '}
              <span className="font-medium text-slate-700 dark:text-neutral-200">
                {ticketNumber}
              </span>{' '}
              ({items.length} items, {formatCurrency(totalValue)})
            </div>
            <SupplierSelector
              suppliers={suppliers}
              selectedId={selectedSupplier?.id}
              onSelect={handleSupplierSelect}
            />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {selectedSupplier && (
              <PlanningRequestPreview
                supplier={selectedSupplier}
                items={items}
                deliveryDate={deliveryDate}
                notes={notes}
              />
            )}

            {/* Additional Options */}
            <div className="space-y-4 pt-4 border-t dark:border-neutral-700">
              <div className="space-y-2">
                <Label>Requested Delivery Date</Label>
                <Input
                  type="date"
                  value={deliveryDate ? deliveryDate.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setDeliveryDate(
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Notes to Supplier</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="flex gap-4">
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      attachCSV
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-neutral-700'
                    )}
                    onClick={() => setAttachCSV(!attachCSV)}
                  >
                    <Checkbox checked={attachCSV} />
                    <FileSpreadsheet
                      className={cn(
                        'h-5 w-5',
                        attachCSV
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      )}
                    />
                    <span className="text-sm font-medium">CSV Export</span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      attachPDF
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                        : 'border-slate-200 dark:border-neutral-700'
                    )}
                    onClick={() => setAttachPDF(!attachPDF)}
                  >
                    <Checkbox checked={attachPDF} />
                    <FileText
                      className={cn(
                        'h-5 w-5',
                        attachPDF
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-400'
                      )}
                    />
                    <span className="text-sm font-medium">PDF Report</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="py-12 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {sendStep === 'preparing'
                  ? 'Preparing request...'
                  : 'Sending to supplier...'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                {selectedSupplier?.method === 'email'
                  ? `Sending email to ${selectedSupplier.email}`
                  : selectedSupplier?.method === 'api'
                  ? `Connecting to ${selectedSupplier.name} API`
                  : 'Generating files for download'}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        );

      case 'result':
        const isSuccess = sendStep === 'success';
        return (
          <div className="py-12">
            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                {isSuccess ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                )}
              </div>

              <h3
                className={cn(
                  'text-lg font-semibold mb-2',
                  isSuccess
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400'
                )}
              >
                {isSuccess ? 'Request Sent Successfully!' : 'Failed to Send Request'}
              </h3>

              {isSuccess && currentRequest ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-neutral-400">
                    Request #{currentRequest.requestNumber} has been{' '}
                    {selectedSupplier?.method === 'manual'
                      ? 'prepared for download'
                      : 'sent to'}{' '}
                    <span className="font-medium">{selectedSupplier?.name}</span>
                  </p>
                  {selectedSupplier?.method === 'email' && (
                    <p className="text-xs text-slate-400 dark:text-neutral-500">
                      Email sent to {selectedSupplier.email}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 dark:text-neutral-400">
                    {error || 'An unexpected error occurred'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 'select-supplier':
        return (
          <>
            <Button variant="outline" onClick={handleClose}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleNext} disabled={!selectedSupplier}>
              {tCommon('next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        );

      case 'review':
        return (
          <>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon('back')}
            </Button>
            <Button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {t('actions.send')}
            </Button>
          </>
        );

      case 'sending':
        return null;

      case 'result':
        return sendStep === 'success' ? (
          <Button onClick={handleClose} className="bg-emerald-600 hover:bg-emerald-700">
            {tCommon('done')}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleTryAgain}>Try Again</Button>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>{t('sendRequest')}</DialogTitle>
              <DialogDescription>
                {step === 'select-supplier' && 'Choose a supplier for this planning request'}
                {step === 'review' && 'Review the request details before sending'}
                {step === 'sending' && 'Processing your request...'}
                {step === 'result' && (sendStep === 'success' ? 'Your request has been processed' : 'There was an issue with your request')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">{renderStepContent()}</div>

        {renderFooter() && <DialogFooter>{renderFooter()}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export default PlanningRequestDialog;
