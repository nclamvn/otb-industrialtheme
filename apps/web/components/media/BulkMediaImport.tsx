'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Link2,
  FolderOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

type ImportMethod = 'excel' | 'url' | 'files';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: { sku: string; error: string }[];
}

interface BulkMediaImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
  uploadedById?: string;
}

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function BulkMediaImport({
  isOpen,
  onClose,
  onImportComplete,
  uploadedById = 'system',
}: BulkMediaImportProps) {
  const [method, setMethod] = useState<ImportMethod>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [skuColumn, setSkuColumn] = useState('0');
  const [imageColumn, setImageColumn] = useState('');
  const [headerRow, setHeaderRow] = useState('1');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset state on close
  const handleClose = () => {
    setFile(null);
    setFiles([]);
    setResult(null);
    setProgress(0);
    onClose();
  };

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    if (method === 'files') {
      setFiles(Array.from(selectedFiles));
    } else {
      setFile(selectedFiles[0]);
    }
  }, [method]);

  // Handle import
  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('method', method);
      formData.append('uploadedById', uploadedById);

      if (method === 'files') {
        files.forEach((f, i) => formData.append(`files[${i}]`, f));
      } else {
        if (!file) throw new Error('Chưa chọn file');
        formData.append('file', file);
        formData.append('skuColumn', skuColumn);
        formData.append('headerRow', headerRow);
        if (imageColumn) formData.append('imageColumn', imageColumn);
      }

      // Simulated progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/media/bulk-import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import thất bại');
      }

      const importResult: ImportResult = await response.json();
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Import thất bại';
      setResult({
        total: 0,
        success: 0,
        failed: 1,
        skipped: 0,
        errors: [{ sku: 'N/A', error: message }],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" style={{ color: '#B8860B' }} />
            Import Ảnh Hàng Loạt
          </DialogTitle>
          <DialogDescription>
            Nhập ảnh sản phẩm từ Excel, URL hoặc thư mục
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Result Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Tổng</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#127749]/10">
                  <p className="text-2xl font-bold text-[#127749]">{result.success}</p>
                  <p className="text-xs text-muted-foreground">Thành công</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-xs text-muted-foreground">Lỗi</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-500">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">Bỏ qua</p>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm p-2 rounded bg-red-500/10"
                    >
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-mono text-xs">{err.sku}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-red-500 truncate">{err.error}</span>
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ...và {result.errors.length - 10} lỗi khác
                    </p>
                  )}
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Đóng
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Method Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
                  { id: 'url', label: 'URL Column', icon: Link2 },
                  { id: 'files', label: 'Thư mục', icon: FolderOpen },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as ImportMethod)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                      method === m.id
                        ? 'border-[#B8860B] bg-[#B8860B]/10'
                        : 'border-border hover:border-[#B8860B]/50'
                    )}
                  >
                    <m.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* File Input */}
              <div>
                <Label>
                  {method === 'files' ? 'Chọn ảnh' : 'Chọn file Excel'}
                </Label>
                <Input
                  type="file"
                  accept={method === 'files' ? 'image/*' : '.xlsx,.xls'}
                  multiple={method === 'files'}
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">{file.name}</p>
                )}
                {files.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Đã chọn {files.length} ảnh
                  </p>
                )}
              </div>

              {/* Excel Options */}
              {method !== 'files' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Cột SKU</Label>
                    <Select value={skuColumn} onValueChange={setSkuColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D', 'E', 'F'].map((col, i) => (
                          <SelectItem key={col} value={i.toString()}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {method === 'url' && (
                    <div>
                      <Label>Cột URL</Label>
                      <Select value={imageColumn} onValueChange={setImageColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D', 'E', 'F'].map((col, i) => (
                            <SelectItem key={col} value={i.toString()}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Dòng tiêu đề</Label>
                    <Select value={headerRow} onValueChange={setHeaderRow}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((row) => (
                          <SelectItem key={row} value={row.toString()}>
                            {row}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    Đang xử lý... {progress}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={handleClose} disabled={isImporting}>
                  Hủy
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    isImporting ||
                    (method === 'files' ? files.length === 0 : !file)
                  }
                  className="bg-[#B8860B] hover:bg-[#9a7209]"
                >
                  {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default BulkMediaImport;
