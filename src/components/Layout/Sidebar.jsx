'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Package, BarChart3, TrendingUp,
  CheckCircle, ChevronRight, ShoppingCart,
  ChevronDown, Wallet, FileCheck,
  ClipboardList, Receipt, Ticket, Home, LogOut,
  Settings, Crown, PanelLeftClose,
  Database, Building2, FolderTree, Tag,
  LineChart, PieChart, Activity, Upload
} from 'lucide-react';
import { ROUTE_MAP } from '@/utils/routeMap';
import { useLanguage } from '@/contexts/LanguageContext';

const Sidebar = ({ currentScreen, setDarkMode, user, onLogout }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const navigateTo = (screenId) => {
    const route = ROUTE_MAP[screenId];
    if (route) router.push(route);
  };

  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState({ planning: true, approval: false, confirmation: false });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isCollapsed = !isExpanded;
  const toggleGroup = (group) => setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const menuGroups = useMemo(() => [
    {
      id: 'planning', label: t('nav.planning'), icon: TrendingUp,
      items: [
        { id: 'budget-management', label: t('nav.budgetManagement'), icon: Wallet },
        { id: 'planning', label: t('nav.budgetAllocation'), icon: DollarSign },
        { id: 'otb-analysis', label: t('nav.otbAnalysis'), icon: BarChart3 },
        { id: 'proposal', label: t('nav.skuProposal'), icon: Package },
      ]
    },
    {
      id: 'approval', label: t('nav.approvalHub'), icon: CheckCircle,
      items: [
        { id: 'tickets', label: t('nav.tickets'), icon: Ticket },
        { id: 'approvals', label: t('nav.approvals'), icon: FileCheck },
        { id: 'approval-config', label: t('nav.workflowConfig'), icon: Settings },
      ]
    },
    {
      id: 'confirmation', label: t('nav.confirmation'), icon: ClipboardList,
      items: [
        { id: 'order-confirmation', label: t('nav.orderConfirm'), icon: ShoppingCart },
        { id: 'receipt-confirmation', label: t('nav.receiptConfirm'), icon: Receipt },
      ]
    }
  ], [t]);

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  /* ── Expanded nav item — no backgrounds, only gold left bar for active ── */
  const NavItem = ({ id, label, icon: Icon, indent = false }) => {
    const isActive = currentScreen === id;
    return (
      <button
        onClick={() => navigateTo(id)}
        className={`group relative w-full flex items-center gap-2 px-3 py-[7px] text-[13px] font-brand transition-all duration-200
          ${isActive
            ? 'text-dafc-gold font-semibold'
            : 'text-content-secondary font-medium hover:text-content'
          }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-dafc-gold" />
        )}
        <Icon size={16} strokeWidth={isActive ? 2.2 : 2} className={isActive ? 'text-dafc-gold' : 'text-content-muted group-hover:text-content-secondary'} />
        {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
      </button>
    );
  };

  /* ── Collapsed item — gold dot below active icon instead of background ── */
  const CollapsedItem = ({ id, label, icon: Icon }) => {
    const isActive = currentScreen === id;
    return (
      <div className="relative">
        <button
          onClick={() => navigateTo(id)}
          onMouseEnter={() => setHoveredItem(id)}
          onMouseLeave={() => setHoveredItem(null)}
          className="group w-full flex flex-col items-center justify-center h-9 transition-all duration-200"
        >
          <Icon size={17} strokeWidth={isActive ? 2.2 : 2} className={isActive ? 'text-dafc-gold' : 'text-content-muted group-hover:text-content-secondary'} />
          {isActive && <span className="w-1 h-1 rounded-full bg-dafc-gold mt-1" />}
        </button>
        {hoveredItem === id && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl whitespace-nowrap text-[11px] font-semibold font-brand text-content bg-white border border-border shadow-elevated">
              {label}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Section header — no icon, tiny uppercase text only ── */
  const SectionHeader = ({ label, isOpen, onToggle }) => (
    <button
      onClick={onToggle}
      className="group w-full px-3 pt-4 pb-1 flex items-center justify-between transition-colors"
    >
      <span className="font-semibold text-[9px] uppercase tracking-[0.2em] font-brand text-content-muted">
        {label}
      </span>
      <ChevronDown size={10} strokeWidth={2} className={`text-content-muted/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className={`${isCollapsed ? 'w-[60px]' : 'w-[260px]'} h-full flex flex-col z-40 transition-all duration-300 ease-in-out bg-white`}>

      {/* ── Logo Header — no bottom border, taller, muted brand text ── */}
      <div className="h-[48px] flex items-center justify-center flex-shrink-0">
        {isCollapsed ? (
          <button onClick={() => setIsExpanded(true)} className="w-full h-full flex items-center justify-center hover:text-dafc-gold transition-colors" title={t('components.expandSidebar')}>
            <img src="/dafc-logo.png" alt="DAFC" className="h-7 w-auto object-contain" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-4 w-full h-full">
            <img src="/dafc-logo.png" alt="DAFC" className="h-8 w-auto object-contain flex-shrink-0" />
            <span className="flex-1 text-[10px] font-bold tracking-[0.25em] whitespace-nowrap leading-none font-brand text-content-muted">
              {t('components.otbSystem')}
            </span>
            <button onClick={() => setIsExpanded(false)} className="p-1.5 rounded-xl flex-shrink-0 transition-colors text-content-muted hover:text-dafc-gold" title={t('components.collapseSidebar')}>
              <PanelLeftClose size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="relative flex-1 overflow-y-auto py-2 scrollbar-hide">
        {isCollapsed ? (
          /* ── Collapsed nav ── */
          <div className="px-1.5 space-y-0.5">
            <CollapsedItem id="home" label={t('nav.homeDashboard')} icon={Home} />
            <div className="my-2 mx-5 h-px bg-border-muted/50" />
            {menuGroups.map((group, gi) => (
              <div key={group.id}>
                {group.items.map((item) => (
                  <CollapsedItem key={item.id} id={item.id} label={item.label} icon={item.icon} />
                ))}
                {gi < menuGroups.length - 1 && <div className="my-2 mx-5 h-px bg-border-muted/50" />}
              </div>
            ))}
            <div className="my-2 mx-5 h-px bg-border-muted/50" />
            <CollapsedItem id="master-brands" label={t('nav.masterData')} icon={Database} />
            <CollapsedItem id="analytics-sales" label={t('nav.salesPerformance', 'Sales')} icon={LineChart} />
            <CollapsedItem id="analytics-budget" label={t('nav.budgetAnalytics', 'Budget')} icon={PieChart} />
            <CollapsedItem id="analytics-trends" label={t('nav.categoryTrends', 'Trends')} icon={Activity} />
            <CollapsedItem id="import-data" label={t('nav.importData', 'Import Data')} icon={Upload} />
          </div>
        ) : (
          /* ── Expanded nav — flush left items, hierarchy via typography ── */
          <div className="px-3 space-y-0.5">
            <NavItem id="home" label={t('nav.homeDashboard')} icon={Home} />

            {/* Menu Groups */}
            {menuGroups.map((group) => (
              <div key={group.id}>
                <SectionHeader label={group.label} isOpen={openGroups[group.id]} onToggle={() => toggleGroup(group.id)} />
                {openGroups[group.id] && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem key={item.id} id={item.id} label={item.label} icon={item.icon} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="py-1.5 px-5"><div className="h-px bg-border-muted/50" /></div>

            {/* Master Data */}
            <SectionHeader label={t('nav.masterData')} isOpen={isMasterDataOpen} onToggle={() => setIsMasterDataOpen(!isMasterDataOpen)} />
            {isMasterDataOpen && (
              <div className="space-y-0.5">
                {[
                  { id: 'master-brands', label: t('nav.brands'), icon: Building2 },
                  { id: 'master-skus', label: t('nav.skuCatalog'), icon: Package },
                  { id: 'master-categories', label: t('nav.categories'), icon: FolderTree },
                  { id: 'master-subcategories', label: t('nav.subCategories'), icon: Tag },
                ].map((item) => <NavItem key={item.id} id={item.id} label={item.label} icon={item.icon} />)}
              </div>
            )}

            {/* Analytics */}
            <SectionHeader label={t('nav.analytics')} isOpen={isAnalyticsOpen} onToggle={() => setIsAnalyticsOpen(!isAnalyticsOpen)} />
            {isAnalyticsOpen && (
              <div className="space-y-0.5">
                {[
                  { id: 'analytics-sales', label: t('nav.salesPerformance', 'Sales Performance'), icon: LineChart },
                  { id: 'analytics-budget', label: t('nav.budgetAnalytics', 'Budget Analytics'), icon: PieChart },
                  { id: 'analytics-trends', label: t('nav.categoryTrends', 'Category Trends'), icon: Activity },
                ].map((item) => <NavItem key={item.id} id={item.id} label={item.label} icon={item.icon} />)}
              </div>
            )}

            {/* Import Data */}
            <NavItem id="import-data" label={t('nav.importData', 'Import Data')} icon={Upload} />

            <div className="py-1.5 px-5"><div className="h-px bg-border-muted/50" /></div>
          </div>
        )}
      </nav>

      {/* ── Footer — User Profile — no border-t, plain avatar ── */}
      <div className="relative p-2.5 flex-shrink-0">
        {/* User Menu Popup */}
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div
              className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-2.5 right-2.5 bottom-full mb-2'} z-50 rounded-2xl overflow-hidden bg-white border border-border shadow-elevated`}
              style={{ minWidth: isCollapsed ? '200px' : 'auto' }}
            >
              {/* User Info Header */}
              <div className="p-3 border-b border-border-muted bg-surface-secondary">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold font-brand bg-canvas text-content-secondary">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold font-brand truncate text-content">{user?.name || 'User'}</div>
                    <div className="text-[11px] text-content-muted">{user?.email || user?.role?.name || 'User'}</div>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button onClick={() => { navigateTo('profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-content-secondary hover:text-content hover:bg-surface-secondary">
                  <div className="p-1 rounded-lg bg-dafc-gold/10"><Crown size={14} className="text-dafc-gold" /></div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-brand">{t('userMenu.myProfile')}</div>
                    <div className="text-[10px] text-content-muted">{t('userMenu.viewAndEditProfile')}</div>
                  </div>
                </button>
                <button onClick={() => { navigateTo('settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-content-secondary hover:text-content hover:bg-surface-secondary">
                  <div className="p-1 rounded-lg bg-surface-secondary"><Settings size={14} className="text-content-muted" /></div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-brand">{t('userMenu.settings')}</div>
                    <div className="text-[10px] text-content-muted">{t('userMenu.appPreferences')}</div>
                  </div>
                </button>
                <div className="my-1.5 mx-2 h-px bg-border-muted" />
                {onLogout && (
                  <button onClick={() => { setShowUserMenu(false); onLogout(); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-status-critical hover:bg-status-critical-muted">
                    <div className="p-1 rounded-lg bg-status-critical-muted"><LogOut size={14} className="text-status-critical" /></div>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium font-brand">{t('userMenu.logout')}</div>
                      <div className="text-[10px] text-content-muted">{t('userMenu.signOutOfAccount')}</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Avatar Button — plain circle, no gold border, no status dot */}
        {isCollapsed ? (
          <div className="flex justify-center">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="relative group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold font-brand bg-canvas text-content-secondary transition-colors hover:bg-border-muted">
                {userInitials}
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full rounded-2xl p-2.5 flex items-center gap-2.5 transition-all duration-200
              ${showUserMenu ? 'bg-surface-secondary' : 'bg-transparent hover:bg-surface-secondary'}`}
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold font-brand bg-canvas text-content-secondary">
                {userInitials}
              </div>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold font-brand truncate text-content">{user?.name || 'User'}</div>
              <div className="text-[11px] text-content-muted">{user?.role?.name || 'User'}</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
