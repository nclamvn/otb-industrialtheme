'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { aiService } from '../../services/aiService';
import { ROUTE_MAP } from '@/utils/routeMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppContext } from '@/contexts/AppContext';
import {
  Wallet,
  DollarSign,
  BarChart3,
  Package,
  FileText,
  Ticket,
  FileCheck,
  ShoppingCart,
  Receipt,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Bell,
  XCircle,
  ChevronRight,
  Sparkles,
  Home,
  Search,
  Command,
  User,
  Settings,
  Save,
  ChevronDown,
  Layers,
  LineChart,
  PieChart,
  Activity,
  Printer
} from 'lucide-react';
import { normalize as viNormalize } from '../../utils/normalizeVietnamese';

// Screen configuration builder (uses t() for translations)
const getScreenConfig = (t) => ({
  'home': {
    label: t('screenConfig.dashboard'),
    shortLabel: 'Home',
    icon: Home,
    step: null,
    kpiLabel: t('header.kpiOverview'),
    kpiDescription: t('header.kpiSystemOverview')
  },
  'budget-management': {
    label: t('screenConfig.budgetManagement'),
    shortLabel: t('budget.title'),
    icon: Wallet,
    step: 1,
    kpiLabel: t('header.kpiBudgets'),
    kpiDescription: t('header.kpiBudgetsDesc')
  },
  'planning': {
    label: t('screenConfig.budgetAllocation'),
    shortLabel: t('header.kpiAllocated'),
    icon: DollarSign,
    step: 2,
    kpiLabel: t('header.kpiAllocated'),
    kpiDescription: t('header.kpiAllocatedDesc')
  },
  'otb-analysis': {
    label: t('screenConfig.otbAnalysis'),
    shortLabel: 'OTB',
    icon: BarChart3,
    step: 3,
    kpiLabel: t('header.kpiAnalyzed'),
    kpiDescription: t('header.kpiAnalyzedDesc')
  },
  'proposal': {
    label: t('screenConfig.skuProposal'),
    shortLabel: 'SKU',
    icon: Package,
    step: 4,
    kpiLabel: t('header.kpiSKUs'),
    kpiDescription: t('header.kpiSKUsDesc')
  },
  'dev-ticket': {
    label: t('screenConfig.devTicket'),
    shortLabel: 'Dev',
    icon: FileText,
    step: null,
    kpiLabel: t('header.kpiPages'),
    kpiDescription: t('header.kpiDocumentation')
  },
  'tickets': {
    label: t('screenConfig.tickets'),
    shortLabel: t('screenConfig.tickets'),
    icon: Ticket,
    step: 5,
    kpiLabel: t('header.kpiTicket'),
    kpiDescription: t('header.kpiTicketsPending')
  },
  'ticket-detail': {
    label: t('screenConfig.ticketDetail'),
    shortLabel: t('screenConfig.ticketDetail'),
    icon: Ticket,
    step: null,
    kpiLabel: t('header.kpiPending'),
    kpiDescription: t('header.kpiTicketsPending')
  },
  'approvals': {
    label: t('screenConfig.approvals'),
    shortLabel: t('screenConfig.approvals'),
    icon: FileCheck,
    step: null,
    kpiLabel: t('header.kpiPending'),
    kpiDescription: t('header.kpiAwaitingApproval')
  },
  'order-confirmation': {
    label: t('screenConfig.orderConfirmation'),
    shortLabel: t('header.kpiOrders'),
    icon: ShoppingCart,
    step: null,
    kpiLabel: t('header.kpiOrders'),
    kpiDescription: t('header.kpiOrdersConfirm')
  },
  'receipt-confirmation': {
    label: t('screenConfig.receiptConfirmation'),
    shortLabel: t('header.kpiReceipts'),
    icon: Receipt,
    step: null,
    kpiLabel: t('header.kpiReceipts'),
    kpiDescription: t('header.kpiReceiptsConfirm')
  },
  'profile': {
    label: t('screenConfig.myProfile'),
    shortLabel: t('header.kpiProfile'),
    icon: User,
    step: null,
    kpiLabel: t('header.kpiProfile'),
    kpiDescription: t('header.kpiUserProfile')
  },
  'settings': {
    label: t('screenConfig.settings'),
    shortLabel: t('header.kpiSettings'),
    icon: Settings,
    step: null,
    kpiLabel: t('header.kpiSettings'),
    kpiDescription: t('header.kpiAppSettings')
  },
  'analytics-sales': {
    label: t('analytics.salesPerformance', 'Sales Performance'),
    shortLabel: 'Sales',
    icon: LineChart,
    step: null,
    kpiLabel: t('analytics.salesPerformance', 'Sales'),
    kpiDescription: t('analytics.salesDesc', 'SKU performance analysis')
  },
  'analytics-budget': {
    label: t('analytics.budgetAnalytics', 'Budget Analytics'),
    shortLabel: 'Budget',
    icon: PieChart,
    step: null,
    kpiLabel: t('analytics.budgetAnalytics', 'Budget'),
    kpiDescription: t('analytics.budgetDesc', 'Budget utilization trends')
  },
  'analytics-trends': {
    label: t('analytics.categoryTrends', 'Category Trends'),
    shortLabel: 'Trends',
    icon: Activity,
    step: null,
    kpiLabel: t('analytics.categoryTrends', 'Trends'),
    kpiDescription: t('analytics.trendsDesc', 'Attribute trends and YoY comparison')
  }
});

