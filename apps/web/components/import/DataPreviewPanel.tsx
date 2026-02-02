'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Wand2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  ValidationSummary,
  ValidationIssue,
  AIColumnMapping,
  ImportTarget,
} from '@/types/import';
import { TARGET_SCHEMAS } from '@/types/import';

// ═══════════════════════════════════════════════════════════════════════════════
// DataPreviewPanel — Validation Results & Data Preview
// DAFC OTB Platform — AI-Powered Data Import
// ═══════════════════════════════════════════════════════════════════════════════

interface DataPreviewPanelProps {
  validation: ValidationSummary | null;
  issues: ValidationIssue[];
  previewData: {
    original: Record<string, unknown>[];
    transformed: Record<string, unknown>[];
  };
  mappings: AIColumnMapping[];
  target: ImportTarget;
  onApplyAutoFix: () => void;
  onDismissIssue: (issueId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function QualityScoreRing({ score }: { score: number }) {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;

  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
          Quality
        </span>
      </div>
    </div>
  );
}

function IssueBadge({ severity }: { severity: string }) {
  const config = {
    error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    suggestion: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  }[severity] || { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' };

  const Icon = config.icon;

  return (
    <div className={`p-1 rounded ${config.bg}`}>
      <Icon className={`w-3 h-3 ${config.color}`} />
    </div>
  );
}

export default function DataPreviewPanel({
  validation,
  issues,
  previewData,
  mappings,
  target,
  onApplyAutoFix,
  onDismissIssue,
  onNext,
  onBack,
}: DataPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'issues'>('issues');
  const [issueFilter, setIssueFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const schema = TARGET_SCHEMAS[target];
  const mappedFields = mappings.filter((m) => m.targetField);

  const filteredIssues = useMemo(() => {
    if (issueFilter === 'all') return issues;
    return issues.filter((i) => i.severity === issueFilter);
  }, [issues, issueFilter]);

  const paginatedData = previewData.transformed.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(previewData.transformed.length / pageSize);

  if (!validation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#D7B797] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Quality Summary ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score */}
        <div className="flex items-center justify-center p-4 rounded-xl bg-muted/30 border border-border">
          <QualityScoreRing score={validation.score} />
        </div>

        {/* Stats */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <h3 className="text-xs font-semibold text-[#D7B797] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Kết quả kiểm tra
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-green-500/10">
              <div className="text-lg font-bold text-green-500">{validation.validRows}</div>
              <div className="text-[9px] text-muted-foreground">Dòng hợp lệ</div>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10">
              <div className="text-lg font-bold text-red-500">{validation.errorRows}</div>
              <div className="text-[9px] text-muted-foreground">Dòng lỗi</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <div className="text-lg font-bold text-amber-500">{validation.warningRows}</div>
              <div className="text-[9px] text-muted-foreground">Cảnh báo</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <div className="text-lg font-bold text-blue-500">{validation.autoFixableCount}</div>
              <div className="text-[9px] text-muted-foreground">Tự sửa được</div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="text-xs font-semibold text-[#D7B797] flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Insights
          </h3>
          <div className="space-y-1.5">
            {validation.aiInsightsVi.slice(0, 4).map((insight, idx) => (
              <p key={idx} className="text-[10px] text-muted-foreground">
                {insight}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Auto-Fix Button ────────────────────────────────────────── */}
      {validation.autoFixableCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#D7B797]/10 border border-[#D7B797]/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-[#D7B797]" />
              <div>
                <p className="text-sm font-medium">AI có thể tự động sửa {validation.autoFixableCount} vấn đề</p>
                <p className="text-[10px] text-muted-foreground">Bao gồm: định dạng sai, giá trị gần đúng, khoảng trắng thừa</p>
              </div>
            </div>
            <Button onClick={onApplyAutoFix} className="bg-[#D7B797] hover:bg-[#D7B797]/90 text-black">
              <Wand2 className="w-4 h-4 mr-1.5" />
              Auto-Fix
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'issues'
              ? 'border-[#D7B797] text-[#D7B797]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Vấn đề ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'preview'
              ? 'border-[#D7B797] text-[#D7B797]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Xem trước dữ liệu
        </button>
      </div>

      {/* ─── Tab Content ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'issues' ? (
          <motion.div
            key="issues"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {(['all', 'error', 'warning', 'info'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setIssueFilter(filter)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    issueFilter === filter
                      ? 'bg-[#D7B797]/20 text-[#D7B797]'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter === 'all' ? 'Tất cả' : filter === 'error' ? 'Lỗi' : filter === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                </button>
              ))}
            </div>

            {/* Issues List */}
            <ScrollArea className="h-[300px]">
              {filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-sm font-medium">Không có vấn đề nào!</p>
                  <p className="text-xs text-muted-foreground">Dữ liệu sẵn sàng để import</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredIssues.slice(0, 50).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <IssueBadge severity={issue.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px]">Dòng {issue.row}</Badge>
                          <Badge variant="secondary" className="text-[9px]">{issue.field}</Badge>
                        </div>
                        <p className="text-xs">{issue.messageVi}</p>
                        {issue.suggestedActionVi && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            💡 {issue.suggestedActionVi}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onDismissIssue(issue.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {filteredIssues.length > 50 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      + {filteredIssues.length - 50} vấn đề khác
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Data Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <ScrollArea className="w-full">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10">#</th>
                      {mappedFields.slice(0, 6).map((m) => (
                        <th key={m.sourceColumn} className="px-3 py-2 text-left font-medium">
                          {schema.find(f => f.id === m.targetField)?.labelVi || m.targetField}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground font-mono">{page * pageSize + idx + 1}</td>
                        {mappedFields.slice(0, 6).map((m) => (
                          <td key={m.sourceColumn} className="px-3 py-2 truncate max-w-[150px]">
                            {row[m.targetField!] !== null ? String(row[m.targetField!]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, previewData.transformed.length)} / {previewData.transformed.length} dòng
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-7"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-7"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Action Buttons ─────────────────────────────────────────── */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Quay lại mapping
        </Button>
        <Button
          onClick={onNext}
          className="bg-[#127749] hover:bg-[#127749]/90"
        >
          {validation.errorRows === 0 ? 'Tiến hành import' : 'Import (có lỗi)'}
        </Button>
      </div>
    </div>
  );
}
