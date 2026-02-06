'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  SRDDocument,
  PortfoUploadStatus,
  PortfoUploadStep,
  PORTFO_UPLOAD_STEPS,
  PORTFO_STEP_CONFIG,
} from './types';

interface PortfoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: SRDDocument | null;
  onUpload: (options: { notifyStakeholders: boolean; createBackup: boolean }) => Promise<void>;
  uploadStatus?: PortfoUploadStatus | null;
  onSuccess?: () => void;
}

type ViewState = 'preview' | 'uploading' | 'success' | 'error';

export function PortfoUploadDialog({
  open,
  onOpenChange,
  document,
  onUpload,
  uploadStatus,
  onSuccess,
}: PortfoUploadDialogProps) {
  const t = useTranslations('portfo');
  const tCommon = useTranslations('common');

  const [notifyStakeholders, setNotifyStakeholders] = useState(true);
  const [createBackup, setCreateBackup] = useState(true);

  const viewState: ViewState = uploadStatus
    ? uploadStatus.status === 'success'
      ? 'success'
      : uploadStatus.status === 'failed'
      ? 'error'
      : 'uploading'
    : 'preview';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
    }).format(date);
  };

  const handleUpload = async () => {
    await onUpload({ notifyStakeholders, createBackup });
  };

  const getStepStatus = (step: PortfoUploadStep): 'done' | 'current' | 'pending' => {
    if (!uploadStatus) return 'pending';
    const currentIndex = PORTFO_UPLOAD_STEPS.indexOf(uploadStatus.currentStep);
    const stepIndex = PORTFO_UPLOAD_STEPS.indexOf(step);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {viewState === 'preview' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle>{t('upload')}</DialogTitle>
                  <DialogDescription>
                    Upload approved OTB plan to Portfo system
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Document Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {t('document.type')}
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <span className="text-sm text-slate-500">{t('document.type')}</span>
                    <p className="font-medium">OTB Plan (SRD)</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">{t('document.version')}</span>
                    <p className="font-medium">{document.version} (Final)</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">{t('document.season')}</span>
                    <p className="font-medium">{document.season}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">{t('document.brand')}</span>
                    <p className="font-medium">{document.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">{t('document.budget')}</span>
                    <p className="font-medium text-emerald-600">
                      {formatCurrency(document.data.totalBudget)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">{t('document.approved')}</span>
                    <p className="font-medium">
                      {formatDate(document.metadata.approvedAt)} by {document.metadata.approvedBy}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Data Preview
                </h4>
                <ScrollArea className="h-[200px] rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Collection</th>
                        <th className="text-left p-3 font-medium">Gender</th>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-right p-3 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {document.data.allocations.map((alloc, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 dark:hover:bg-neutral-800/50">
                          <td className="p-3">{alloc.collection}</td>
                          <td className="p-3">{alloc.gender}</td>
                          <td className="p-3">{alloc.category}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(alloc.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  Upload Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notify"
                      checked={notifyStakeholders}
                      onCheckedChange={(c) => setNotifyStakeholders(c === true)}
                    />
                    <Label htmlFor="notify" className="cursor-pointer">
                      {t('options.notifyStakeholders')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backup"
                      checked={createBackup}
                      onCheckedChange={(c) => setCreateBackup(c === true)}
                    />
                    <Label htmlFor="backup" className="cursor-pointer">
                      {t('options.createBackup')}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                {t('upload')}
              </Button>
            </DialogFooter>
          </>
        )}

        {viewState === 'uploading' && uploadStatus && (
          <>
            <DialogHeader>
              <DialogTitle>{t('uploading')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <Progress value={uploadStatus.progress} className="h-3" />

              <div className="space-y-2">
                {PORTFO_UPLOAD_STEPS.slice(0, -1).map((step) => {
                  const status = getStepStatus(step);
                  const config = PORTFO_STEP_CONFIG[step];

                  return (
                    <div
                      key={step}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded',
                        status === 'current' && 'bg-blue-50 dark:bg-blue-950/30'
                      )}
                    >
                      {status === 'done' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : status === 'current' ? (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-neutral-600" />
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          status === 'done' && 'text-emerald-600 dark:text-emerald-400',
                          status === 'current' && 'text-blue-600 dark:text-blue-400 font-medium',
                          status === 'pending' && 'text-slate-400 dark:text-neutral-500'
                        )}
                      >
                        {t(`status.${step}`)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-sm text-slate-500">
                Estimated time: 15 seconds
              </p>
            </div>
          </>
        )}

        {viewState === 'success' && uploadStatus && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-emerald-600 dark:text-emerald-400">
                    {t('success')}
                  </DialogTitle>
                  <DialogDescription>
                    Document uploaded to Portfo successfully!
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Portfo ID</span>
                  <span className="font-mono font-medium">{uploadStatus.portfoId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Uploaded</span>
                  <span className="font-medium">
                    {uploadStatus.completedAt && formatDate(uploadStatus.completedAt)}
                  </span>
                </div>
              </div>

              {uploadStatus.portfoUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(uploadStatus.portfoUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('openInPortfo')}
                </Button>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {t('nextSteps.title')}
                </h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={onSuccess}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t('nextSteps.wssi')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t('nextSteps.sku')}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                {tCommon('close')}
              </Button>
            </DialogFooter>
          </>
        )}

        {viewState === 'error' && uploadStatus && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-red-600 dark:text-red-400">
                    {t('failed')}
                  </DialogTitle>
                  <DialogDescription>
                    {uploadStatus.error || 'An error occurred during upload'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700">
                {t('retry')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PortfoUploadDialog;
