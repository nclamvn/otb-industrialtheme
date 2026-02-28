'use client';
import { Printer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrintButton({ label, className = '' }) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
        border-[#E8E2DB] text-[#6B5E54] hover:bg-[#FAF8F5] hover:border-[#C4975A] ${className}`}
    >
      <Printer size={16} />
      <span>{label || t('common.print') || 'Print'}</span>
    </button>
  );
}
