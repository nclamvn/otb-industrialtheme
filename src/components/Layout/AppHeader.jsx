'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { aiService } from '../../services/aiService';
import { ROUTE_MAP } from '@/utils/routeMap';
import { useLanguage } from '@/contexts/LanguageContext';
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
      return <XCircle size={14} className="text-[#DC3545]" />;
    case 'warning':
      return <Clock size={14} className="text-[#D97706]" />;
    case 'info':
      return <CheckCircle size={14} className="text-[#1B6B45]" />;
    default:
      return <Bell size={14} className="text-[#C4975A]" />;
  }
};

const getAlertBg = (severity) => {
  const styles = {
    critical: 'bg-red-50',
    warning: 'bg-amber-50',
    info: 'bg-green-50',
  };
  return styles[severity] || '';
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
    const q = searchQuery.toLowerCase();
    return Object.entries(SCREEN_CONFIG)
      .filter(([id, cfg]) => {
        const label = (cfg.label || '').toLowerCase();
        const shortLabel = (cfg.shortLabel || '').toLowerCase();
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
    const interval = setInterval(fetchBudgetAlerts, 5 * 60 * 1000); // refresh every 5 min
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
    <div className="sticky top-0 z-40" style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF9F7 100%)',
    }}>
      {/* Main Header */}
      <div className={`h-11 ${isMobile ? 'px-3' : 'px-4'} flex items-center justify-between`} style={{
        borderBottom: '1px solid #E8E2DB',
        background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(196,151,90,0.04) 100%)',
      }}>
        {/* Left - Page Title */}
        <div className="flex items-center gap-2.5">
          {/* Icon with gradient background */}
          <div className="relative">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(196,151,90,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                border: '1px solid rgba(196,151,90,0.25)',
              }}
            >
              <CurrentIcon size={14} strokeWidth={2} className="text-[#C4975A]" />
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1B6B45]"
              style={{
                border: '1.5px solid #FFFFFF',
                boxShadow: '0 0 4px rgba(27,107,69,0.5)',
              }}
            />
          </div>

          {/* Title & Breadcrumb */}
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-semibold font-['Montserrat'] tracking-tight text-[#2C2417]">
                {currentConfig.label || 'Dashboard'}
              </h1>
              {currentConfig.step && (
                <span className="px-1.5 py-px rounded text-[9px] font-medium font-['JetBrains_Mono'] uppercase tracking-wider bg-[rgba(196,151,90,0.15)] text-[#7D5A28] border border-[rgba(196,151,90,0.25)]">
                  {t('common.step')} {currentConfig.step}
                </span>
              )}
            </div>
            {currentConfig.step && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#8C8178]">{t('header.planningBreadcrumb')}</span>
                <ChevronRight size={10} className="text-[#E8E2DB]" />
                <span className="text-[10px] font-medium text-[#6B5D4F]">
                  {currentConfig.shortLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-0.5">
          {/* Search Button */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all duration-200 border-[#E8E2DB] hover:border-[rgba(196,151,90,0.4)] hover:bg-[rgba(196,151,90,0.06)]"
            >
              <Search size={13} className="text-[#8C8178]" />
              <span className="text-[11px] hidden sm:block text-[#8C8178]">
                {t('header.searchPlaceholder')}
              </span>
              <kbd className="hidden sm:flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-['JetBrains_Mono'] bg-[#FBF9F7] text-[#8C8178] border border-[#E8E2DB]">
                <Command size={8} />K
              </kbd>
            </button>

            {/* Search Modal */}
            {showSearch && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-96 rounded-xl shadow-2xl border overflow-hidden z-[9999] bg-white border-[#E8E2DB]"
                style={{ boxShadow: '0 8px 32px rgba(44,36,23,0.06)' }}
              >
                <div className="p-3 border-b border-[#E8E2DB]">
                  <div className="flex items-center gap-3">
                    <Search size={18} className="text-[#6B5D4F]" />
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
                      className="flex-1 bg-transparent text-sm outline-none text-[#2C2417] placeholder:text-[#8C8178]"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="p-0.5 rounded text-[#8C8178] hover:text-[#6B5D4F]">
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
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#FBF9F7] text-[#2C2417]"
                        >
                          <ResultIcon size={16} className="text-[#C4975A]" />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium font-['Montserrat']">{result.label}</div>
                            {result.step && (
                              <div className="text-xs text-[#8C8178]">Step {result.step}</div>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-[#E8E2DB]" />
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-6 text-center text-sm text-[#8C8178]">
                    {t('common.noResults') || 'No results found'}
                  </div>
                ) : (
                  <div className="p-2 text-center text-xs text-[#6B5D4F]">
                    {t('header.typeToSearch')} <kbd className="px-1 py-0.5 rounded bg-[#FBF9F7] text-[#6B5D4F] border border-[#E8E2DB]">ESC</kbd> {t('header.toClose')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-4 mx-1" style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(196,151,90,0.25) 50%, transparent 100%)',
          }} />

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="relative p-1.5 rounded-md transition-all duration-200 group hover:bg-[rgba(196,151,90,0.08)]"
            title={language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
          >
            <span className="text-[11px] font-bold font-['JetBrains_Mono'] text-[#7D5A28]">
              {language === 'en' ? 'EN' : 'VN'}
            </span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-1.5 rounded-md transition-all duration-200 ${
                showNotifications
                  ? 'bg-[rgba(196,151,90,0.12)]'
                  : 'hover:bg-[rgba(196,151,90,0.08)]'
              }`}
            >
              <Bell size={15} strokeWidth={2} className={
                showNotifications
                  ? 'text-[#C4975A]'
                  : 'text-[#6B5D4F]'
              } style={showNotifications ? { filter: 'drop-shadow(0 0 3px rgba(196,151,90,0.4))' } : undefined} />

              {/* Badge */}
              {budgetAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-white text-[8px] flex items-center justify-center font-['JetBrains_Mono'] font-bold shadow-lg ${
                  hasCritical
                    ? 'bg-gradient-to-r from-[#DC3545] to-[#E85D6B] shadow-[rgba(220,53,69,0.3)] animate-pulse'
                    : 'bg-gradient-to-r from-[#C4975A] to-[#A67B3D] shadow-[rgba(196,151,90,0.3)]'
                }`}>
                  {budgetAlerts.length > 9 ? '9+' : budgetAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border overflow-hidden z-50 bg-white border-[#E8E2DB]"
                style={{ boxShadow: '0 8px 32px rgba(44,36,23,0.06)' }}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between border-[#E8E2DB] bg-[#FBF9F7]">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#C4975A]" />
                    <h3 className="text-sm font-semibold font-['Montserrat'] text-[#2C2417]">
                      {t('header.budgetAlerts')}
                    </h3>
                  </div>
                  {budgetAlerts.length > 0 && (
                    <span className={`text-xs font-['JetBrains_Mono'] px-2 py-0.5 rounded-full ${
                      hasCritical
                        ? 'bg-red-100 text-[#DC3545]'
                        : 'bg-amber-100 text-[#D97706]'
                    }`}>
                      {budgetAlerts.length} {budgetAlerts.length !== 1 ? t('header.alerts') : t('header.alert')}
                    </span>
                  )}
                </div>

                {/* Alert List */}
                <div className="max-h-80 overflow-y-auto">
                  {budgetAlerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#8C8178]">
                      {t('header.noAlerts')}
                    </div>
                  ) : (
                    budgetAlerts.slice(0, 8).map((alert, idx) => (
                      <div
                        key={alert.id}
                        className={`px-4 py-3 flex gap-3 cursor-pointer transition-all duration-200 border-l-2 hover:bg-[rgba(196,151,90,0.08)] border-transparent hover:border-[#C4975A] ${getAlertBg(alert.severity)} ${idx !== Math.min(budgetAlerts.length, 8) - 1 ? 'border-b border-b-[#F0EBE5]' : ''}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-lg ${
                          alert.severity === 'critical'
                            ? 'bg-[rgba(220,53,69,0.10)]'
                            : alert.severity === 'warning'
                              ? 'bg-[rgba(217,119,6,0.10)]'
                              : 'bg-[rgba(27,107,69,0.10)]'
                        }`}>
                          {getAlertIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-[#2C2417]">
                            {alert.title}
                          </div>
                          <div className="text-xs mt-0.5 line-clamp-2 text-[#6B5D4F]">
                            {alert.message}
                          </div>
                          {alert.budget && (
                            <div className="text-[10px] font-['JetBrains_Mono'] mt-1.5 text-[#8C8178]">
                              {alert.budget.groupBrand?.name} — {alert.budget.budgetCode}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-[#E8E2DB] bg-[#FBF9F7]">
                  <button className="w-full text-center text-xs font-semibold font-['Montserrat'] text-[#C4975A] hover:text-[#A67B3D] transition-colors py-1">
                    {t('header.viewAllAlerts')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Print + Save — moved to header row, hidden on Tickets pages */}
          {isInPlanningWorkflow && currentScreen !== 'tickets' && currentScreen !== 'ticket-detail' && (
          <>
            <div className="w-px h-4 mx-1" style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(196,151,90,0.25) 50%, transparent 100%)',
            }} />
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="no-print px-1.5 py-1 rounded-lg transition-colors text-[#8C8178] hover:bg-[rgba(196,151,90,0.12)] hover:text-[#7D5A28]"
                title={t('common.print')}
              >
                <Printer size={14} />
              </button>
              <div className="relative" ref={saveButtonRef}>
                <div className="inline-flex items-stretch rounded-lg border border-[rgba(196,151,90,0.3)] overflow-hidden">
                  <button
                    onClick={() => console.log('Save')}
                    className="flex items-center px-2 py-1 transition-colors bg-[#C4975A] text-white hover:bg-[#A67B3D]"
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
                    className="flex items-center px-1 py-1 border-l border-[rgba(255,255,255,0.2)] transition-colors bg-[#C4975A] text-white hover:bg-[#A67B3D]"
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

      {/* KPI Tracking Bar - Only show for Planning workflow, hidden on mobile */}
      {!isMobile && currentScreen !== 'budget-management' && isInPlanningWorkflow && (
        <div className="px-4 py-1.5" style={{
          borderBottom: '1px solid #E8E2DB',
          background: 'linear-gradient(90deg, #FAF8F5 0%, #FFFFFF 50%, #FAF8F5 100%)',
        }}>
          <div className="flex items-center gap-3">
            {/* Step Progress */}
            <div className="flex items-center gap-1">
              {PLANNING_STEPS.map((step, index) => {
                const config = SCREEN_CONFIG[step.id];
                const Icon = config.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const kpi = kpiData[step.id] || { value: 0, status: 'pending' };

                return (
                  <React.Fragment key={step.id}>
                    {index > 0 && (
                      <div className="w-4 h-[1.5px] rounded-full transition-all duration-300" style={{
                        background: isCompleted
                          ? 'linear-gradient(90deg, #1B6B45, #1B6B45)'
                          : '#E8E2DB',
                      }} />
                    )}
                    <button
                      onClick={() => onNavigate(step.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200"
                      style={{
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(196,151,90,0.08) 0%, rgba(196,151,90,0.16) 100%)'
                          : isCompleted
                            ? 'linear-gradient(135deg, rgba(27,107,69,0.06) 0%, rgba(27,107,69,0.12) 100%)'
                            : 'transparent',
                        border: `1px solid ${
                          isCurrent ? 'rgba(196,151,90,0.2)' : isCompleted ? 'rgba(27,107,69,0.2)' : 'transparent'
                        }`,
                      }}
                    >
                      <div className={`p-0.5 rounded ${
                        isCurrent ? 'bg-[#C4975A]' : isCompleted ? 'bg-[#1B6B45]' : 'bg-[#E8E2DB]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle size={10} className="text-white" strokeWidth={2.5} />
                        ) : (
                          <Icon size={10} className={isCurrent ? 'text-white' : 'text-[#8C8178]'} strokeWidth={2.5} />
                        )}
                      </div>
                      <div className="text-left">
                        <div className={`text-[11px] font-semibold font-['Montserrat'] leading-tight ${
                          isCurrent ? 'text-[#C4975A]' : isCompleted ? 'text-[#1B6B45]' : 'text-[#8C8178]'
                        }`}>
                          {config.shortLabel}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {kpi.status === 'completed' ? (
                            <CheckCircle size={7} className="text-[#1B6B45]" />
                          ) : kpi.status === 'in-progress' ? (
                            <Clock size={7} className="text-[#D97706]" />
                          ) : (
                            <Target size={7} className="text-[#E8E2DB]" />
                          )}
                          <span className="text-[8px] font-['JetBrains_Mono'] text-[#8C8178]">
                            {kpi.value} {config.kpiLabel}
                          </span>
                        </div>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Save Dropdown Menu - Portal to body */}
      {openSaveMenu && createPortal(
        <div
          className="fixed w-56 border rounded-xl overflow-hidden bg-white border-[#E8E2DB]"
          style={{
            top: saveMenuPosition.top,
            right: saveMenuPosition.right,
            zIndex: 99999,
            boxShadow: '0 8px 32px rgba(44,36,23,0.06)',
          }}
        >
          <button
            onClick={() => {
              console.log('Save');
              setOpenSaveMenu(false);
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium transition-colors hover:bg-[rgba(196,151,90,0.08)] text-[#2C2417]"
          >
            <Save size={14} className="shrink-0" />
            {t('header.save')}
          </button>
          <button
            onClick={() => {
              console.log('Save As New Version');
              setOpenSaveMenu(false);
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-medium border-t transition-colors border-[#E8E2DB] hover:bg-[rgba(196,151,90,0.08)] text-[#2C2417]"
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
