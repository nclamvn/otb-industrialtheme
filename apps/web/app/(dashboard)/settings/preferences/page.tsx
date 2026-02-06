'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Globe,
  Bell,
  Table,
  LayoutDashboard,
  Save,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Preferences {
  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;

  // Notification Preferences
  emailNotifications: boolean;
  emailDigestFrequency: string;
  pushNotifications: boolean;
  notifyOnBudgetApproval: boolean;
  notifyOnOTBSubmission: boolean;
  notifyOnSKUValidation: boolean;
  notifyOnSLAWarning: boolean;

  // Table Preferences
  tablePageSize: number;
  showTableDensity: 'compact' | 'normal' | 'comfortable';
  defaultSortOrder: 'asc' | 'desc';

  // Dashboard Preferences
  showAIInsights: boolean;
  showActivityFeed: boolean;
  showQuickActions: boolean;
  dashboardRefreshInterval: number;
}

const defaultPreferences: Preferences = {
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Ho_Chi_Minh',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'en-US',

  emailNotifications: true,
  emailDigestFrequency: 'daily',
  pushNotifications: true,
  notifyOnBudgetApproval: true,
  notifyOnOTBSubmission: true,
  notifyOnSKUValidation: true,
  notifyOnSLAWarning: true,

  tablePageSize: 20,
  showTableDensity: 'normal',
  defaultSortOrder: 'desc',

  showAIInsights: true,
  showActivityFeed: true,
  showQuickActions: true,
  dashboardRefreshInterval: 30,
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tieng Viet' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const timezones = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2025)' },
];

const numberFormats = [
  { value: 'en-US', label: '1,234.56 (US)' },
  { value: 'de-DE', label: '1.234,56 (EU)' },
  { value: 'vi-VN', label: '1.234,56 (VN)' },
];

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const updatePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In real app, this would save to API/database
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    toast.success(tCommon('success'));
    setHasChanges(false);
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast.info(tCommon('reset'));
  };

  const ThemeIcon = preferences.theme === 'dark' ? Moon : preferences.theme === 'light' ? Sun : Monitor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {t('preferences')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('title')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {tCommon('reset')}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {tCommon('save')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">
            <ThemeIcon className="h-4 w-4 mr-2" />
            {t('appearance')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            {t('notifications')}
          </TabsTrigger>
          <TabsTrigger value="tables">
            <Table className="h-4 w-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('theme')}</CardTitle>
              <CardDescription>{t('appearance')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', icon: Sun, label: t('lightMode') },
                  { value: 'dark', icon: Moon, label: t('darkMode') },
                  { value: 'system', icon: Monitor, label: t('systemMode') },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => updatePreference('theme', value as Preferences['theme'])}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      preferences.theme === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
              <CardDescription>{t('preferences')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('language')}</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(v) => updatePreference('language', v)}
                  >
                    <SelectTrigger>
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('timezone')}</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(v) => updatePreference('timezone', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('dateFormat')}</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(v) => updatePreference('dateFormat', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((df) => (
                        <SelectItem key={df.value} value={df.value}>
                          {df.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('numberFormat')}</Label>
                  <Select
                    value={preferences.numberFormat}
                    onValueChange={(v) => updatePreference('numberFormat', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numberFormats.map((nf) => (
                        <SelectItem key={nf.value} value={nf.value}>
                          {nf.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('emailNotifications')}</CardTitle>
              <CardDescription>{t('notifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('emailNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notifications')}
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(v) => updatePreference('emailNotifications', v)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Email Digest Frequency</Label>
                <Select
                  value={preferences.emailDigestFrequency}
                  onValueChange={(v) => updatePreference('emailDigestFrequency', v)}
                  disabled={!preferences.emailNotifications}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('notifications')}</CardTitle>
              <CardDescription>{t('notifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'notifyOnBudgetApproval',
                  label: 'Budget Approvals',
                  description: 'When budgets are approved or rejected',
                },
                {
                  key: 'notifyOnOTBSubmission',
                  label: 'OTB Submissions',
                  description: 'When OTB plans are submitted for review',
                },
                {
                  key: 'notifyOnSKUValidation',
                  label: 'SKU Validation',
                  description: 'When SKU validation is complete',
                },
                {
                  key: 'notifyOnSLAWarning',
                  label: 'SLA Warnings',
                  description: 'When approval deadlines are approaching',
                },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={preferences[key as keyof Preferences] as boolean}
                    onCheckedChange={(v) =>
                      updatePreference(key as keyof Preferences, v as never)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('pushNotifications')}</CardTitle>
              <CardDescription>{t('notifications')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('pushNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('notifications')}
                  </p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(v) => updatePreference('pushNotifications', v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Display</CardTitle>
              <CardDescription>Configure table appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Page Size</Label>
                <Select
                  value={preferences.tablePageSize.toString()}
                  onValueChange={(v) => updatePreference('tablePageSize', parseInt(v))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Table Density</Label>
                <div className="grid grid-cols-3 gap-4">
                  {['compact', 'normal', 'comfortable'].map((density) => (
                    <button
                      key={density}
                      onClick={() =>
                        updatePreference(
                          'showTableDensity',
                          density as Preferences['showTableDensity']
                        )
                      }
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        preferences.showTableDensity === density
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-sm font-medium capitalize">{density}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Default Sort Order</Label>
                <Select
                  value={preferences.defaultSortOrder}
                  onValueChange={(v) =>
                    updatePreference('defaultSortOrder', v as 'asc' | 'desc')
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Widgets</CardTitle>
              <CardDescription>Choose which widgets to display on dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'showAIInsights',
                  label: 'AI Insights',
                  description: 'Show AI-powered insights and recommendations',
                },
                {
                  key: 'showActivityFeed',
                  label: 'Activity Feed',
                  description: 'Show recent activity and updates',
                },
                {
                  key: 'showQuickActions',
                  label: 'Quick Actions',
                  description: 'Show quick action shortcuts',
                },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={preferences[key as keyof Preferences] as boolean}
                    onCheckedChange={(v) =>
                      updatePreference(key as keyof Preferences, v as never)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto Refresh</CardTitle>
              <CardDescription>Configure dashboard data refresh interval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Refresh Interval</Label>
                <Select
                  value={preferences.dashboardRefreshInterval.toString()}
                  onValueChange={(v) =>
                    updatePreference('dashboardRefreshInterval', parseInt(v))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Disabled</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
