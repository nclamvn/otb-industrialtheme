'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Types
interface CascadeEffect {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  rule: string;
  isHighImpact: boolean;
}

interface EditConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  primaryChange: {
    fieldName: string;
    fieldLabel: string;
    oldValue: string;
    newValue: string;
    changePercent: number;
  };
  cascadeEffects: CascadeEffect[];
  entityName: string;
  entityId: string;
}

export function EditConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  primaryChange,
  cascadeEffects,
  entityName,
  entityId,
}: EditConfirmationDialogProps) {
  const [showAllCascades, setShowAllCascades] = useState(false);
  const [reason, setReason] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const highImpactEffects = cascadeEffects.filter((e) => e.isHighImpact);
  const isHighImpact =
    Math.abs(primaryChange.changePercent) > 10 || highImpactEffects.length > 0;
  const displayedCascades = showAllCascades
    ? cascadeEffects
    : cascadeEffects.slice(0, 3);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(reason || undefined);
      onClose();
    } catch (error) {
      console.error('Confirm failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setShowAllCascades(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isHighImpact ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <GitBranch className="w-5 h-5" style={{ color: '#B8860B' }} />
            )}
            <DialogTitle>
              {isHighImpact ? 'Thay đổi quan trọng' : 'Xác nhận thay đổi'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {entityName} <span className="font-mono">{entityId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Primary Change */}
          <div className="bg-muted rounded-lg p-4">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold"
              style={{ color: '#B8860B' }}
            >
              Thay đổi chính
            </span>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                {primaryChange.fieldLabel}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-mono text-muted-foreground line-through">
                {primaryChange.oldValue}
              </span>
              <ArrowRight
                className="w-4 h-4"
                style={{ color: '#B8860B' }}
              />
              <span className="text-sm font-mono font-semibold">
                {primaryChange.newValue}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-auto font-mono',
                  Math.abs(primaryChange.changePercent) > 10
                    ? 'border-red-500 text-red-500'
                    : Math.abs(primaryChange.changePercent) > 5
                      ? 'border-amber-500 text-amber-500'
                      : 'border-[#127749] text-[#127749]'
                )}
              >
                {primaryChange.changePercent > 0 ? '+' : ''}
                {primaryChange.changePercent.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Cascade Effects */}
          {cascadeEffects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitBranch
                  className="w-4 h-4"
                  style={{ color: '#B8860B' }}
                />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Thay đổi liên quan ({cascadeEffects.length})
                </span>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {displayedCascades.map((effect, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                        effect.isHighImpact
                          ? 'bg-red-500/10 border border-red-500/20'
                          : 'bg-muted/50'
                      )}
                    >
                      <span className="text-muted-foreground w-28 truncate">
                        {effect.fieldLabel}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {effect.oldValue}
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono text-xs font-medium">
                        {effect.newValue}
                      </span>
                      {effect.isHighImpact && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-auto flex-shrink-0" />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {cascadeEffects.length > 3 && (
                <button
                  onClick={() => setShowAllCascades(!showAllCascades)}
                  className="flex items-center gap-1 text-xs mt-2 hover:underline"
                  style={{ color: '#B8860B' }}
                >
                  {showAllCascades ? (
                    <>
                      Ẩn bớt <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Xem thêm {cascadeEffects.length - 3}{' '}
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Reason input for high impact changes */}
          {isHighImpact && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">
                Lý do thay đổi <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do thay đổi..."
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || (isHighImpact && !reason.trim())}
            className={cn(
              isHighImpact
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-[#127749] hover:bg-[#0d5a36]'
            )}
          >
            {isConfirming && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isHighImpact ? 'Xác nhận thay đổi quan trọng' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
