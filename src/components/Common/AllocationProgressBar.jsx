'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Circle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { formatCurrency } from '@/utils/formatters';
import { useLanguage } from '@/contexts/LanguageContext';

const formatFullCurrency = (value) => {
  let num = 0;
  if (typeof value === 'string') num = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  else if (typeof value === 'number') num = isNaN(value) ? 0 : value;
  return new Intl.NumberFormat('vi-VN').format(num) + ' VND';
};

const CurrencyWithTooltip = ({ value, className }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className={`relative cursor-default ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {formatCurrency(value)}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded text-[10px] font-data whitespace-nowrap pointer-events-none shadow-lg bg-[#2C2417] text-white">
          {formatFullCurrency(value)}
        </span>
      )}
    </span>
  );
};

const AllocationProgressBar = ({ totalBudget, totalAllocated, darkMode = false }) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();

  const { pct, remaining, isOver, isComplete } = useMemo(() => {
    if (totalBudget <= 0) return { pct: 0, remaining: 0, isOver: false, isComplete: false };
    const rawPct = (totalAllocated / totalBudget) * 100;
    const p = Math.min(Math.round(rawPct), 100);
    const r = totalBudget - totalAllocated;
    return { pct: p, remaining: r, isOver: r < 0, isComplete: Math.round(rawPct) === 100 };
  }, [totalBudget, totalAllocated]);

  if (totalBudget <= 0) return null;

  const overPct = isOver ? Math.min(Math.round((totalAllocated / totalBudget) * 100), 120) : 0;

  const barColor = isOver
    ? 'bg-gradient-to-r from-[#DC3545] to-[#FF6B6B]'
    : 'bg-gradient-to-r from-[#1B6B45] to-[#2A9E6A]';

  const pctColor = isOver
    ? 'text-[#DC3545]'
    : pct >= 80 ? 'text-[#1B6B45]' : 'text-[#D97706]';

  return (
    <div className="px-3 md:px-6 py-1.5 border-b flex items-center gap-3 bg-white border-[#E8E2DB]">
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full overflow-hidden bg-[#E8E2DB]">
          <div
            className={`h-full rounded-full transition-all duration-200 ${barColor}`}
            style={{ width: `${isOver ? Math.min(overPct, 100) : pct}%` }}
          />
        </div>
      </div>

      {(() => {
        const badge = totalAllocated === 0
          ? { color: 'bg-[#6B7280]', label: t('planning.statusNotAllocated') || 'Not Allocated' }
          : isOver
            ? { color: 'bg-[#DC3545]', label: t('planning.statusOverBudget') || 'Over Budget' }
            : isComplete
              ? { color: 'bg-[#1B6B45]', label: t('planning.statusAllocated') || 'Allocated' }
              : { color: 'bg-[#D97706]', label: t('planning.statusProcessing') || 'Processing' };
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0 ${badge.color}`}>
            <Circle size={6} className="fill-current" />
            {badge.label}
          </span>
        );
      })()}

      <span className={`text-xs font-bold font-data shrink-0 ${pctColor}`}>
        {isOver ? overPct : pct}%
        {isOver && <AlertTriangle size={10} className="inline ml-0.5 -mt-0.5" />}
      </span>

      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-[#8C8178]">{t('planning.allocated') || 'Allocated'}:</span>
        <CurrencyWithTooltip
          value={totalAllocated}
          className={`text-xs font-semibold font-data ${isOver ? 'text-[#DC3545]' : 'text-[#1B6B45]'}`}
        />
        <span className="text-[#E8E2DB]">|</span>
        <span className="text-[10px] text-[#8C8178]">{isOver ? (t('planning.overBudget') || 'Over') : (t('planning.remaining') || 'Remaining')}:</span>
        <CurrencyWithTooltip
          value={Math.abs(remaining)}
          className={`text-xs font-semibold font-data ${isOver ? 'text-[#DC3545]' : 'text-[#6B4D30]'}`}
        />
        <span className="text-[#E8E2DB]">|</span>
        <span className="text-[10px] text-[#8C8178]">{t('planning.totalBudget') || 'Total'}:</span>
        <CurrencyWithTooltip value={totalBudget} className="text-xs font-semibold font-data text-[#2C2417]" />
      </div>

      <div className="flex md:hidden items-center gap-1.5 shrink-0">
        <CurrencyWithTooltip
          value={totalAllocated}
          className={`text-[10px] font-semibold font-data ${isOver ? 'text-[#DC3545]' : 'text-[#1B6B45]'}`}
        />
        <span className="text-[10px] text-[#8C8178]">/</span>
        <CurrencyWithTooltip value={totalBudget} className="text-[10px] font-data text-[#8C8178]" />
      </div>
    </div>
  );
};

export default React.memo(AllocationProgressBar);
