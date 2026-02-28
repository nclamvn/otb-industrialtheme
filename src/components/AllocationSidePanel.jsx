'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, History, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AllocationSidePanel = ({ isOpen, onClose, validationIssues = [], versionHistory = [] }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('validation');

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const tabs = [
    { id: 'validation', label: t('components.validationIssues') || 'Validation', icon: AlertTriangle, count: validationIssues.length },
    { id: 'history', label: t('components.versionHistory') || 'History', icon: History, count: versionHistory.length },
  ];

  const severityColors = {
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#DC3545', icon: XCircle },
    warning: { bg: '#FFFBF5', border: '#FED7AA', text: '#D97706', icon: AlertTriangle },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', icon: CheckCircle },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white flex flex-col border-l border-[#E8E2DB]"
            style={{ boxShadow: '-8px 0 30px rgba(44,36,23,0.08)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E2DB]">
              <h3 className="text-base font-semibold font-brand text-[#2C2417]">
                {t('components.allocationDetails') || 'Allocation Details'}
              </h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F0EBE5] transition-colors">
                <X size={18} className="text-[#8C8178]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E8E2DB]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                    ${activeTab === tab.id
                      ? 'text-[#C4975A] border-b-2 border-[#C4975A]'
                      : 'text-[#8C8178] hover:text-[#6B5E54]'
                    }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                      ${activeTab === tab.id ? 'bg-[#C4975A] text-white' : 'bg-[#F0EBE5] text-[#6B5E54]'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'validation' && (
                <div className="space-y-3">
                  {validationIssues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-[#8C8178]">
                      <CheckCircle size={32} className="text-[#1B6B45] mb-2" />
                      <p className="text-sm font-medium">{t('components.noIssues') || 'No validation issues'}</p>
                    </div>
                  ) : (
                    validationIssues.map((issue, idx) => {
                      const colors = severityColors[issue.severity] || severityColors.info;
                      const Icon = colors.icon;
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border p-3"
                          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                        >
                          <div className="flex items-start gap-2">
                            <Icon size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.text }} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: colors.text }}>
                                {issue.title}
                              </p>
                              <p className="text-xs mt-0.5 text-[#6B5E54]">{issue.message}</p>
                              {issue.field && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-white/60 text-[#6B5E54]">
                                  {issue.field}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-0">
                  {versionHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-[#8C8178]">
                      <History size={32} className="mb-2" />
                      <p className="text-sm font-medium">{t('components.noHistory') || 'No version history'}</p>
                    </div>
                  ) : (
                    versionHistory.map((version, idx) => (
                      <div key={idx} className="flex gap-3 pb-4 relative">
                        {/* Timeline line */}
                        {idx < versionHistory.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#E8E2DB]" />
                        )}
                        {/* Dot */}
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5
                          ${idx === 0 ? 'bg-[#C4975A]' : 'bg-[#E8E2DB]'}`}>
                          <Clock size={10} className={idx === 0 ? 'text-white' : 'text-[#8C8178]'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#2C2417]">
                              {version.name || `v${version.version}`}
                            </span>
                            {idx === 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#C4975A]/10 text-[#C4975A]">
                                {t('common.latest') || 'Latest'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8C8178] mt-0.5">
                            {version.author} &middot; {new Date(version.date).toLocaleDateString()}
                          </p>
                          {version.comment && (
                            <p className="text-xs mt-1 text-[#6B5E54]">{version.comment}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AllocationSidePanel;
