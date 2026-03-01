'use client';
import { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SHORTCUTS = [
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modal / dialog' },
  { key: 'Ctrl+K', description: 'Focus search' },
  { key: 'Ctrl+S', description: 'Save current form' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div ref={modalRef} className="w-full max-w-md mx-4 rounded-2xl border border-[#E8E2DB] shadow-2xl bg-white">
        <div className="p-5 border-b border-[#E8E2DB]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-brand text-[#2C2417] flex items-center gap-2">
              <Keyboard size={20} className="text-[#C4975A]" />
              {t('common.keyboardHelp')}
            </h3>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[#F0EBE5]"
            >
              <X size={18} className="text-[#8C8178]" />
            </button>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {SHORTCUTS.map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-[#6B5D4F] font-brand">{description}</span>
                <kbd className="px-2 py-1 rounded-lg bg-[#FBF9F7] border border-[#E8E2DB] text-xs font-data font-semibold text-[#2C2417] min-w-[40px] text-center">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
