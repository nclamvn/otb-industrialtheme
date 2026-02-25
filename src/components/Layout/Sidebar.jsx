'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Package, BarChart3, TrendingUp,
  CheckCircle, ChevronRight, ShoppingCart,
  Filter, ChevronDown, Wallet, FileCheck,
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
    if (route) {
      router.push(route);
    }
  };
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState({ planning: true, approval: false, confirmation: false });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isCollapsed = !isExpanded;

  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const menuGroups = useMemo(() => [
    {
      id: 'planning',
      label: t('nav.planning'),
      icon: TrendingUp,
      items: [
        { id: 'budget-management', label: t('nav.budgetManagement'), icon: Wallet },
        { id: 'planning', label: t('nav.budgetAllocation'), icon: DollarSign },
        { id: 'otb-analysis', label: t('nav.otbAnalysis'), icon: BarChart3 },
        { id: 'proposal', label: t('nav.skuProposal'), icon: Package },
      ]
    },
    {
      id: 'approval',
      label: t('nav.approvalHub'),
      icon: CheckCircle,
      items: [
        { id: 'tickets', label: t('nav.tickets'), icon: Ticket },
        { id: 'approvals', label: t('nav.approvals'), icon: FileCheck },
        { id: 'approval-config', label: t('nav.workflowConfig'), icon: Settings },
      ]
    },
    {
      id: 'confirmation',
      label: t('nav.confirmation'),
      icon: ClipboardList,
      items: [
        { id: 'order-confirmation', label: t('nav.orderConfirm'), icon: ShoppingCart },
        { id: 'receipt-confirmation', label: t('nav.receiptConfirm'), icon: Receipt },
      ]
    }
  ], [t]);

  // Collapsed sidebar item with tooltip
  const CollapsedMenuItem = ({ item, showDividerAfter = false }) => {
    const isActive = currentScreen === item.id;
    const Icon = item.icon;

    return (
      <>
        <div className="relative">
          <button
            onClick={() => navigateTo(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`group relative w-full flex items-center justify-center h-9 rounded-lg transition-all duration-200
              ${isActive ? '' : 'hover:bg-white/[0.06]'}`}
            style={isActive ? {
              background: 'linear-gradient(135deg, rgba(212,176,130,0.15) 0%, rgba(196,151,90,0.25) 100%)',
            } : undefined}
          >
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                style={{ background: 'linear-gradient(180deg, #D4B082 0%, #C4975A 100%)' }}
              />
            )}
            <Icon
              size={17}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={`transition-all duration-200 ${
                isActive ? 'text-[#D4B082]' : 'text-white/40 group-hover:text-white/70'
              }`}
            />
          </button>

          {hoveredItem === item.id && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div
                className="px-3 py-1.5 rounded-lg whitespace-nowrap text-[11px] font-semibold font-['Montserrat'] text-white"
                style={{
                  background: 'linear-gradient(135deg, #3D2E1E 0%, #2A1F14 100%)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,176,130,0.15)',
                }}
              >
                {item.label}
              </div>
            </div>
          )}
        </div>
        {showDividerAfter && (
          <div className="my-2 mx-3">
            <div className="h-px" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(212,176,130,0.2) 50%, transparent 100%)',
            }} />
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`${isCollapsed ? 'w-[60px]' : 'w-[260px]'} h-screen flex flex-col sticky top-0 z-40 transition-all duration-300 ease-in-out`}
      style={{
        background: 'linear-gradient(195deg, #2C2115 0%, #1F1810 40%, #181208 100%)',
        borderRight: '1px solid rgba(212,176,130,0.12)',
      }}
    >
      {/* Ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(196,151,90,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Logo Header */}
      <div
        className="relative h-[52px] flex items-center justify-center flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(212,176,130,0.1)',
        }}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center transition-all duration-200 hover:bg-white/[0.04]"
            title={t('components.expandSidebar')}
          >
            <img src="/dafc-logo.png" alt="DAFC" className="h-7 w-auto object-contain brightness-110" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-4 w-full h-full">
            <img src="/dafc-logo.png" alt="DAFC" className="h-8 w-auto object-contain flex-shrink-0 brightness-110" />
            <span
              className="flex-1 text-[11px] font-bold tracking-[0.2em] whitespace-nowrap leading-none font-['Montserrat']"
              style={{
                background: 'linear-gradient(135deg, #D4B082 0%, #E8D5B8 50%, #C4975A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('components.otbSystem')}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg flex-shrink-0 transition-all duration-200 text-white/30 hover:text-[#D4B082] hover:bg-white/[0.05]"
              title={t('components.collapseSidebar')}
            >
              <PanelLeftClose size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="relative flex-1 overflow-y-auto py-3 custom-scrollbar">
        {isCollapsed ? (
          <div className="px-1.5 space-y-0.5">
            <CollapsedMenuItem item={{ id: 'home', label: t('nav.homeDashboard'), icon: Home }} showDividerAfter />
            {menuGroups.map((group, groupIndex) => (
              <div key={group.id}>
                {group.items.map((item, itemIndex) => (
                  <CollapsedMenuItem
                    key={item.id}
                    item={item}
                    showDividerAfter={groupIndex < menuGroups.length - 1 && itemIndex === group.items.length - 1}
                  />
                ))}
              </div>
            ))}
            <div className="my-2 mx-3">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,176,130,0.2) 50%, transparent 100%)',
              }} />
            </div>
            <CollapsedMenuItem item={{ id: 'master-brands', label: t('nav.masterData'), icon: Database }} />
            <CollapsedMenuItem item={{ id: 'analytics-sales', label: t('nav.salesPerformance', 'Sales'), icon: LineChart }} />
            <CollapsedMenuItem item={{ id: 'analytics-budget', label: t('nav.budgetAnalytics', 'Budget'), icon: PieChart }} />
            <CollapsedMenuItem item={{ id: 'analytics-trends', label: t('nav.categoryTrends', 'Trends'), icon: Activity }} />
            <CollapsedMenuItem item={{ id: 'import-data', label: t('nav.importData', 'Import Data'), icon: Upload }} showDividerAfter />
          </div>
        ) : (
          <div className="px-3 space-y-0.5">
            {/* Home */}
            <button
              onClick={() => navigateTo('home')}
              className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                currentScreen !== 'home' ? 'hover:bg-white/[0.05]' : ''
              }`}
              style={currentScreen === 'home' ? {
                background: 'linear-gradient(135deg, rgba(212,176,130,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(212,176,130,0.15), 0 1px 3px rgba(0,0,0,0.1)',
              } : undefined}
            >
              {currentScreen === 'home' && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #D4B082 0%, #C4975A 100%)' }}
                />
              )}
              <Home
                size={16}
                strokeWidth={currentScreen === 'home' ? 2.2 : 1.8}
                className={`transition-colors duration-150 ${
                  currentScreen === 'home' ? 'text-[#D4B082]' : 'text-white/40 group-hover:text-white/70'
                }`}
              />
              <span className={`text-[13px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${
                currentScreen === 'home'
                  ? 'text-[#E8D5B8] font-semibold'
                  : 'text-white/50 font-medium group-hover:text-white/80'
              }`}>
                {t('nav.homeDashboard')}
              </span>
            </button>

            {/* Menu Groups */}
            {menuGroups.map((group) => (
              <div key={group.id} className="pt-3">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="group w-full px-3 py-1.5 flex items-center justify-between rounded-md transition-all duration-150 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <group.icon
                      size={13}
                      strokeWidth={2}
                      className="text-[#C4975A]/70"
                    />
                    <span
                      className="font-semibold text-[10px] uppercase tracking-[0.15em] font-['Montserrat'] text-[#C4975A]/70"
                    >
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    className={`text-white/20 transition-transform duration-200 ${
                      openGroups[group.id] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openGroups[group.id] && (
                  <div className="mt-1 ml-3 pl-3 space-y-0.5" style={{
                    borderLeft: '1px solid rgba(212,176,130,0.1)',
                  }}>
                    {group.items.map((item) => {
                      const isActive = currentScreen === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item.id)}
                          className={`group relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 ${
                            !isActive ? 'hover:bg-white/[0.05]' : ''
                          }`}
                          style={isActive ? {
                            background: 'linear-gradient(135deg, rgba(212,176,130,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                            boxShadow: 'inset 0 0 0 1px rgba(212,176,130,0.15), 0 1px 3px rgba(0,0,0,0.1)',
                          } : undefined}
                        >
                          {isActive && (
                            <div
                              className="absolute -left-3 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                              style={{ background: 'linear-gradient(180deg, #D4B082 0%, #C4975A 100%)' }}
                            />
                          )}
                          <item.icon
                            size={15}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={`transition-colors duration-150 ${
                              isActive ? 'text-[#D4B082]' : 'text-white/35 group-hover:text-white/65'
                            }`}
                          />
                          <span className={`text-[13px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${
                            isActive
                              ? 'text-[#E8D5B8] font-semibold'
                              : 'text-white/50 font-medium group-hover:text-white/80'
                          }`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Divider */}
            <div className="py-2.5">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,176,130,0.15) 50%, transparent 100%)',
              }} />
            </div>

            {/* Master Data */}
            <div>
              <button
                onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                className="group w-full px-3 py-1.5 flex items-center justify-between rounded-md transition-all duration-150 hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <Database size={13} strokeWidth={2} className="text-[#C4975A]/70" />
                  <span className="font-semibold text-[10px] uppercase tracking-[0.15em] font-['Montserrat'] text-[#C4975A]/70">
                    {t('nav.masterData')}
                  </span>
                </div>
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  className={`text-white/20 transition-transform duration-200 ${isMasterDataOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isMasterDataOpen && (
                <div className="mt-1 ml-3 pl-3 space-y-0.5" style={{
                  borderLeft: '1px solid rgba(212,176,130,0.1)',
                }}>
                  {[
                    { id: 'master-brands', label: t('nav.brands'), icon: Building2 },
                    { id: 'master-skus', label: t('nav.skuCatalog'), icon: Package },
                    { id: 'master-categories', label: t('nav.categories'), icon: FolderTree },
                    { id: 'master-subcategories', label: t('nav.subCategories'), icon: Tag },
                  ].map((item) => {
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`group relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 ${
                          !isActive ? 'hover:bg-white/[0.05]' : ''
                        }`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(212,176,130,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                          boxShadow: 'inset 0 0 0 1px rgba(212,176,130,0.15), 0 1px 3px rgba(0,0,0,0.1)',
                        } : undefined}
                      >
                        {isActive && (
                          <div
                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                            style={{ background: 'linear-gradient(180deg, #D4B082 0%, #C4975A 100%)' }}
                          />
                        )}
                        <item.icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={`transition-colors duration-150 ${
                            isActive ? 'text-[#D4B082]' : 'text-white/35 group-hover:text-white/65'
                          }`}
                        />
                        <span className={`text-[13px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${
                          isActive
                            ? 'text-[#E8D5B8] font-semibold'
                            : 'text-white/50 font-medium group-hover:text-white/80'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Analytics */}
            <div>
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="group w-full px-3 py-1.5 flex items-center justify-between rounded-md transition-all duration-150 hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={13} strokeWidth={2} className="text-[#C4975A]/70" />
                  <span className="font-semibold text-[10px] uppercase tracking-[0.15em] font-['Montserrat'] text-[#C4975A]/70">
                    {t('nav.analytics')}
                  </span>
                </div>
                <ChevronDown
                  size={11}
                  strokeWidth={2}
                  className={`text-white/20 transition-transform duration-200 ${isAnalyticsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isAnalyticsOpen && (
                <div className="mt-1 ml-3 pl-3 space-y-0.5" style={{
                  borderLeft: '1px solid rgba(212,176,130,0.1)',
                }}>
                  {[
                    { id: 'analytics-sales', label: t('nav.salesPerformance', 'Sales Performance'), icon: LineChart },
                    { id: 'analytics-budget', label: t('nav.budgetAnalytics', 'Budget Analytics'), icon: PieChart },
                    { id: 'analytics-trends', label: t('nav.categoryTrends', 'Category Trends'), icon: Activity },
                  ].map((item) => {
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className={`group relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg transition-all duration-200 ${
                          !isActive ? 'hover:bg-white/[0.05]' : ''
                        }`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(212,176,130,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                          boxShadow: 'inset 0 0 0 1px rgba(212,176,130,0.15), 0 1px 3px rgba(0,0,0,0.1)',
                        } : undefined}
                      >
                        {isActive && (
                          <div
                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                            style={{ background: 'linear-gradient(180deg, #D4B082 0%, #C4975A 100%)' }}
                          />
                        )}
                        <item.icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={`transition-colors duration-150 ${
                            isActive ? 'text-[#D4B082]' : 'text-white/35 group-hover:text-white/65'
                          }`}
                        />
                        <span className={`text-[13px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${
                          isActive
                            ? 'text-[#E8D5B8] font-semibold'
                            : 'text-white/50 font-medium group-hover:text-white/80'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Import Data */}
            <button
              onClick={() => navigateTo('import-data')}
              className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                currentScreen !== 'import-data' ? 'hover:bg-white/[0.05]' : ''
              }`}
              style={currentScreen === 'import-data' ? {
                background: 'linear-gradient(135deg, rgba(212,176,130,0.12) 0%, rgba(196,151,90,0.22) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(212,176,130,0.15), 0 1px 3px rgba(0,0,0,0.1)',
              } : undefined}
            >
              <Upload
                size={16}
                strokeWidth={currentScreen === 'import-data' ? 2.2 : 1.8}
                className={`transition-colors duration-150 ${
                  currentScreen === 'import-data' ? 'text-[#D4B082]' : 'text-white/40 group-hover:text-white/70'
                }`}
              />
              <span className={`text-[13px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${
                currentScreen === 'import-data'
                  ? 'text-[#E8D5B8] font-semibold'
                  : 'text-white/50 font-medium group-hover:text-white/80'
              }`}>
                {t('nav.importData', 'Import Data')}
              </span>
            </button>

            {/* Bottom Divider */}
            <div className="py-2.5">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,176,130,0.15) 50%, transparent 100%)',
              }} />
            </div>
          </div>
        )}
      </nav>

      {/* Footer — User Profile */}
      <div className="relative p-2.5 flex-shrink-0" style={{
        borderTop: '1px solid rgba(212,176,130,0.1)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)',
      }}>
        {/* User Menu Popup */}
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div
              className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-2.5 right-2.5 bottom-full mb-2'} z-50 rounded-xl overflow-hidden`}
              style={{
                background: 'linear-gradient(160deg, #2C2115 0%, #221A0F 50%, #1A1209 100%)',
                border: '1px solid rgba(212,176,130,0.15)',
                boxShadow: '0 -12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,176,130,0.08)',
                minWidth: isCollapsed ? '200px' : 'auto',
              }}
            >
              {/* User Info Header */}
              <div className="p-3" style={{
                borderBottom: '1px solid rgba(212,176,130,0.1)',
                background: 'linear-gradient(135deg, rgba(196,151,90,0.06) 0%, rgba(196,151,90,0.12) 100%)',
              }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat']"
                    style={{
                      border: '2px solid rgba(212,176,130,0.4)',
                      color: '#D4B082',
                      background: 'linear-gradient(135deg, rgba(196,151,90,0.1) 0%, rgba(196,151,90,0.2) 100%)',
                    }}
                  >
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold font-['Montserrat'] truncate text-white/90">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-[11px] text-white/40">
                      {user?.email || user?.role?.name || 'User'}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
                      <span className="text-[9px] font-medium text-emerald-400/80">
                        {t('common.online')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1.5">
                <button
                  onClick={() => { navigateTo('profile'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
                >
                  <div className="p-1 rounded-md" style={{ background: 'rgba(196,151,90,0.12)' }}>
                    <Crown size={14} className="text-[#D4B082]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.myProfile')}</div>
                    <div className="text-[10px] text-white/30">{t('userMenu.viewAndEditProfile')}</div>
                  </div>
                </button>

                <button
                  onClick={() => { navigateTo('settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
                >
                  <div className="p-1 rounded-md" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Settings size={14} className="text-white/50" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.settings')}</div>
                    <div className="text-[10px] text-white/30">{t('userMenu.appPreferences')}</div>
                  </div>
                </button>

                <div className="my-1.5 mx-2 h-px" style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(212,176,130,0.15) 50%, transparent 100%)',
                }} />

                {onLogout && (
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08]"
                  >
                    <div className="p-1 rounded-md bg-red-500/[0.1]">
                      <LogOut size={14} className="text-red-400/70" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.logout')}</div>
                      <div className="text-[10px] text-white/20">{t('userMenu.signOutOfAccount')}</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Avatar Button */}
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat'] transition-all duration-200"
                style={{
                  border: '2px solid rgba(212,176,130,0.3)',
                  color: '#D4B082',
                  background: showUserMenu
                    ? 'linear-gradient(135deg, rgba(196,151,90,0.15) 0%, rgba(196,151,90,0.25) 100%)'
                    : 'rgba(196,151,90,0.08)',
                }}
              >
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
                style={{
                  border: '2px solid #1F1810',
                  boxShadow: '0 0 6px rgba(52,211,153,0.4)',
                }}
              />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full rounded-xl p-2.5 flex items-center gap-2.5 transition-all duration-200"
            style={{
              background: showUserMenu
                ? 'linear-gradient(135deg, rgba(196,151,90,0.1) 0%, rgba(196,151,90,0.18) 100%)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showUserMenu ? 'rgba(212,176,130,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat']"
                style={{
                  border: '2px solid rgba(212,176,130,0.3)',
                  color: '#D4B082',
                  background: 'linear-gradient(135deg, rgba(196,151,90,0.08) 0%, rgba(196,151,90,0.16) 100%)',
                }}
              >
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400"
                style={{
                  border: '2px solid #1F1810',
                  boxShadow: '0 0 6px rgba(52,211,153,0.4)',
                }}
              />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold font-['Montserrat'] truncate text-white/85">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-white/35">
                {user?.role?.name || 'User'}
              </div>
            </div>

            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''} text-white/20`}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
