'use client';

import React, { useState } from 'react';
import {
  Globe, Bell, BellOff, Lock, Eye, EyeOff,
  Type, Zap, Database, HardDrive, Trash2, Download,
  ChevronRight, Check, Info, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui';

const SettingsScreen = ({ user }) => {
  const { t, language, setLanguage } = useLanguage();
  const { isMobile } = useIsMobile();
  const { dialogProps, confirm } = useConfirmDialog();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      desktop: false,
    },
    privacy: {
      showOnline: true,
      showActivity: true,
    },
    display: {
      compactMode: false,
      animationsEnabled: true,
    }
  });

  const updateSetting = (category, key, value) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else if (key === 'language') {
      setLanguage(value);
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const SettingSection = ({ title, description, children }) => (
    <div className="rounded-xl border overflow-hidden border-[#E8E2DB] bg-white">
      <div className="px-3 md:px-5 py-3 md:py-4 border-b border-[#E8E2DB]">
        <h3 className="text-base font-semibold font-brand text-[#2C2417]">
          {title}
        </h3>
        {description && (
          <p className="text-xs mt-0.5 text-[#6B5D4F]">
            {description}
          </p>
        )}
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, children, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
        onClick ? 'cursor-pointer' : ''
      } hover:bg-[#FBF9F7]`}
    >
      <div className="p-2 rounded-lg bg-[#FBF9F7]">
        <Icon size={18} className="text-[#C4975A]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#2C2417]">
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5 text-[#6B5D4F]">
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
        enabled
          ? 'bg-[#1B6B45]'
          : 'bg-[#D4CBBC]'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-semibold font-brand text-[#2C2417]">
          {t('settings.title')}
        </h1>
        <p className="text-xs mt-0.5 text-[#6B5D4F]">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Appearance */}
      <SettingSection title={t('settings.appearance')} description={t('settings.customizeAppLooks')}>
        <SettingRow
          icon={Zap}
          label={t('settings.animations')}
          description={t('settings.animationsDesc')}
        >
          <Toggle
            enabled={settings.display.animationsEnabled}
            onChange={(v) => updateSetting('display', 'animationsEnabled', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Type}
          label={t('settings.compactMode')}
          description={t('settings.compactModeDesc')}
        >
          <Toggle
            enabled={settings.display.compactMode}
            onChange={(v) => updateSetting('display', 'compactMode', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Language & Region */}
      <SettingSection title={t('settings.languageAndRegion')}>
        <SettingRow
          icon={Globe}
          label={t('settings.language')}
          description={t('settings.chooseLanguage')}
        >
          <select
            value={language}
            onChange={(e) => updateSetting(null, 'language', e.target.value)}
            className="pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border outline-none cursor-pointer bg-[#FBF9F7] border-[#E8E2DB] text-[#2C2417]"
          >
            <option value="vi">{t('settings.vietnamese')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title={t('settings.notifications')} description={t('settings.manageUpdates')}>
        <SettingRow
          icon={Bell}
          label={t('settings.emailNotifications')}
          description={t('settings.emailNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.email}
            onChange={(v) => updateSetting('notifications', 'email', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          label={t('settings.pushNotifications')}
          description={t('settings.pushNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.push}
            onChange={(v) => updateSetting('notifications', 'push', v)}
          />
        </SettingRow>

        <SettingRow
          icon={BellOff}
          label={t('settings.desktopNotifications')}
          description={t('settings.desktopNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.desktop}
            onChange={(v) => updateSetting('notifications', 'desktop', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Privacy */}
      <SettingSection title={t('settings.privacy')} description={t('settings.controlVisibility')}>
        <SettingRow
          icon={Eye}
          label={t('settings.showOnlineStatus')}
          description={t('settings.showOnlineStatusDesc')}
        >
          <Toggle
            enabled={settings.privacy.showOnline}
            onChange={(v) => updateSetting('privacy', 'showOnline', v)}
          />
        </SettingRow>

        <SettingRow
          icon={EyeOff}
          label={t('settings.showActivity')}
          description={t('settings.showActivityDesc')}
        >
          <Toggle
            enabled={settings.privacy.showActivity}
            onChange={(v) => updateSetting('privacy', 'showActivity', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Data & Storage */}
      <SettingSection title={t('settings.dataAndStorage')}>
        <SettingRow
          icon={Download}
          label={t('settings.exportData')}
          description={t('settings.exportDataDesc')}
          onClick={() => toast(t('settings.exportComingSoon'))}
        >
          <ChevronRight size={18} className="text-[#8C8178]" />
        </SettingRow>

        <SettingRow
          icon={HardDrive}
          label={t('settings.clearCache')}
          description={t('settings.clearCacheDesc')}
          onClick={() => toast.success(t('settings.cacheCleared'))}
        >
          <ChevronRight size={18} className="text-[#8C8178]" />
        </SettingRow>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title={t('settings.dangerZone')}>
        <SettingRow
          icon={Trash2}
          label={t('settings.deleteAccount')}
          description={t('settings.deleteAccountDesc')}
          onClick={() => {
            confirm({
              title: t('settings.deleteAccount'),
              message: t('settings.deleteConfirm'),
              confirmLabel: t('common.delete'),
              variant: 'danger',
              onConfirm: () => toast.success(t('settings.accountDeletionSubmitted')),
            });
          }}
        >
          <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-[#DC3545]">
            {t('common.irreversible')}
          </span>
        </SettingRow>
      </SettingSection>

      {/* App Info */}
      <div className="rounded-xl border p-3 md:p-5 bg-[#FBF9F7] border-[#E8E2DB]">
        <div className="flex items-center gap-3">
          <img
            src="/dafc-logo.png"
            alt="DAFC"
            className="h-10 w-auto object-contain"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold font-brand text-[#2C2417]">
              {t('settings.otbSystem')}
            </div>
            <div className="text-xs text-[#6B5D4F]">
              {t('settings.versionLabel')}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-green-100 text-[#1B6B45]">
            <Check size={12} />
            {t('settings.upToDate')}
          </div>
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default SettingsScreen;
