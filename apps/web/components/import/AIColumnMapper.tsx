'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Zap,
  RotateCcw,
} from 'lucide-react';
import type { AIColumnMapping, ImportTarget } from '@/types/import';
import { TARGET_SCHEMAS } from '@/types/import';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════════════════════
// AIColumnMapper — AI-Assisted Column Mapping with Manual Override
// DAFC OTB Platform — AI-Powered Data Import
// ═══════════════════════════════════════════════════════════════════════════════

interface AIColumnMapperProps {
  mappings: AIColumnMapping[];
  target: ImportTarget;
  sampleData: Record<string, unknown>[];
  onUpdateMapping: (sourceColumn: string, targetField: string | null) => void;
  onRerunAI: () => void;
  onNext: () => void;
  onBack: () => void;
}

function confidenceColor(score: number): string {
  if (score >= 0.85) return 'text-green-500';
  if (score >= 0.6) return 'text-amber-500';
  if (score >= 0.4) return 'text-amber-500';
  return 'text-red-500';
}

function confidenceBgColor(score: number): string {
  if (score >= 0.85) return 'bg-green-500/10';
  if (score >= 0.6) return 'bg-amber-500/10';
  if (score >= 0.4) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

export default function AIColumnMapper({
  mappings,
  target,
  sampleData,
  onUpdateMapping,
  onRerunAI,
  onNext,
  onBack,
}: AIColumnMapperProps) {
  const schema = TARGET_SCHEMAS[target];
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const mappedCount = mappings.filter((m) => m.targetField).length;
  const requiredFields = schema.filter((f) => f.required);
  const mappedRequired = requiredFields.filter((f) =>
    mappings.some((m) => m.targetField === f.id)
  );
  const unmappedRequired = requiredFields.filter(
    (f) => !mappings.some((m) => m.targetField === f.id)
  );
  const avgConfidence =
    mappings.filter((m) => m.targetField).reduce((sum, m) => sum + m.confidence, 0) /
    Math.max(mappedCount, 1);

  const allRequiredMapped = unmappedRequired.length === 0;

  return (
    <div className="space-y-4">
      {/* ─── AI Summary Bar ─────────────────────────────────────────── */}
      <div className="rounded-xl px-5 py-4 bg-muted/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D7B797]" />
            <span className="text-xs font-semibold text-[#D7B797]">
              Kết quả AI Mapping
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRerunAI}
            className="h-7 text-[10px]"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Chạy lại AI
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold font-mono">
              {mappedCount}/{mappings.length}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Cột đã map
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold font-mono ${allRequiredMapped ? 'text-green-500' : 'text-red-500'}`}>
              {mappedRequired.length}/{requiredFields.length}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Bắt buộc
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold font-mono ${confidenceColor(avgConfidence)}`}>
              {(avgConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Độ tin cậy
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-blue-500">
              {mappings.filter((m) => m.transform).length}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Chuyển đổi
            </div>
          </div>
        </div>

        {/* Unmapped required warning */}
        {unmappedRequired.length > 0 && (
          <div className="mt-3 rounded-lg px-3 py-2 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-[11px] font-medium text-amber-600">
                Thiếu {unmappedRequired.length} trường bắt buộc (vẫn có thể import):
              </p>
              <p className="text-[10px] mt-0.5 text-amber-500">
                {unmappedRequired.map((f) => f.labelVi).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Mapping Rows ───────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {mappings.map((mapping) => {
          const isExpanded = expandedRow === mapping.sourceColumn;
          const fieldDef = schema.find((f) => f.id === mapping.targetField);
          const isRequired = fieldDef?.required;
          const sampleValues = sampleData.slice(0, 3).map((r) => String(r[mapping.sourceColumn] || '—'));

          return (
            <motion.div
              key={mapping.sourceColumn}
              layout
              className={`rounded-lg overflow-hidden bg-muted/30 border ${
                mapping.targetField ? 'border-border' : 'border-red-500/30'
              }`}
            >
              {/* Main Row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedRow(isExpanded ? null : mapping.sourceColumn)}
              >
                {/* Source Column */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {mapping.sourceColumn}
                  </p>
                  <p className="text-[9px] font-mono truncate mt-0.5 text-muted-foreground">
                    {sampleValues.join(' | ')}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />

                {/* Target Field */}
                <div className="flex-1 min-w-0">
                  {mapping.targetField ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate">
                        {fieldDef?.labelVi || mapping.targetField}
                      </p>
                      {isRequired && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                          BẮT BUỘC
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-red-500">
                      Chưa mapping
                    </p>
                  )}
                </div>

                {/* Confidence Badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {mapping.targetField && (
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${confidenceColor(mapping.confidence)} ${confidenceBgColor(mapping.confidence)}`}
                    >
                      {mapping.userOverride ? '✋ Thủ công' : `${(mapping.confidence * 100).toFixed(0)}%`}
                    </span>
                  )}
                  {mapping.transform && (
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform text-muted-foreground ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-3 border-t border-border bg-muted/20">
                      {/* AI Reason */}
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#D7B797]" />
                        <p className="text-[10px] text-muted-foreground">
                          {mapping.aiReason}
                        </p>
                      </div>

                      {/* Transform Info */}
                      {mapping.transform && (
                        <div className="flex items-start gap-2">
                          <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                          <p className="text-[10px] text-blue-500">
                            Chuyển đổi: {mapping.transform.descriptionVi}
                          </p>
                        </div>
                      )}

                      {/* Manual Selection */}
                      <div>
                        <label className="text-[9px] uppercase tracking-wider mb-1 block text-muted-foreground">
                          Chọn trường đích (hoặc bỏ mapping)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateMapping(mapping.sourceColumn, null);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                              !mapping.targetField
                                ? 'bg-red-500/10 text-red-500 border-red-500'
                                : 'bg-muted text-muted-foreground border-border hover:border-muted-foreground'
                            }`}
                          >
                            <X className="w-3 h-3 inline mr-1" />
                            Bỏ qua
                          </button>

                          {schema.map((field) => {
                            const isCurrentTarget = mapping.targetField === field.id;
                            const isUsedByOther = !isCurrentTarget && mappings.some((m) => m.targetField === field.id && m.sourceColumn !== mapping.sourceColumn);
                            return (
                              <button
                                key={field.id}
                                disabled={isUsedByOther}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateMapping(mapping.sourceColumn, field.id);
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border disabled:opacity-30 ${
                                  isCurrentTarget
                                    ? 'bg-[#D7B797]/10 text-[#D7B797] border-[#D7B797]'
                                    : 'bg-muted text-muted-foreground border-border hover:border-muted-foreground'
                                }`}
                              >
                                {isCurrentTarget && <Check className="w-3 h-3 inline mr-1" />}
                                {field.labelVi}
                                {field.required && <span className="text-red-500"> *</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* AI Alternatives */}
                      {mapping.alternatives.length > 0 && (
                        <div>
                          <label className="text-[9px] uppercase tracking-wider mb-1 block text-muted-foreground">
                            Gợi ý khác của AI
                          </label>
                          <div className="space-y-1">
                            {mapping.alternatives.map((alt) => (
                              <button
                                key={alt.targetField}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateMapping(mapping.sourceColumn, alt.targetField);
                                }}
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-[10px] bg-muted hover:bg-muted/80 transition-colors"
                              >
                                <span className="flex-1">{schema.find(f => f.id === alt.targetField)?.labelVi || alt.targetField}</span>
                                <span className={`font-mono ${confidenceColor(alt.confidence)}`}>
                                  {(alt.confidence * 100).toFixed(0)}%
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Action Buttons ─────────────────────────────────────────── */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button
          onClick={onNext}
          className={allRequiredMapped
            ? "bg-[#127749] hover:bg-[#127749]/90"
            : "bg-amber-500 hover:bg-amber-600"
          }
        >
          {allRequiredMapped ? 'Tiếp tục xem trước' : `Tiếp tục (thiếu ${unmappedRequired.length} trường)`}
        </Button>
      </div>
    </div>
  );
}
