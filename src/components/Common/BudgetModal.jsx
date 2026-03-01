'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Save, Sparkles, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const BudgetModal = ({
  selectedCell,
  selectedYear,
  budgetFormData,
  setBudgetFormData,
  onClose,
  onSave,
  calculateTotalBudget,
  handleStoreAllocationChange
}) => {
  const { t } = useLanguage();
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  useFocusTrap(modalRef);

  const validate = useCallback(() => {
    const newErrors = {};
    const total = calculateTotalBudget();
    if (total <= 0) {
      newErrors.total = t('validation.minValue', { field: t('components.totalBudget'), min: '0' }) || 'Total must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [calculateTotalBudget, t]);

  const handleSave = () => {
    if (validate()) {
      onSave();
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';

    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedCell) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
      <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 flex flex-col transform animate-in zoom-in-95 duration-300 border border-[#E8E2DB]" style={{ pointerEvents: 'auto', boxShadow: '0 16px 48px rgba(44,36,23,0.12)' }}>
        {/* Header */}
        <div className="bg-[#C4975A] px-8 py-6 flex items-center justify-between relative overflow-hidden rounded-t-3xl">
          <div className="relative z-10 animate-in slide-in-from-left duration-500">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-brand">
              <Sparkles size={24} className="animate-spin" style={{ animationDuration: '3s' }} />
              {selectedCell.existingBudget ? t('components.editBudgetTitle') : t('components.createBudgetTitle')}
            </h2>
            <p className="text-white/80 text-sm mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '200ms' }}>
              {selectedCell.brand.name} - {selectedCell.season.seasonGroupId} {selectedCell.season.name} ({selectedYear})
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 text-white hover:bg-white/20 rounded-xl p-2.5 transition-all duration-300 transform hover:scale-110 hover:rotate-90 active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 max-h-[60vh] bg-white">
          {/* Budget Comment */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#2C2417] mb-3 flex items-center gap-2 font-brand">
              <FileText size={16} className="text-[#C4975A]" />
              {t('components.budgetComment')}
            </label>
            <textarea
              value={budgetFormData.comment}
              onChange={(e) => setBudgetFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder={t('components.budgetCommentPlaceholder')}
              className="w-full px-5 py-4 bg-[#FBF9F7] border-2 border-[#E8E2DB] rounded-2xl text-[#2C2417] placeholder-[#8C8178] focus:ring-2 focus:ring-[#C4975A] focus:border-transparent resize-none transition-all duration-300 hover:border-[rgba(196,151,90,0.35)]"
              rows={3}
            />
          </div>

          {/* Store Budget Allocation */}
          <div>
            <label className="block text-sm font-bold text-[#2C2417] mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-left duration-300 font-brand" style={{ animationDelay: '100ms' }}>
              <DollarSign size={16} className="text-[#C4975A]" />
              {t('components.storeBudgetAllocation')}
            </label>
            <div className="space-y-3">
              {budgetFormData.storeAllocations.map((sa, idx) => (
                <div
                  key={sa.storeId}
                  className="group flex items-center gap-4 p-5 bg-[#FBF9F7] rounded-2xl border-2 border-[#E8E2DB] hover:border-[rgba(196,151,90,0.35)] hover:bg-[rgba(196,151,90,0.04)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] animate-in fade-in slide-in-from-right"
                  style={{ animationDelay: `${idx * 100 + 200}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-[#2C2417] group-hover:text-[#A67B3D] transition-colors duration-300">{sa.storeName}</div>
                    <div className="text-xs text-[#8C8178]">{sa.storeCode}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#6B5D4F] text-sm font-semibold group-hover:text-[#C4975A] transition-colors duration-300">VND</span>
                    <input
                      type="number"
                      value={sa.budgetAmount || ''}
                      onChange={(e) => handleStoreAllocationChange(sa.storeId, e.target.value)}
                      placeholder="0"
                      className="w-44 px-5 py-3 bg-white border-2 border-[#E8E2DB] rounded-xl text-right font-bold text-[#2C2417] placeholder-[#8C8178] focus:ring-2 focus:ring-[#C4975A] focus:border-transparent transition-all duration-300 hover:border-[rgba(196,151,90,0.35)] focus:scale-105 font-data"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Budget Summary */}
          <div className={`mt-8 p-6 bg-[#FBF9F7] rounded-2xl border-2 ${errors.total ? 'border-[#DC3545]/50' : 'border-[#C4975A]/30'} relative overflow-hidden group hover:border-[#C4975A]/50 transition-all duration-500 animate-in fade-in slide-in-from-bottom duration-500`} style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-lg font-bold text-[#2C2417] flex items-center gap-2 font-brand">
                <TrendingUp size={20} className="text-[#C4975A] animate-bounce" style={{ animationDuration: '2s' }} />
                {t('components.totalBudget')}
              </span>
              <span className="text-3xl font-black text-[#C4975A] transition-all duration-300 group-hover:scale-110 font-data">
                {formatCurrency(calculateTotalBudget())}
              </span>
            </div>
            {errors.total && (
              <p className="text-red-500 text-xs mt-2">{errors.total}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#E8E2DB] px-8 py-5 flex items-center justify-end gap-3 bg-[#FBF9F7] rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-[#E8E2DB] rounded-xl font-semibold text-[#6B5D4F] bg-white hover:bg-[rgba(196,151,90,0.06)] hover:border-[rgba(196,151,90,0.35)] hover:text-[#A67B3D] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#C4975A] text-white rounded-xl font-semibold hover:bg-[#D4B082] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#C4975A]/20 hover:shadow-xl hover:shadow-[#C4975A]/30 relative overflow-hidden group"
          >
            <Save size={18} className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10 font-brand">{t('components.saveBudget')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal;
