'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Sparkles,
  Table,
  Database,
  Check,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataImport } from '@/hooks/useDataImport';
import ImportUploader from '@/components/import/ImportUploader';
import AIColumnMapper from '@/components/import/AIColumnMapper';
import DataPreviewPanel from '@/components/import/DataPreviewPanel';
import { ImportStep, IMPORT_TARGET_LABELS } from '@/types/import';

// ═══════════════════════════════════════════════════════════════════════════════
// ImportPage — AI-Powered Data Import (Dashboard Layout)
// DAFC OTB Platform — Legacy Data Migration System
// ═══════════════════════════════════════════════════════════════════════════════

const STEP_CONFIG: Record<
  ImportStep,
  { title: string; titleVi: string; icon: React.ReactNode }
> = {
  upload: { title: 'Upload', titleVi: 'Tải file', icon: <Upload className="w-4 h-4" /> },
  mapping: { title: 'Mapping', titleVi: 'Mapping', icon: <Sparkles className="w-4 h-4" /> },
  preview: { title: 'Preview', titleVi: 'Xem trước', icon: <Table className="w-4 h-4" /> },
  importing: { title: 'Import', titleVi: 'Import', icon: <Database className="w-4 h-4" /> },
  complete: { title: 'Complete', titleVi: 'Hoàn tất', icon: <Check className="w-4 h-4" /> },
};

const STEPS: ImportStep[] = ['upload', 'mapping', 'preview', 'importing', 'complete'];

function StepIndicator({ currentStep }: { currentStep: ImportStep }) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center gap-1">
      {STEPS.filter(s => s !== 'complete').map((step, index) => {
        const config = STEP_CONFIG[step];
        const isActive = step === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-[#127749] text-white'
                    : isActive
                    ? 'bg-[#D7B797] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : config.icon}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive ? 'text-[#D7B797]' : isCompleted ? 'text-[#127749]' : 'text-muted-foreground'
                }`}
              >
                {config.titleVi}
              </span>
            </div>
            {index < STEPS.length - 2 && (
              <div
                className={`w-6 h-0.5 transition-colors ${
                  index < currentIndex ? 'bg-[#127749]' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ImportingStep({
  progress,
  onCancel,
}: {
  progress: ReturnType<typeof useDataImport>['progress'];
  onCancel: () => void;
}) {
  const isComplete = progress.status === 'complete';
  const isCancelled = progress.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Status Icon */}
      <div className="text-center">
        {isComplete ? (
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        ) : isCancelled ? (
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
            <XCircle className="w-8 h-8 text-amber-500" />
          </div>
        ) : (
          <div className="relative w-16 h-16 mx-auto mb-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full rounded-full border-4 border-muted border-t-[#D7B797]"
            />
            <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#D7B797]" />
          </div>
        )}
        <h2 className="text-lg font-semibold">
          {isComplete
            ? 'Import hoàn tất!'
            : isCancelled
            ? 'Import đã bị hủy'
            : 'Đang import dữ liệu...'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{progress.messageVi}</p>
      </div>

      {/* Progress */}
      {!isComplete && !isCancelled && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tiến độ</span>
            <span className="font-mono">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
          {progress.currentBatch && progress.totalBatches && (
            <p className="text-xs text-center text-muted-foreground">
              Batch {progress.currentBatch} / {progress.totalBatches}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <div className="text-lg font-bold font-mono">{progress.currentRow.toLocaleString()}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Đã xử lý</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold font-mono text-green-500">{progress.insertedCount.toLocaleString()}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Thêm mới</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <div className="text-lg font-bold font-mono text-blue-500">{progress.updatedCount.toLocaleString()}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Cập nhật</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-500/10">
          <div className="text-lg font-bold font-mono text-red-500">{progress.errorCount.toLocaleString()}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Lỗi</div>
        </div>
      </div>

      {/* Cancel button */}
      {!isComplete && !isCancelled && (
        <div className="text-center">
          <Button variant="destructive" size="sm" onClick={onCancel}>
            Hủy import
          </Button>
        </div>
      )}
    </div>
  );
}

function CompleteStep({
  progress,
  onReset,
}: {
  progress: ReturnType<typeof useDataImport>['progress'];
  onReset: () => void;
}) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold">Import hoàn tất!</h2>
        <p className="text-muted-foreground mt-1">{progress.messageVi}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="text-xl font-bold text-green-500">{progress.insertedCount}</div>
          <div className="text-xs text-muted-foreground">Thêm mới</div>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="text-xl font-bold text-blue-500">{progress.updatedCount}</div>
          <div className="text-xs text-muted-foreground">Cập nhật</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="text-xl font-bold text-amber-500">{progress.skippedCount}</div>
          <div className="text-xs text-muted-foreground">Bỏ qua</div>
        </div>
      </div>

      <Button onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Import file khác
      </Button>
    </div>
  );
}

export default function ImportPage() {
  const {
    step,
    file,
    config,
    mappings,
    validation,
    issues,
    progress,
    previewData,
    isProcessing,
    error,
    setTarget,
    uploadFile,
    updateMapping,
    rerunAIMapping,
    runValidation,
    applyAutoFixAll,
    dismissIssue,
    startImport,
    cancelImport,
    goToStep,
    reset,
  } = useDataImport();

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D7B797]" />
            AI Data Import
          </h1>
          <p className="text-sm text-muted-foreground">
            Import dữ liệu từ Excel/CSV với AI mapping tự động
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              {step !== 'complete' && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      Bước {STEPS.indexOf(step) + 1} / {STEPS.length - 1}
                    </Badge>
                    {file && (
                      <Badge variant="outline" className="text-xs">
                        {IMPORT_TARGET_LABELS[config.target]}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{STEP_CONFIG[step].titleVi}</CardTitle>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'upload' && (
            <ImportUploader
              target={config.target}
              onTargetChange={setTarget}
              onFileUpload={uploadFile}
              file={file}
              isProcessing={isProcessing}
              aiStatus={progress.messageVi}
              error={error}
            />
          )}

          {step === 'mapping' && file && (
            <AIColumnMapper
              mappings={mappings}
              target={config.target}
              sampleData={file.sampleRows}
              onUpdateMapping={updateMapping}
              onRerunAI={rerunAIMapping}
              onNext={runValidation}
              onBack={() => goToStep('upload')}
            />
          )}

          {step === 'preview' && (
            <DataPreviewPanel
              validation={validation}
              issues={issues}
              previewData={previewData}
              mappings={mappings}
              target={config.target}
              onApplyAutoFix={applyAutoFixAll}
              onDismissIssue={dismissIssue}
              onNext={startImport}
              onBack={() => goToStep('mapping')}
            />
          )}

          {step === 'importing' && (
            <ImportingStep progress={progress} onCancel={cancelImport} />
          )}

          {step === 'complete' && (
            <CompleteStep progress={progress} onReset={reset} />
          )}
        </CardContent>
      </Card>

    </div>
  );
}