// Planning workflow steps
const PLANNING_STEPS = [
  { id: 'budget-management', step: 1 },
  { id: 'planning', step: 2 },
  { id: 'otb-analysis', step: 3 },
  { id: 'proposal', step: 4 },
  { id: 'tickets', step: 5 }
];

const getAlertIcon = (severity) => {
  switch (severity) {
    case 'critical':
      return <XCircle size={14} className="text-status-critical" />;
    case 'warning':
      return <Clock size={14} className="text-status-warning" />;
    case 'info':
      return <CheckCircle size={14} className="text-status-success" />;
    default:
      return <Bell size={14} className="text-dafc-gold" />;
  }
};

const AppHeader = ({
  currentScreen,
  darkMode = true,
  setDarkMode,
  kpiData = {},
  isMobile = false,
  user,
  onLogout,
}) => {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { triggerSave, hasSaveHandler } = useAppContext();
  const SCREEN_CONFIG = useMemo(() => getScreenConfig(t), [t]);
  const onNavigate = (screenId) => {
    const route = ROUTE_MAP[screenId];
    if (route) {
      router.push(route);
    }
  };
  const currentConfig = SCREEN_CONFIG[currentScreen] || SCREEN_CONFIG['home'];
  const CurrentIcon = currentConfig.icon || Home;

  const [showNotifications, setShowNotifications] = useState(false);
  const [openSaveMenu, setOpenSaveMenu] = useState(false);
  const saveButtonRef = useRef(null);
  const [saveMenuPosition, setSaveMenuPosition] = useState({ top: 0, right: 0 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Search results from screen config
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = viNormalize(searchQuery);
    return Object.entries(SCREEN_CONFIG)
      .filter(([id, cfg]) => {
        const label = viNormalize(cfg.label || '');
        const shortLabel = viNormalize(cfg.shortLabel || '');
        return label.includes(q) || shortLabel.includes(q) || id.includes(q);
      })
      .map(([id, cfg]) => ({ id, ...cfg }))
      .slice(0, 8);
  }, [searchQuery, SCREEN_CONFIG]);

  // Budget alerts state
  const [budgetAlerts, setBudgetAlerts] = useState([]);

  const fetchBudgetAlerts = useCallback(async () => {
    try {
      const data = await aiService.getBudgetAlerts({ unreadOnly: true });
      setBudgetAlerts(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — alerts are non-critical
    }
  }, []);

  useEffect(() => {
    fetchBudgetAlerts();
    const interval = setInterval(fetchBudgetAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBudgetAlerts]);

  const hasCritical = budgetAlerts.some(a => a.severity === 'critical');

  const isInPlanningWorkflow = PLANNING_STEPS.some(s => s.id === currentScreen);
  const currentStepIndex = PLANNING_STEPS.findIndex(s => s.id === currentScreen);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
        setSearchQuery('');
      }
      if (saveButtonRef.current && !saveButtonRef.current.contains(event.target)) {
        setOpenSaveMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setShowNotifications(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="z-40 bg-canvas">
      {/* Main Header — blends with page bg, no bottom border */}
      <div className={`${isMobile ? 'px-3' : 'px-5'} py-1.5 flex items-center justify-between`}>
        {/* Left - Page Title — bare icon, larger text */}
        <div className="flex items-center gap-2.5">
          <CurrentIcon size={16} strokeWidth={2} className="text-dafc-gold" />

          {/* Title & Breadcrumb */}
          <div>
            <h1 className="text-sm font-semibold font-brand tracking-tight text-content">
              {currentConfig.label || 'Dashboard'}
            </h1>
            {currentConfig.step && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-content-muted">{t('header.planningBreadcrumb')}</span>
                <ChevronRight size={10} className="text-border" />
                <span className="text-[10px] font-medium text-content-secondary">
                  {currentConfig.shortLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right - Ghost Actions */}
        <div className="flex items-center gap-1">
          {/* Search — ghost, icon + Cmd+K hint */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 text-content-muted hover:text-content-secondary"
            >
              <Search size={15} />
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-data bg-surface-secondary text-content-muted">
                <Command size={8} />K
              </kbd>
            </button>

            {/* Search Modal */}
            {showSearch && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-96 rounded-2xl shadow-lg border overflow-hidden z-[9999] bg-white border-border-muted">
                <div className="p-3 border-b border-border-muted">
                  <div className="flex items-center gap-3">
                    <Search size={18} className="text-content-secondary" />
                    <input
                      type="text"
                      placeholder={t('header.searchScreens')}
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResults.length > 0) {
                          onNavigate(searchResults[0].id);
                          setShowSearch(false);
                          setSearchQuery('');
                        }
                      }}
                      className="flex-1 bg-transparent text-sm outline-none text-content placeholder:text-content-muted"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="p-0.5 rounded text-content-muted hover:text-content-secondary">
                        <span className="text-xs">{t('common.clearAll') || 'Clear'}</span>
                      </button>
                    )}
                  </div>
                </div>
                {/* Search Results */}
                {searchQuery.trim() && searchResults.length > 0 ? (
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {searchResults.map((result) => {
                      const ResultIcon = result.icon || Home;
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            onNavigate(result.id);
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-secondary text-content"
                        >
                          <ResultIcon size={16} className="text-dafc-gold" />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium font-brand">{result.label}</div>
                            {result.step && (
                              <div className="text-xs text-content-muted">Step {result.step}</div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-border" />
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-6 text-center text-sm text-content-muted">
                    {t('common.noResults') || 'No results found'}
                  </div>
                ) : (
                  <div className="p-2 text-center text-xs text-content-secondary">
                    {t('header.typeToSearch')} <kbd className="px-1 py-0.5 rounded bg-surface-secondary text-content-secondary border border-border-muted">ESC</kbd> {t('header.toClose')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Toggle — plain text ghost */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all duration-200 text-content-muted hover:text-dafc-gold-darker"
            title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
            aria-label={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
          >
            <span className="text-[11px] font-bold font-data">
              {language === 'en' ? 'EN' : 'VN'}
            </span>
          </button>

          {/* Notification Bell — ghost, small dot instead of numbered badge */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-1.5 rounded-lg transition-all duration-200 ${
                showNotifications
                  ? 'text-dafc-gold'
                  : 'text-content-muted hover:text-content-secondary'
              }`}
            >
              <Bell size={16} strokeWidth={2} />
              {/* Notification count badge */}
              {budgetAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 ${
                  hasCritical ? 'bg-status-critical' : 'bg-red-500'
                } text-white text-[10px] font-data font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none`}>
                  {budgetAlerts.length > 99 ? '99+' : budgetAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border overflow-hidden z-50 bg-white border-border-muted shadow-lg">

                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between border-border-muted bg-surface-secondary">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-dafc-gold" />
                    <h3 className="text-sm font-semibold font-brand text-content">
                      {t('header.budgetAlerts')}
                    </h3>
                  </div>
                </div>

                {/* Alert List */}
                <div className="max-h-80 overflow-y-auto">
                  {budgetAlerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-content-muted">
                      {t('header.noAlerts')}
                    </div>
                  ) : (
                    budgetAlerts.slice(0, 8).map((alert, idx) => (
                      <div
                        key={alert.id}
                        className={`px-4 py-3 flex gap-3 cursor-pointer transition-all duration-200 border-l-2 hover:bg-surface-secondary border-transparent hover:border-dafc-gold ${idx !== Math.min(budgetAlerts.length, 8) - 1 ? 'border-b border-b-border-muted' : ''}`}
                      >
                        <div className="mt-0.5">
                          {getAlertIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-content">
                            {alert.title}
                          </div>
                          <div className="text-xs mt-0.5 line-clamp-2 text-content-secondary">
                            {alert.message}
                          </div>
                          {alert.budget && (
                            <div className="text-[10px] font-data mt-1.5 text-content-muted">
                              {alert.budget.groupBrand?.name} — {alert.budget.budgetCode}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border-muted bg-surface-secondary">
                  <button className="w-full text-center text-xs font-semibold font-brand text-dafc-gold hover:text-dafc-gold-dark transition-colors py-1">
                    {t('header.viewAllAlerts')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Print + Save — planning workflow only */}
          {isInPlanningWorkflow && currentScreen !== 'tickets' && currentScreen !== 'ticket-detail' && (
          <>
            <div className="w-px h-4 mx-1 bg-border-muted" />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="no-print p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors text-content-muted hover:text-content-secondary"
                title={t('common.print')}
                aria-label={t('common.print')}
              >
                <Printer size={14} />
              </button>
              <div className="relative" ref={saveButtonRef}>
                <div className="inline-flex items-stretch rounded-xl overflow-hidden">
                  <button
                    onClick={async () => {
                      if (hasSaveHandler) {
                        await triggerSave();
                      }
                    }}
                    disabled={!hasSaveHandler}
                    className={`flex items-center px-3 py-1.5 transition-colors ${hasSaveHandler ? 'bg-dafc-gold text-white hover:bg-dafc-gold-dark' : 'bg-dafc-gold/50 text-white/70 cursor-not-allowed'}`}
                    title={t('header.save')}
                  >
                    <Save size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (!openSaveMenu && saveButtonRef.current) {
                        const rect = saveButtonRef.current.getBoundingClientRect();
                        setSaveMenuPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                      }
                      setOpenSaveMenu(!openSaveMenu);
                    }}
                    className="flex items-center px-1.5 py-1.5 border-l border-white/20 transition-colors bg-dafc-gold text-white hover:bg-dafc-gold-dark"
                  >
                    <ChevronDown size={12} className={`transition-transform ${openSaveMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </>
          )}
        </div>
      </div>

      {/* KPI Dot Stepper — only for Planning workflow, hidden on mobile */}
      {!isMobile && currentScreen !== 'budget-management' && isInPlanningWorkflow && (
        <div className="px-5 pb-1">
          <div className="flex items-center gap-1">
            {PLANNING_STEPS.map((step, index) => {
              const config = SCREEN_CONFIG[step.id];
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div className={`h-px flex-1 transition-all duration-300 ${
                      isCompleted ? 'bg-dafc-gold' : 'bg-border-muted'
                    }`} />
                  )}
                  <button
                    onClick={() => onNavigate(step.id)}
                    className="group flex flex-col items-center gap-1"
                    title={config.shortLabel}
                  >
                    <div className={`rounded-full transition-all duration-200 ${
                      isCompleted
                        ? 'w-3 h-3 bg-dafc-gold'
                        : isCurrent
                          ? 'w-3 h-3 border-2 border-dafc-gold bg-transparent'
                          : 'w-2 h-2 bg-border'
                    }`} />
                    <span className={`text-[9px] font-brand font-medium ${
                      isCurrent ? 'text-dafc-gold' : isCompleted ? 'text-content-secondary' : 'text-content-muted'
                    }`}>
                      {config.shortLabel}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          {/* Mobile fallback */}
          {isMobile && (
            <div className="text-[10px] font-data text-content-muted">
              Step {currentStepIndex + 1}/{PLANNING_STEPS.length}
            </div>
          )}
        </div>
      )}

      {/* Save Dropdown Menu - Portal to body */}
      {openSaveMenu && createPortal(
        <div
          className="fixed w-56 border rounded-2xl overflow-hidden bg-white border-border-muted shadow-lg"
          style={{
            top: saveMenuPosition.top,
            right: saveMenuPosition.right,
            zIndex: 99999,
          }}
        >
          <button
            onClick={async () => {
              if (hasSaveHandler) {
                await triggerSave();
              }
              setOpenSaveMenu(false);
            }}
            disabled={!hasSaveHandler}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium transition-colors ${hasSaveHandler ? 'hover:bg-surface-secondary text-content' : 'text-content-muted cursor-not-allowed'}`}
          >
            <Save size={14} className="shrink-0" />
            {t('header.save')}
          </button>
          <button
            onClick={() => {
              console.log('Save As New Version');
              setOpenSaveMenu(false);
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium border-t transition-colors border-border-muted hover:bg-surface-secondary text-content"
          >
            <Layers size={14} className="shrink-0" />
            {t('header.saveAsNewVersion')}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AppHeader;
