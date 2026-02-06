'use client';

import React, { useState } from 'react';
import {
  Sun, Moon, Monitor, Globe, Bell, BellOff, Lock, Eye, EyeOff,
  Palette, Type, Zap, Database, HardDrive, Trash2, Download,
  ChevronRight, Check, Info, AlertTriangle
} from 'lucide-react';

const SettingsScreen = ({ darkMode = true, setDarkMode, user }) => {
  const [settings, setSettings] = useState({
    theme: darkMode ? 'dark' : 'light',
    language: 'vi',
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
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      if (key === 'theme') {
        setDarkMode && setDarkMode(value === 'dark');
      }
    }
  };

  const SettingSection = ({ title, description, children }) => (
    <div className={`rounded-xl border overflow-hidden ${
      darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-200'
    }`}>
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-100'}`}>
        <h3 className={`text-base font-semibold font-['Montserrat'] ${
          darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        {description && (
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
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
      } ${
        darkMode
          ? 'hover:bg-[rgba(215,183,151,0.05)]'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`}>
        <Icon size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
          {label}
        </div>
        {description && (
          <div className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
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
          ? 'bg-[#127749]'
          : darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-300'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );

  const ThemeOption = ({ value, icon: Icon, label, current }) => (
    <button
      onClick={() => updateSetting(null, 'theme', value)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        current === value
          ? darkMode
            ? 'border-[#D7B797] bg-[rgba(215,183,151,0.1)]'
            : 'border-[#8A6340] bg-[rgba(215,183,151,0.15)]'
          : darkMode
            ? 'border-[#2E2E2E] hover:border-[#3E3E3E]'
            : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon size={24} className={
        current === value
          ? darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'
          : darkMode ? 'text-[#666666]' : 'text-gray-600'
      } />
      <span className={`text-sm font-medium ${
        current === value
          ? darkMode ? 'text-[#D7B797]' : 'text-[#8A6340]'
          : darkMode ? 'text-[#999999]' : 'text-gray-600'
      }`}>
        {label}
      </span>
      {current === value && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-[#D7B797]' : 'bg-[#8A6340]'
        }`}>
          <Check size={12} className="text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className={`text-lg font-semibold font-['Montserrat'] ${
          darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
        }`}>
          Settings
        </h1>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
          Customize your app experience
        </p>
      </div>

      {/* Appearance */}
      <SettingSection title="Appearance" description="Customize how the app looks">
        <div className="p-3">
          <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${
            darkMode ? 'text-[#666666]' : 'text-gray-700'
          }`}>
            Theme
          </div>
          <div className="flex gap-3">
            <ThemeOption value="light" icon={Sun} label="Light" current={settings.theme} />
            <ThemeOption value="dark" icon={Moon} label="Dark" current={settings.theme} />
            <ThemeOption value="system" icon={Monitor} label="System" current={settings.theme} />
          </div>
        </div>

        <div className={`mx-3 h-px ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-100'}`} />

        <SettingRow
          icon={Zap}
          label="Animations"
          description="Enable smooth transitions and effects"
        >
          <Toggle
            enabled={settings.display.animationsEnabled}
            onChange={(v) => updateSetting('display', 'animationsEnabled', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Type}
          label="Compact Mode"
          description="Reduce spacing for more content"
        >
          <Toggle
            enabled={settings.display.compactMode}
            onChange={(v) => updateSetting('display', 'compactMode', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Language & Region */}
      <SettingSection title="Language & Region">
        <SettingRow
          icon={Globe}
          label="Language"
          description="Choose your preferred language"
        >
          <select
            value={settings.language}
            onChange={(e) => updateSetting(null, 'language', e.target.value)}
            className={`pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border outline-none cursor-pointer ${
              darkMode
                ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]'
                : 'bg-gray-100 border-gray-200 text-gray-900'
            }`}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications" description="Manage how you receive updates">
        <SettingRow
          icon={Bell}
          label="Email Notifications"
          description="Receive updates via email"
        >
          <Toggle
            enabled={settings.notifications.email}
            onChange={(v) => updateSetting('notifications', 'email', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          label="Push Notifications"
          description="Receive mobile push notifications"
        >
          <Toggle
            enabled={settings.notifications.push}
            onChange={(v) => updateSetting('notifications', 'push', v)}
          />
        </SettingRow>

        <SettingRow
          icon={BellOff}
          label="Desktop Notifications"
          description="Show browser notifications"
        >
          <Toggle
            enabled={settings.notifications.desktop}
            onChange={(v) => updateSetting('notifications', 'desktop', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Privacy */}
      <SettingSection title="Privacy" description="Control your visibility and data">
        <SettingRow
          icon={Eye}
          label="Show Online Status"
          description="Let others see when you're active"
        >
          <Toggle
            enabled={settings.privacy.showOnline}
            onChange={(v) => updateSetting('privacy', 'showOnline', v)}
          />
        </SettingRow>

        <SettingRow
          icon={EyeOff}
          label="Show Activity"
          description="Display your recent activity"
        >
          <Toggle
            enabled={settings.privacy.showActivity}
            onChange={(v) => updateSetting('privacy', 'showActivity', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Data & Storage */}
      <SettingSection title="Data & Storage">
        <SettingRow
          icon={Download}
          label="Export Data"
          description="Download all your data"
          onClick={() => alert('Export data feature coming soon')}
        >
          <ChevronRight size={18} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
        </SettingRow>

        <SettingRow
          icon={HardDrive}
          label="Clear Cache"
          description="Free up storage space"
          onClick={() => alert('Cache cleared!')}
        >
          <ChevronRight size={18} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
        </SettingRow>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title="Danger Zone">
        <SettingRow
          icon={Trash2}
          label="Delete Account"
          description="Permanently delete your account and all data"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              alert('Account deletion request submitted');
            }
          }}
        >
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            darkMode
              ? 'bg-[rgba(248,81,73,0.1)] text-[#FF7B72]'
              : 'bg-red-100 text-red-600'
          }`}>
            Irreversible
          </span>
        </SettingRow>
      </SettingSection>

      {/* App Info */}
      <div className={`rounded-xl border p-5 ${
        darkMode ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <img
            src="/dafc-logo.png"
            alt="DAFC"
            className="h-10 w-auto object-contain"
          />
          <div className="flex-1">
            <div className={`text-sm font-semibold font-['Montserrat'] ${
              darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
            }`}>
              OTB System
            </div>
            <div className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
              Version 1.0.0
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            darkMode
              ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]'
              : 'bg-green-100 text-green-700'
          }`}>
            <Check size={12} />
            Up to date
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
