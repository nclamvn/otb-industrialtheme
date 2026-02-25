'use client';
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ErrorMessage = ({ message, onRetry }) => {
  const { t } = useLanguage();
  const resolvedMessage = message || t('components.errorMessage');
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-[#2C2417]">
      <div className="p-4 rounded-full bg-red-50 mb-4">
        <AlertCircle size={32} className="text-[#DC3545]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('components.errorTitle')}</h3>
      <p className="text-sm text-center max-w-md text-[#6B5D4F]">
        {resolvedMessage}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-[#FBF9F7] border border-[#E8E2DB] hover:bg-[#F0EBE5] text-[#2C2417]"
        >
          <RefreshCw size={16} />
          {t('components.tryAgain')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
