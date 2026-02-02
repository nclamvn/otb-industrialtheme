'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Sparkles,
  Package,
  BarChart3,
  Grid3X3,
  TrendingUp,
  Scissors,
  Target,
  Truck,
  Folder,
  ChevronRight,
} from 'lucide-react';
import {
  type ImportTarget,
  type ImportFile,
  IMPORT_TARGET_LABELS,
} from '@/types/import';

// ═══════════════════════════════════════════════════════════════════════════════
// ImportUploader — File Upload & Target Selection
// DAFC OTB Platform — AI-Powered Data Import
// ═══════════════════════════════════════════════════════════════════════════════

interface ImportUploaderProps {
  target: ImportTarget;
  onTargetChange: (target: ImportTarget) => void;
  onFileUpload: (file: File) => Promise<void>;
  file: ImportFile | null;
  isProcessing: boolean;
  aiStatus: string;
  error: string | null;
}

const TARGET_ICONS: Record<ImportTarget, React.ElementType> = {
  products: Package,
  otb_budget: BarChart3,
  wssi: Grid3X3,
  size_profiles: Grid3X3,
  forecasts: TrendingUp,
  clearance: Scissors,
  kpi_targets: Target,
  suppliers: Truck,
  categories: Folder,
};

export default function ImportUploader({
  target,
  onTargetChange,
  onFileUpload,
  file,
  isProcessing,
  aiStatus,
  error,
}: ImportUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) onFileUpload(droppedFile);
    },
    [onFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) onFileUpload(selected);
    },
    [onFileUpload]
  );

  return (
    <div className="space-y-6">
      {/* ─── Target Selection ───────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold mb-3 text-[#D7B797]">
          Chọn loại dữ liệu cần import
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(IMPORT_TARGET_LABELS) as [ImportTarget, string][]).map(([key, label]) => {
            const Icon = TARGET_ICONS[key];
            const isActive = target === key;
            return (
              <button
                key={key}
                onClick={() => onTargetChange(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-[#D7B797]/10 border-[#D7B797] text-[#D7B797]'
                    : 'bg-muted/50 border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── File Drop Zone ─────────────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl cursor-pointer transition-all overflow-hidden min-h-[200px] border-2 border-dashed ${
          isDragOver
            ? 'bg-[#D7B797]/5 border-[#D7B797]'
            : file
            ? 'bg-green-500/5 border-green-500/50'
            : 'bg-muted/30 border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.tsv,.sql"
          onChange={handleFileChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full py-12 px-6"
            >
              {/* AI Processing Animation */}
              <div className="relative mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-3 border-muted"
                  style={{ borderTopColor: '#D7B797' }}
                />
                <Sparkles
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#D7B797]"
                />
              </div>
              <p className="text-sm font-medium">
                {aiStatus}
              </p>
              <div className="mt-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#D7B797]"
                  />
                ))}
              </div>
            </motion.div>
          ) : file ? (
            <motion.div
              key="file-info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 px-6"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-green-500/10">
                {file.name.endsWith('.csv') ? (
                  <FileText className="w-7 h-7 text-green-500" />
                ) : (
                  <FileSpreadsheet className="w-7 h-7 text-green-500" />
                )}
              </div>
              <p className="text-sm font-semibold">
                {file.name}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                <span className="font-mono">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <span>•</span>
                <span className="font-mono">
                  {file.totalRows.toLocaleString()} dòng
                </span>
                <span>•</span>
                <span className="font-mono">
                  {file.headers.length} cột
                </span>
              </div>
              <p className="mt-3 text-[11px] text-green-500">
                ✅ File đã được phân tích thành công
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#D7B797]/10">
                <Upload className="w-7 h-7 text-[#D7B797]" />
              </div>
              <p className="text-sm font-semibold">
                Kéo thả file vào đây hoặc nhấp để chọn
              </p>
              <p className="text-[11px] mt-1.5 text-muted-foreground">
                Hỗ trợ: .xlsx, .xls, .csv, .tsv, .sql
              </p>
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D7B797]/10 border border-[#D7B797]/30">
                <Sparkles className="w-3.5 h-3.5 text-[#D7B797]" />
                <span className="text-[11px] font-medium text-[#D7B797]">
                  AI sẽ tự động nhận diện cấu trúc dữ liệu
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Error Display ──────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg px-4 py-3 flex items-start gap-3 bg-red-500/10 border border-red-500/30"
          >
            <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
            <p className="text-xs text-red-500">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── AI Capabilities Info ───────────────────────────────────── */}
      {!file && !isProcessing && (
        <div className="rounded-lg px-4 py-3 space-y-2 bg-muted/50 border border-border">
          <p className="text-[11px] font-semibold flex items-center gap-2 text-[#D7B797]">
            <Sparkles className="w-3.5 h-3.5" />
            AI hỗ trợ những gì?
          </p>
          {[
            'Tự động nhận diện cột và gợi ý mapping chính xác',
            'Phát hiện lỗi, dữ liệu bất thường, giá trị trùng lặp',
            'Gợi ý sửa lỗi tự động (auto-fix) cho các vấn đề đơn giản',
            'Chuyển đổi định dạng tiền tệ, ngày tháng, đơn vị',
            'Đánh giá chất lượng dữ liệu tổng thể trước khi import',
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
