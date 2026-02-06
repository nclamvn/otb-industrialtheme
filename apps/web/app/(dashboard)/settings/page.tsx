'use client';

import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { ROLE_LABELS, UserRole } from '@/types';
import { Sun, Moon, Monitor, User, Mail, Shield, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const t = useTranslations('pages.settings');
  const tSettings = useTranslations('settings');
  const tForms = useTranslations('forms');

  const themeOptions = [
    { id: 'light', label: 'Sáng', icon: Sun },
    { id: 'dark', label: 'Tối', icon: Moon },
    { id: 'system', label: 'Hệ thống', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Profile Card - Compact */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#D7B797] to-[#127749] flex items-center justify-center text-white text-lg font-bold">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{session?.user?.name || '-'}</h3>
              <p className="text-sm text-muted-foreground truncate">{session?.user?.email || '-'}</p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {ROLE_LABELS[session?.user?.role as UserRole] || session?.user?.role || '-'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection - Modern Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Giao diện</Label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setTheme(option.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all',
                  'hover:border-[#D7B797]/50 hover:bg-muted/50',
                  isActive
                    ? 'border-[#D7B797] bg-[#D7B797]/5'
                    : 'border-transparent bg-muted/30'
                )}
              >
                {/* Preview Box */}
                <div className={cn(
                  'w-full aspect-[4/3] rounded-lg overflow-hidden border',
                  option.id === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'
                )}>
                  <div className={cn(
                    'h-2 w-full',
                    option.id === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'
                  )} />
                  <div className="p-1.5 space-y-1">
                    <div className={cn(
                      'h-1 w-3/4 rounded-full',
                      option.id === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'
                    )} />
                    <div className={cn(
                      'h-1 w-1/2 rounded-full',
                      option.id === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'
                    )} />
                  </div>
                  {option.id === 'system' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full bg-gradient-to-br from-white/50 to-zinc-900/50 rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Icon className={cn(
                    'h-4 w-4',
                    isActive ? 'text-[#D7B797]' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-[#D7B797]' : 'text-muted-foreground'
                  )}>
                    {option.label}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#D7B797]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Cài đặt khác</Label>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/settings/ai"
            className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-[#D7B797]/50 transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-[#D7B797]/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[#D7B797]" />
            </div>
            <div>
              <p className="text-sm font-medium">Cài đặt AI</p>
              <p className="text-xs text-muted-foreground">API keys & models</p>
            </div>
          </Link>

          <Link
            href="/settings/profile"
            className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-[#D7B797]/50 transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Hồ sơ</p>
              <p className="text-xs text-muted-foreground">Thông tin cá nhân</p>
            </div>
          </Link>

          <Link
            href="/settings/api-keys"
            className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-[#D7B797]/50 transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">API Keys</p>
              <p className="text-xs text-muted-foreground">Quản lý access keys</p>
            </div>
          </Link>

          <Link
            href="/settings/integrations"
            className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-[#D7B797]/50 transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Tích hợp</p>
              <p className="text-xs text-muted-foreground">ERP, SSO, Webhooks</p>
            </div>
          </Link>
        </div>
      </div>

      {/* About - Minimal Footer */}
      <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>DAFC OTB Platform</span>
          <span>v1.0.0</span>
        </div>
        <span>© 2025 DAFC</span>
      </div>
    </div>
  );
}
