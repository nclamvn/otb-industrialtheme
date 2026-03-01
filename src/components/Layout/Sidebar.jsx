'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Package, BarChart3, TrendingUp,
  CheckCircle, ChevronRight, ShoppingCart,
  ChevronDown, Wallet, FileCheck,
  ClipboardList, Receipt, Ticket, Home, LogOut,
  Settings, Crown, PanelLeftClose, PanelLeft,
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

  /* ── Nav Item — minimal, clean hover with subtle bg ── */
  const NavItem = ({ id, label, icon: Icon }) => {
    const isActive = currentScreen === id;
    return (
      <button
        onClick={() => navigateTo(id)}
        className={`group relative w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13.5px] font-brand transition-all duration-150
          ${isActive
            ? 'bg-[#C4975A]/10 text-[#A67B3D] font-semibold'
            : 'text-[#2C2417] font-medium hover:bg-[#FAF8F5]'
          }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#C4975A]" />
        )}
        <Icon
          size={18}
          strokeWidth={isActive ? 2 : 1.8}
          className={`flex-shrink-0 transition-colors duration-150 ${
            isActive ? 'text-[#C4975A]' : 'text-[#8C8178] group-hover:text-[#6B5D4F]'
          }`}
        />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  /* ── Collapsed Item ── */
  const CollapsedItem = ({ id, label, icon: Icon }) => {
    const isActive = currentScreen === id;
    return (
      <div className="relative">
        <button
          onClick={() => navigateTo(id)}
          onMouseEnter={() => setHoveredItem(id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`group w-full flex items-center justify-center h-10 rounded-lg transition-all duration-150
            ${isActive ? 'bg-[#C4975A]/10' : 'hover:bg-[#FAF8F5]'}`}
        >
          <Icon
            size={18}
            strokeWidth={isActive ? 2 : 1.8}
            className={isActive ? 'text-[#C4975A]' : 'text-[#8C8178] group-hover:text-[#6B5D4F]'}
          />
        </button>
        {hoveredItem === id && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg whitespace-nowrap text-[12px] font-medium font-brand text-[#2C2417] bg-white border border-[#E8E2DB] shadow-lg">
              {label}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── Section Header — clean, no uppercase ── */
  const SectionHeader = ({ label, isOpen, onToggle }) => (
    <button
      onClick={onToggle}
      className="group w-full px-4 pt-5 pb-1.5 flex items-center justify-between transition-colors"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] font-brand text-[#8C8178]">
        {label}
      </span>
      <ChevronDown
        size={14}
        strokeWidth={2}
        className={`text-[#8C8178] group-hover:text-[#6B5D4F] transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  return (
    <div className={`${isCollapsed ? 'w-[64px]' : 'w-[252px]'} h-full flex flex-col z-40 transition-all duration-300 ease-in-out bg-white border-r border-[#F0EBE5]`}>

      {/* ── Logo ── */}
      <div className="h-[56px] flex items-center flex-shrink-0 border-b border-[#F0EBE5]">
        {isCollapsed ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center hover:bg-[#FAF8F5] transition-colors"
            title={t('components.expandSidebar')}
          >
            <PanelLeft size={18} strokeWidth={1.8} className="text-[#8C8178]" />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 w-full">
            <img src="/dafc-logo.png" alt="DAFC" className="h-9 w-auto object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold font-brand text-[#2C2417] leading-tight tracking-wide">OTB SYSTEM</div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg flex-shrink-0 transition-colors text-[#8C8178] hover:text-[#6B5D4F] hover:bg-[#FAF8F5]"
              title={t('components.collapseSidebar')}
            >
              <PanelLeftClose size={16} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="relative flex-1 overflow-y-auto py-3 scrollbar-hide">
        {isCollapsed ? (
          <div className="px-2 space-y-1">
            <CollapsedItem id="home" label={t('nav.homeDashboard')} icon={Home} />
            <div className="my-2 mx-3 h-px bg-[#F0EBE5]" />
            {menuGroups.map((group, gi) => (
              <div key={group.id}>
                {group.items.map((item) => (
                  <CollapsedItem key={item.id} id={item.id} label={item.label} icon={item.icon} />
                ))}
                {gi < menuGroups.length - 1 && <div className="my-2 mx-3 h-px bg-[#F0EBE5]" />}
              </div>
            ))}
            <div className="my-2 mx-3 h-px bg-[#F0EBE5]" />
            <CollapsedItem id="master-brands" label={t('nav.masterData')} icon={Database} />
            <CollapsedItem id="analytics-sales" label={t('nav.salesPerformance', 'Sales')} icon={LineChart} />
            <CollapsedItem id="analytics-budget" label={t('nav.budgetAnalytics', 'Budget')} icon={PieChart} />
            <CollapsedItem id="analytics-trends" label={t('nav.categoryTrends', 'Trends')} icon={Activity} />
            <CollapsedItem id="import-data" label={t('nav.importData', 'Import Data')} icon={Upload} />
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            <NavItem id="home" label={t('nav.homeDashboard')} icon={Home} />

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

            <div className="my-2 mx-4 h-px bg-[#F0EBE5]" />

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

            <NavItem id="import-data" label={t('nav.importData', 'Import Data')} icon={Upload} />
          </div>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div className="relative flex-shrink-0 border-t border-[#F0EBE5]">
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div
              className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-2 right-2 bottom-full mb-2'} z-50 rounded-xl overflow-hidden bg-white border border-[#E8E2DB] shadow-xl`}
              style={{ minWidth: isCollapsed ? '200px' : 'auto' }}
            >
              <div className="p-3 border-b border-[#F0EBE5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C4975A] to-[#A67B3D] flex items-center justify-center text-[11px] font-semibold text-white">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold font-brand truncate text-[#2C2417]">{user?.name || 'User'}</div>
                    <div className="text-[11px] text-[#8C8178]">{user?.email || user?.role?.name || 'User'}</div>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button onClick={() => { navigateTo('profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors hover:bg-[#FAF8F5]">
                  <Crown size={15} className="text-[#C4975A]" />
                  <span className="text-[13px] font-medium font-brand text-[#2C2417]">{t('userMenu.myProfile')}</span>
                </button>
                <button onClick={() => { navigateTo('settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors hover:bg-[#FAF8F5]">
                  <Settings size={15} className="text-[#8C8178]" />
                  <span className="text-[13px] font-medium font-brand text-[#2C2417]">{t('userMenu.settings')}</span>
                </button>
                <div className="my-1 mx-2 h-px bg-[#F0EBE5]" />
                {onLogout && (
                  <button onClick={() => { setShowUserMenu(false); onLogout(); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[#DC3545] hover:bg-red-50">
                    <LogOut size={15} />
                    <span className="text-[13px] font-medium font-brand">{t('userMenu.logout')}</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {isCollapsed ? (
          <div className="flex justify-center py-3">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="relative group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C4975A] to-[#A67B3D] flex items-center justify-center text-[11px] font-semibold text-white transition-shadow hover:shadow-md">
                {userInitials}
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-full p-3 flex items-center gap-3 transition-all duration-150
              ${showUserMenu ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C4975A] to-[#A67B3D] flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[13px] font-semibold font-brand truncate text-[#2C2417]">{user?.name || 'User'}</div>
              <div className="text-[11px] text-[#8C8178]">{user?.role?.name || 'User'}</div>
            </div>
            <ChevronRight size={14} className={`text-[#8C8178] transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
