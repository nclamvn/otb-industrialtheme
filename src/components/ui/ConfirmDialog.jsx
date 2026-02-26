'use client';

import { useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger', // 'danger' | 'warning'
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();

  const handleKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') onCancel?.();
    if (e.key === 'Enter') onConfirm?.();
  }, [open, onConfirm, onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const confirmBg = isDanger
    ? 'bg-[#DC3545] hover:bg-[#c82333]'
    : 'bg-[#D97706] hover:bg-[#b45f06]';
  const iconColor = isDanger ? 'text-[#DC3545]' : 'text-[#D97706]';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl border shadow-2xl p-5 bg-white border-[#E8E2DB]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className={iconColor} />
          <h3 className="font-semibold font-brand text-[#2C2417]">
            {title || (t('common.confirm') || 'Confirm')}
          </h3>
          <button onClick={onCancel} className="ml-auto p-1 rounded hover:bg-[#F0EBE5]">
            <X size={16} className="text-[#8C8178]" />
          </button>
        </div>
        <p className="text-sm mb-4 text-[#8C8178]">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-[#8C8178] hover:bg-[rgba(160,120,75,0.12)]"
          >
            {cancelLabel || t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${confirmBg}`}
          >
            {confirmLabel || (t('common.confirm') || 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
