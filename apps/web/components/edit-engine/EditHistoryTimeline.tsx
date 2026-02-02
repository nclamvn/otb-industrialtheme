'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  X,
  GitBranch,
  User,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface EditRecord {
  id: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string;
  valueType: string;
  isCascade: boolean;
  cascadeRule?: string;
  status: 'PENDING' | 'AUTO_APPROVED' | 'APPROVED' | 'REJECTED' | 'REVERTED';
  editedByName: string;
  editedByRole?: string;
  reason?: string;
  rejectReason?: string;
  approvedBy?: string;
  batchId: string;
  createdAt: string;
}

interface EditHistoryTimelineProps {
  edits: EditRecord[];
  onApprove?: (editId: string) => Promise<void>;
  onReject?: (editId: string, reason: string) => Promise<void>;
  canApprove?: boolean;
  maxHeight?: string;
  className?: string;
}

// ════════════════════════════════════════
// Status Configuration
// ════════════════════════════════════════

const STATUS_MAP = {
  PENDING: {
    color: 'text-[#B8860B]',
    bg: 'bg-[#B8860B]/10',
    border: 'border-[#B8860B]/20',
    label: 'Chờ duyệt',
    icon: Clock,
  },
  AUTO_APPROVED: {
    color: 'text-[#127749]',
    bg: 'bg-[#127749]/10',
    border: 'border-[#127749]/20',
    label: 'Tự động duyệt',
    icon: Zap,
  },
  APPROVED: {
    color: 'text-[#127749]',
    bg: 'bg-[#127749]/10',
    border: 'border-[#127749]/20',
    label: 'Đã duyệt',
    icon: CheckCircle2,
  },
  REJECTED: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Từ chối',
    icon: XCircle,
  },
  REVERTED: {
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-muted',
    label: 'Hoàn tác',
    icon: RotateCcw,
  },
} as const;

type FilterKey = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function EditHistoryTimeline({
  edits,
  onApprove,
  onReject,
  canApprove = false,
  maxHeight = '480px',
  className = '',
}: EditHistoryTimelineProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── Group by batch ──
  const batches = edits.reduce(
    (acc, edit) => {
      if (!acc[edit.batchId]) acc[edit.batchId] = [];
      acc[edit.batchId].push(edit);
      return acc;
    },
    {} as Record<string, EditRecord[]>
  );

  // ── Filter batches ──
  const filteredBatches = Object.entries(batches)
    .filter(
      ([, batch]) => filter === 'all' || batch.some((e) => e.status === filter)
    )
    .sort(
      ([, a], [, b]) =>
        new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
    );

  // ── Counts for filter tabs ──
  const pendingCount = edits.filter(
    (e) => e.status === 'PENDING' && !e.isCascade
  ).length;

  // ── Handle reject ──
  const handleReject = async (editId: string) => {
    if (!rejectReason.trim()) return;
    await onReject?.(editId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: '#B8860B' }} />
          Lịch sử thay đổi
          {pendingCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#B8860B] text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as FilterKey[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all',
                  filter === key
                    ? 'bg-[#B8860B] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {key === 'all' ? 'Tất cả' : STATUS_MAP[key].label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredBatches.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Chưa có thay đổi nào</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredBatches.map(([batchId, batch]) => {
              const primary = batch.find((e) => !e.isCascade) || batch[0];
              const cascades = batch.filter((e) => e.isCascade);
              const cfg = STATUS_MAP[primary.status];
              const Icon = cfg.icon;
              const isExpanded = expandedBatch === batchId;
              const isRejecting = rejectingId === primary.id;

              return (
                <div
                  key={batchId}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border',
                        cfg.bg,
                        cfg.border
                      )}
                    >
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Field + Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          {primary.fieldLabel}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[9px] font-bold',
                            cfg.bg,
                            cfg.color
                          )}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      {/* Old → New */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-muted-foreground line-through">
                          {primary.oldValue || '—'}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono text-xs font-medium">
                          {primary.newValue}
                        </span>
                      </div>

                      {/* Meta line */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {primary.editedByName}
                        </span>
                        {primary.editedByRole && (
                          <span className="px-1 py-0.5 rounded bg-muted text-muted-foreground text-[8px]">
                            {primary.editedByRole}
                          </span>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground font-mono">
                          {new Date(primary.createdAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Reason / Reject reason */}
                      {primary.reason && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          &ldquo;{primary.reason}&rdquo;
                        </p>
                      )}
                      {primary.rejectReason && (
                        <p className="text-[10px] text-red-500 mt-1">
                          Từ chối: &ldquo;{primary.rejectReason}&rdquo;
                        </p>
                      )}

                      {/* Cascade toggle */}
                      {cascades.length > 0 && (
                        <>
                          <button
                            onClick={() =>
                              setExpandedBatch(isExpanded ? null : batchId)
                            }
                            className="flex items-center gap-1 mt-2 text-[10px] hover:underline font-medium"
                            style={{ color: '#B8860B' }}
                          >
                            <GitBranch className="w-3 h-3" />
                            {cascades.length} thay đổi liên quan
                            <ChevronDown
                              className={cn(
                                'w-3 h-3 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 ml-2 border-l-2 border-[#B8860B]/20 pl-3 space-y-1.5 overflow-hidden"
                              >
                                {cascades.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center gap-2 text-[11px]"
                                  >
                                    <span className="text-muted-foreground w-28 truncate">
                                      {c.fieldLabel}
                                    </span>
                                    <span className="text-muted-foreground font-mono">
                                      {c.oldValue || '—'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      →
                                    </span>
                                    <span className="font-mono font-medium">
                                      {c.newValue}
                                    </span>
                                    {c.cascadeRule && (
                                      <span className="text-[8px] text-muted-foreground italic ml-auto">
                                        {c.cascadeRule}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      {/* Approval actions */}
                      {canApprove && primary.status === 'PENDING' && (
                        <div className="mt-3">
                          {isRejecting ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Lý do từ chối..."
                                className="h-7 text-xs"
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleReject(primary.id)
                                }
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(primary.id)}
                                disabled={!rejectReason.trim()}
                                className="h-7 text-xs"
                              >
                                Từ chối
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => onApprove?.(primary.id)}
                                className="h-7 text-xs bg-[#127749] hover:bg-[#0d5a36]"
                              >
                                <Check className="w-3 h-3 mr-1" /> Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectingId(primary.id)}
                                className="h-7 text-xs hover:border-red-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3 mr-1" /> Từ chối
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EditHistoryTimeline;
export type { EditRecord, EditHistoryTimelineProps };
