'use client';

import { useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const UnsavedChangesBanner = ({ isDirty, onSaveDraft, onDiscard, saving = false }) => {
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isDirty) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between border-t backdrop-blur-sm bg-white/95 border-[#D97706]/40">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#D97706] shrink-0" />
          <span className="text-xs font-medium text-[#6B4D30]">
            {t('planning.youHaveUnsavedChanges') || 'You have unsaved changes'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1 rounded text-xs font-medium transition-colors text-[#8C8178] hover:text-[#DC3545] hover:bg-red-50"
          >
            {t('planning.discard') || 'Discard'}
          </button>
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-colors bg-[rgba(27,107,69,0.12)] text-[#1B6B45] hover:bg-[rgba(27,107,69,0.2)]"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <Save size={12} />
            )}
            <span className="hidden md:inline">{t('planning.saveDraft') || 'Save Draft'}</span>
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl border shadow-2xl p-5 bg-white border-[#E8E2DB]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-[#DC3545]" />
              <h3 className="font-semibold font-brand text-[#2C2417]">
                {t('planning.discardChanges') || 'Discard Changes?'}
              </h3>
            </div>
            <p className="text-sm mb-4 text-[#8C8178]">
              {t('planning.discardChangesDesc') || 'All unsaved changes will be lost. This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors text-[#8C8178] hover:bg-[rgba(160,120,75,0.12)]"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => { setShowConfirm(false); onDiscard(); }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#DC3545] text-white hover:bg-[#DC3545]/90 transition-colors"
              >
                {t('planning.discard') || 'Discard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnsavedChangesBanner;
