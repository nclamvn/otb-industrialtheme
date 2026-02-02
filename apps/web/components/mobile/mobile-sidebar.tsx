'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SlidePanel } from './slide-panel';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Package,
  Database,
  ChevronDown,
  Building2,
  FolderTree,
  MapPin,
  Users,
  CheckSquare,
  BarChart3,
  Target,
  Brain,
  Calculator,
  GitCompare,
  Sparkles,
  FileText,
  Bot,
  Lightbulb,
  Wand2,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Plug,
  Key,
  Upload,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, CreditCard } from 'lucide-react';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  locale?: string;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const t = useTranslations('navigation');
  const tSettings = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const tMasterData = useTranslations('masterData');
  const tAnalytics = useTranslations('analytics');
  const pathname = usePathname();
  const { data: session } = useSession();

  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Navigation items
  const navigation = [
    { key: 'dashboard', href: '/', icon: LayoutDashboard },
    { key: 'budget', href: '/budget', icon: DollarSign },
    { key: 'otb', href: '/otb-analysis', icon: TrendingUp },
    { key: 'sku', href: '/sku-proposal', icon: Package },
    { key: 'approvals', href: '/approvals', icon: CheckSquare },
  ];

  const masterDataItems = [
    { key: 'brands', href: '/master-data/brands', icon: Building2 },
    { key: 'categories', href: '/master-data/categories', icon: FolderTree },
    { key: 'locations', href: '/master-data/locations', icon: MapPin },
    { key: 'users', href: '/master-data/users', icon: Users },
  ];

  const analyticsItems = [
    { key: 'overview', href: '/analytics', icon: BarChart3 },
    { key: 'kpiDashboard', href: '/analytics/kpi', icon: Target },
    { key: 'forecast', href: '/analytics/forecast', icon: Brain },
    { key: 'simulator', href: '/analytics/simulator', icon: Calculator },
    { key: 'comparison', href: '/analytics/comparison', icon: GitCompare },
    { key: 'insights', href: '/analytics/insights', icon: Sparkles },
    { key: 'customReport', href: '/analytics/reports', icon: FileText },
  ];

  const aiItems = [
    { key: 'aiAssistant', href: '/ai-assistant', icon: Bot },
    { key: 'suggestions', href: '/ai-suggestions', icon: Lightbulb },
    { key: 'autoPlan', href: '/ai-auto-plan', icon: Wand2 },
    { key: 'predictiveAlerts', href: '/predictive-alerts', icon: Bell },
    { key: 'aiImport', href: '/import', icon: Upload },
    { key: 'importedData', href: '/import/data', icon: Database },
  ];

  const bottomItems = [
    { key: 'aiSettings', href: '/settings/ai', icon: Sparkles },
    { key: 'integrations', href: '/settings/integrations', icon: Plug },
    { key: 'apiKeys', href: '/settings/api-keys', icon: Key },
    { key: 'settings', href: '/settings', icon: Settings },
    { key: 'help', href: '/help', icon: HelpCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const NavLink = ({ href, icon: Icon, label, onClick }: {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
    onClick?: () => void;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => {
          onClick?.();
          onClose();
        }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <SlidePanel open={open} onClose={onClose} side="left">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Link href="/" onClick={onClose} className="flex items-center justify-start">
            <Image
              src="/logo.png"
              alt="DAFC"
              width={200}
              height={107}
              priority
              unoptimized
              style={{ width: '90px', height: 'auto' }}
            />
          </Link>
        </div>

        {/* User info */}
        {session?.user && (
          <div className="px-4 py-3 border-b bg-muted/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
                  <div className="h-10 w-10 rounded-full bg-[hsl(30_43%_72%)] flex items-center justify-center text-black font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="bottom" sideOffset={8}>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" onClick={onClose} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{tSettings('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" onClick={onClose} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{tSettings('title')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/billing" onClick={onClose} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>{tSettings('billing')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/help" onClick={onClose} className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>{t('help')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{tAuth('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Main navigation */}
          {navigation.map((item) => (
            <NavLink
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={t(item.key)}
            />
          ))}

          {/* Master Data */}
          <Collapsible open={masterDataOpen} onOpenChange={setMasterDataOpen}>
            <CollapsibleTrigger className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground w-full">
              <Database className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{t('masterData')}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', masterDataOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20">
              {masterDataItems.map((item) => (
                <NavLink
                  key={item.key}
                  href={item.href}
                  icon={item.icon}
                  label={tMasterData(item.key)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Analytics */}
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <CollapsibleTrigger className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground w-full">
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">{t('analytics')}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', analyticsOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20">
              {analyticsItems.map((item) => (
                <NavLink
                  key={item.key}
                  href={item.href}
                  icon={item.icon}
                  label={tAnalytics(item.key)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* AI Features */}
          <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
            <CollapsibleTrigger className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground w-full">
              <Bot className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left uppercase font-semibold">{t('aiFeatures')}</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', aiOpen && 'rotate-180')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20">
              {aiItems.map((item) => (
                <NavLink
                  key={item.key}
                  href={item.href}
                  icon={item.icon}
                  label={t(item.key) || item.key}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Divider */}
          <div className="my-2 border-t" />

          {/* Bottom items */}
          {bottomItems.map((item) => (
            <NavLink
              key={item.key}
              href={item.href}
              icon={item.icon}
              label={t(item.key)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          {/* Language switcher */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{tSettings('language')}</span>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </div>
    </SlidePanel>
  );
}
