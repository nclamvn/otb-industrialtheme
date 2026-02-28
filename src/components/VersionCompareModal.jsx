'use client';
import { useEffect, useMemo } from 'react';
import { X, GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils';

const VersionCompareModal = ({ isOpen, onClose, versionA, versionB, fields = [] }) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const diffs = useMemo(() => {
    if (!versionA || !versionB || fields.length === 0) return [];
    return fields.map((field) => {
      const a = versionA[field.key];
      const b = versionB[field.key];
      const changed = JSON.stringify(a) !== JSON.stringify(b);
      let direction = 'same';
      if (changed && typeof a === 'number' && typeof b === 'number') {
        direction = b > a ? 'up' : 'down';
      }
      return { ...field, valueA: a, valueB: b, changed, direction };
    });
  }, [versionA, versionB, fields]);

  if (!isOpen) return null;

  const formatValue = (val, field) => {
    if (val == null) return '—';
    if (field.format === 'currency') return formatCurrency(val);
    if (field.format === 'percent') return `${val}%`;
    if (field.format === 'date') return new Date(val).toLocaleDateString();
    return String(val);
  };

  const DiffIcon = ({ direction }) => {
    if (direction === 'up') return <ArrowUp size={12} className="text-[#1B6B45]" />;
    if (direction === 'down') return <ArrowDown size={12} className="text-[#DC3545]" />;
    return <Minus size={12} className="text-[#8C8178]" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-[#E8E2DB]"
        style={{ boxShadow: '0 16px 48px rgba(44,36,23,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2DB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(196,151,90,0.12)' }}>
              <GitCompare size={16} style={{ color: '#C4975A' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold font-brand text-[#2C2417]">
                {t('components.compareVersions') || 'Compare Versions'}
              </h3>
              <p className="text-xs text-[#8C8178]">
                {versionA?.name || 'Version A'} vs {versionB?.name || 'Version B'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F0EBE5] transition-colors">
            <X size={18} className="text-[#8C8178]" />
          </button>
        </div>

        {/* Compare table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#FAF8F5]">
                <th className="text-left text-xs font-medium px-6 py-3 text-[#6B5E54]">
                  {t('common.field') || 'Field'}
                </th>
                <th className="text-right text-xs font-medium px-6 py-3 text-[#6B5E54]">
                  {versionA?.name || 'Version A'}
                </th>
                <th className="text-center text-xs font-medium px-4 py-3 text-[#6B5E54]" />
                <th className="text-right text-xs font-medium px-6 py-3 text-[#6B5E54]">
                  {versionB?.name || 'Version B'}
                </th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((diff) => (
                <tr
                  key={diff.key}
                  className={`border-b border-[#F0EBE5] last:border-0 ${diff.changed ? 'bg-[#FFFBF5]' : ''}`}
                >
                  <td className="px-6 py-3 text-sm font-medium text-[#2C2417]">
                    {diff.label}
                  </td>
                  <td className={`px-6 py-3 text-sm text-right ${diff.changed ? 'text-[#8C8178]' : 'text-[#2C2417]'}`}>
                    {formatValue(diff.valueA, diff)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {diff.changed && <DiffIcon direction={diff.direction} />}
                  </td>
                  <td className={`px-6 py-3 text-sm text-right font-medium ${diff.changed ? 'text-[#C4975A]' : 'text-[#2C2417]'}`}>
                    {formatValue(diff.valueB, diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E8E2DB] flex justify-between items-center bg-[#FAF8F5] rounded-b-2xl">
          <span className="text-xs text-[#8C8178]">
            {diffs.filter((d) => d.changed).length} {t('components.changesDetected') || 'changes detected'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-[#C4975A] hover:bg-[#B08650]"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionCompareModal;
