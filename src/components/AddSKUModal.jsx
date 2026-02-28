'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Package, ChevronRight, ChevronLeft, Check, Minus, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AddSKUModal = ({
  isOpen,
  onClose,
  onSubmit,
  availableSKUs = [],
  stores = [],
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSKUs, setSelectedSKUs] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearch('');
      setSelectedSKUs([]);
      setConfig({});
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const filteredSKUs = useMemo(() => {
    if (!search.trim()) return availableSKUs;
    const q = search.toLowerCase();
    return availableSKUs.filter(
      (sku) =>
        sku.code?.toLowerCase().includes(q) ||
        sku.name?.toLowerCase().includes(q) ||
        sku.category?.toLowerCase().includes(q)
    );
  }, [availableSKUs, search]);

  const toggleSKU = useCallback((sku) => {
    setSelectedSKUs((prev) => {
      const exists = prev.find((s) => s.id === sku.id);
      if (exists) return prev.filter((s) => s.id !== sku.id);
      return [...prev, sku];
    });
  }, []);

  const updateConfig = useCallback((skuId, storeId, qty) => {
    setConfig((prev) => ({
      ...prev,
      [skuId]: {
        ...(prev[skuId] || {}),
        [storeId]: Math.max(0, qty),
      },
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const result = selectedSKUs.map((sku) => ({
      sku,
      allocations: stores.map((store) => ({
        storeId: store.id,
        storeName: store.name,
        quantity: config[sku.id]?.[store.id] || 0,
      })).filter((a) => a.quantity > 0),
    }));
    onSubmit?.(result);
    onClose();
  }, [selectedSKUs, stores, config, onSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-[#E8E2DB]"
        style={{ boxShadow: '0 16px 48px rgba(44,36,23,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2DB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(27,107,69,0.1)' }}>
              <Package size={16} style={{ color: '#1B6B45' }} />
            </div>
            <div>
              <h3 className="text-base font-semibold font-brand text-[#2C2417]">
                {t('components.addSKU') || 'Add SKU'}
              </h3>
              <p className="text-xs text-[#8C8178]">
                {t('common.step') || 'Step'} {step}/2 — {step === 1
                  ? (t('components.selectSKUs') || 'Select SKUs')
                  : (t('components.configureQty') || 'Configure quantities')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F0EBE5] transition-colors">
            <X size={18} className="text-[#8C8178]" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[#F0EBE5] bg-[#FAF8F5]">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 1 ? 'text-[#C4975A]' : 'text-[#8C8178]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${step >= 1 ? 'bg-[#C4975A] text-white' : 'bg-[#E8E2DB] text-[#8C8178]'}`}>1</span>
            {t('components.selectSKUs') || 'Select'}
          </div>
          <ChevronRight size={12} className="text-[#D4CBBC]" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 2 ? 'text-[#C4975A]' : 'text-[#8C8178]'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${step >= 2 ? 'bg-[#C4975A] text-white' : 'bg-[#E8E2DB] text-[#8C8178]'}`}>2</span>
            {t('components.configureQty') || 'Configure'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border mb-3 border-[#E8E2DB] bg-[#FAF8F5]">
                <Search size={16} className="text-[#8C8178]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('components.searchSKU') || 'Search by code, name, or category...'}
                  className="flex-1 bg-transparent text-sm outline-none text-[#2C2417] placeholder:text-[#B0A89F]"
                />
              </div>
              <div className="space-y-2">
                {filteredSKUs.map((sku) => {
                  const isSelected = selectedSKUs.some((s) => s.id === sku.id);
                  return (
                    <button
                      key={sku.id}
                      onClick={() => toggleSKU(sku)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors
                        ${isSelected
                          ? 'border-[#C4975A] bg-[#FFFBF5]'
                          : 'border-[#E8E2DB] hover:border-[#D4CBBC] bg-white'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-[#C4975A] bg-[#C4975A]' : 'border-[#D4CBBC]'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#2C2417]">{sku.code}</span>
                          {sku.category && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F0EBE5] text-[#6B5E54]">
                              {sku.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8C8178] truncate">{sku.name}</p>
                      </div>
                    </button>
                  );
                })}
                {filteredSKUs.length === 0 && (
                  <p className="text-center text-sm text-[#8C8178] py-6">
                    {t('common.noResults') || 'No SKUs found'}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {selectedSKUs.map((sku) => (
                <div key={sku.id} className="rounded-xl border border-[#E8E2DB] overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E8E2DB]">
                    <span className="text-sm font-medium text-[#2C2417]">{sku.code}</span>
                    <span className="text-xs text-[#8C8178] ml-2">{sku.name}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {stores.map((store) => (
                      <div key={store.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-[#6B5E54] truncate flex-1">{store.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateConfig(sku.id, store.id, (config[sku.id]?.[store.id] || 0) - 1)}
                            className="w-7 h-7 rounded-md flex items-center justify-center border border-[#E8E2DB] hover:bg-[#F0EBE5]"
                          >
                            <Minus size={12} className="text-[#6B5E54]" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={config[sku.id]?.[store.id] || 0}
                            onChange={(e) => updateConfig(sku.id, store.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-center text-sm py-1 rounded-md border border-[#E8E2DB] outline-none focus:border-[#C4975A] text-[#2C2417]"
                          />
                          <button
                            onClick={() => updateConfig(sku.id, store.id, (config[sku.id]?.[store.id] || 0) + 1)}
                            className="w-7 h-7 rounded-md flex items-center justify-center border border-[#E8E2DB] hover:bg-[#F0EBE5]"
                          >
                            <Plus size={12} className="text-[#6B5E54]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E2DB] bg-[#FAF8F5] rounded-b-2xl">
          <span className="text-xs text-[#8C8178]">
            {selectedSKUs.length} SKU(s) {t('common.selected') || 'selected'}
          </span>
          <div className="flex gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-[#6B5E54] hover:bg-[#F0EBE5]"
              >
                <ChevronLeft size={14} />
                {t('common.back') || 'Back'}
              </button>
            )}
            {step === 1 ? (
              <button
                disabled={selectedSKUs.length === 0}
                onClick={() => setStep(2)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-[#C4975A] hover:bg-[#B08650] disabled:opacity-50"
              >
                {t('common.next') || 'Next'}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors bg-[#1B6B45] hover:bg-[#155936]"
              >
                {t('components.addSKUs') || 'Add SKUs'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSKUModal;
