'use client';
import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const EmptyState = ({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction
}) => {
  const { t } = useLanguage();
  const resolvedTitle = title || t('components.emptyTitle');
  const resolvedMessage = message || t('components.emptyMessage');
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-[#2C2417]">
      <div className="p-6 rounded-full bg-[#FBF9F7] border border-[#E8E2DB] mb-4">
        <Icon size={40} className="text-[#8C8178]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{resolvedTitle}</h3>
      <p className="text-sm text-center max-w-md text-[#6B5D4F]">
        {resolvedMessage}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 bg-[#C4975A] hover:bg-[#D4B082] text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
