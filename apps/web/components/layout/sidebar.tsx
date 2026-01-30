'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Package,
  Database,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  CalendarDays,
  TrendingDown,
  Boxes,
  LineChart,
  LogOut,
  Settings,
  Layers,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { User, CreditCard, HelpCircle } from 'lucide-react';

// Main navigation items - Dashboard first, then OTB workflow
const navigation = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },         // Overview
  { key: 'budget', href: '/budget', icon: DollarSign },           // Step 1: Financial Budget
  { key: 'budgetFlow', href: '/budget-flow', icon: Layers },      // Budget Flow View
  { key: 'otb', href: '/otb-analysis', icon: TrendingUp },        // Step 2: OTB Analysis
  { key: 'sku', href: '/sku-proposal', icon: Package },           // Step 3: SKU Proposal
  { key: 'wssi', href: '/wssi', icon: CalendarDays },             // WSSI Planning
  { key: 'approvals', href: '/approvals', icon: CheckSquare },    // Approvals
  { key: 'settings', href: '/settings', icon: Settings },         // Settings
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
];

const operationsItems = [
  { key: 'clearance', href: '/clearance', icon: TrendingDown },
  { key: 'replenishment', href: '/replenishment', icon: Boxes },
  { key: 'forecasting', href: '/forecasting', icon: LineChart },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations('navigation');
  const tMasterData = useTranslations('masterData');
  const tAnalytics = useTranslations('analytics');
  const tSettings = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const tUi = useTranslations('ui');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [masterDataOpen, setMasterDataOpen] = useState(
    pathname.startsWith('/master-data')
  );
  const [analyticsOpen, setAnalyticsOpen] = useState(
    pathname.startsWith('/analytics')
  );
  const [aiOpen, setAiOpen] = useState(
    pathname.startsWith('/ai-') || pathname === '/predictive-alerts'
  );
  const [operationsOpen, setOperationsOpen] = useState(
    pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting'
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}>
        {/* Logo & Collapse Toggle */}
        <div className={cn(
          "h-12 flex items-center border-b border-border",
          collapsed ? "px-2 justify-center" : "px-3 justify-between"
        )}>
          {collapsed ? (
            /* Collapsed: Only show toggle button */
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                {tUi('expand')}
              </TooltipContent>
            </Tooltip>
          ) : (
            /* Expanded: Logo + Name + Toggle */
            <>
              <Link href="/" className="flex items-center justify-start">
                <Image
                  src="/logo.png"
                  alt="DAFC"
                  width={200}
                  height={107}
                  priority
                  unoptimized
                  style={{ width: '100px', height: 'auto' }}
                />
              </Link>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-2", collapsed ? "px-2" : "px-3")}>
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                    collapsed ? 'px-2.5 py-1.5 justify-center' : 'px-2.5 py-1.5',
                    isActive
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                  )}
                >
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                  )} />
                  {!collapsed && <span className="flex-1 uppercase font-semibold tracking-wide">{t(item.key)}</span>}
                </Link>
              );

              return (
                <li key={item.key}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        {t(item.key)}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}

            {/* Master Data Collapsible */}
            <li>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/master-data/brands"
                      className={cn(
                        'group flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                        pathname.startsWith('/master-data')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      <Database className={cn(
                        'h-5 w-5 flex-shrink-0',
                        pathname.startsWith('/master-data') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {t('masterData')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Collapsible open={masterDataOpen} onOpenChange={setMasterDataOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'group flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        pathname.startsWith('/master-data')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      {pathname.startsWith('/master-data') && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                      )}
                      <Database className={cn(
                        'h-5 w-5 flex-shrink-0',
                        pathname.startsWith('/master-data') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                      <span className="flex-1 text-left uppercase font-semibold tracking-wide">{t('masterData')}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground/70 transition-transform',
                          masterDataOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-0.5 space-y-0.5 pl-4">
                    {masterDataItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground/80 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white')} />
                          <span>{tMasterData(item.key)}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {/* Analytics Collapsible */}
            <li>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/analytics"
                      className={cn(
                        'group flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                        pathname.startsWith('/analytics')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      <BarChart3 className={cn(
                        'h-5 w-5 flex-shrink-0',
                        pathname.startsWith('/analytics') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {t('analytics')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'group flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        pathname.startsWith('/analytics')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      {pathname.startsWith('/analytics') && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                      )}
                      <BarChart3 className={cn(
                        'h-5 w-5 flex-shrink-0',
                        pathname.startsWith('/analytics') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                      <span className="flex-1 text-left uppercase font-semibold tracking-wide">{t('analytics')}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground/70 transition-transform',
                          analyticsOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-0.5 space-y-0.5 pl-4">
                    {analyticsItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground/80 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white')} />
                          <span>{tAnalytics(item.key)}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {/* AI Features Collapsible */}
            <li>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/ai-assistant"
                      className={cn(
                        'group flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                        (pathname.startsWith('/ai-') || pathname === '/predictive-alerts')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      <Bot className={cn(
                        'h-5 w-5 flex-shrink-0',
                        (pathname.startsWith('/ai-') || pathname === '/predictive-alerts') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    AI
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'group flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        (pathname.startsWith('/ai-') || pathname === '/predictive-alerts')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      {(pathname.startsWith('/ai-') || pathname === '/predictive-alerts') && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                      )}
                      <Bot className={cn(
                        'h-5 w-5 flex-shrink-0',
                        (pathname.startsWith('/ai-') || pathname === '/predictive-alerts') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                      <span className="flex-1 text-left uppercase font-semibold tracking-wide">AI</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground/70 transition-transform',
                          aiOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-0.5 space-y-0.5 pl-4">
                    {aiItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground/80 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white')} />
                          <span>{t(item.key)}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>

            {/* Operations Collapsible (Phase 3) */}
            <li>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/clearance"
                      className={cn(
                        'group flex items-center justify-center px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                        (pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      <TrendingDown className={cn(
                        'h-5 w-5 flex-shrink-0',
                        (pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {t('operations')}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'group flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        (pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting')
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:text-white'
                      )}
                    >
                      {(pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting') && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                      )}
                      <TrendingDown className={cn(
                        'h-5 w-5 flex-shrink-0',
                        (pathname === '/clearance' || pathname === '/replenishment' || pathname === '/forecasting') ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white'
                      )} />
                      <span className="flex-1 text-left uppercase font-semibold tracking-wide">{t('operations')}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted-foreground/70 transition-transform',
                          operationsOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-0.5 space-y-0.5 pl-4">
                    {operationsItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          className={cn(
                            'group flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground/80 dark:hover:text-white'
                          )}
                        >
                          <item.icon className={cn('h-4 w-4', isActive ? 'text-primary dark:text-primary-foreground' : 'text-muted-foreground/70 group-hover:text-foreground dark:group-hover:text-white')} />
                          <span>{t(item.key)}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>
          </ul>
        </nav>

        {/* User Section at Bottom */}
        {session?.user && (
          <div className={cn(
            "border-t border-border p-3",
            collapsed ? "flex justify-center" : ""
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {collapsed ? (
                  <button className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[hsl(30_43%_72%)] text-black font-semibold">
                        {session.user.name ? getInitials(session.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                ) : (
                  <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[hsl(30_43%_72%)] text-black font-semibold text-base">
                        {session.user.name ? getInitials(session.user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-base font-medium truncate">{session.user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64"
                align="start"
                side={collapsed ? "right" : "top"}
                sideOffset={4}
              >
                <DropdownMenuLabel className="font-normal py-2.5 px-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-base font-semibold leading-none">{session.user.name}</p>
                    <p className="text-sm leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="py-2.5 px-3 text-base">
                  <Link href="/settings/profile" className="cursor-pointer">
                    <User className="mr-2.5 h-5 w-5" />
                    <span>{tSettings('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2.5 px-3 text-base">
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2.5 h-5 w-5" />
                    <span>{tSettings('title')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2.5 px-3 text-base">
                  <Link href="/settings/billing" className="cursor-pointer">
                    <CreditCard className="mr-2.5 h-5 w-5" />
                    <span>{tSettings('billing')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2.5 px-3 text-base">
                  <Link href="/help" className="cursor-pointer">
                    <HelpCircle className="mr-2.5 h-5 w-5" />
                    <span>{t('help')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5 px-3 text-base"
                >
                  <LogOut className="mr-2.5 h-5 w-5" />
                  <span>{tAuth('logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
