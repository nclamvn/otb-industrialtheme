'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronDown, Plus, Search, Table, PieChart, X, Filter, Eye, Split,
  Wallet, CircleCheckBig, Hourglass
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { budgetService, masterDataService } from '../services';
import { LoadingSpinner, ErrorMessage, EmptyState, ExpandableStatCard } from '../components/Common';
import BudgetAlertsBanner from '../components/BudgetAlertsBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileFilterSheet, MobileDataCard } from '@/components/ui';

const YEARS = [2023, 2024, 2025, 2026];

const CARD_ACCENTS = {
  total:     { color: '#C4975A', grad: 'rgba(180,140,95,0.10)', icon: 'rgba(160,120,75,0.08)' },
  allocated: { color: '#1B6B45', grad: 'rgba(22,120,70,0.08)',  icon: 'rgba(22,120,70,0.07)' },
  remaining: { color: '#D97706', grad: 'rgba(200,150,30,0.09)', icon: 'rgba(180,130,20,0.07)' },
};

const BudgetManagementScreen = ({
  selectedYear,
  setSelectedYear,
  selectedGroupBrand,
  setSelectedGroupBrand,
  selectedBrand,
  setSelectedBrand,
  onAllocate,
  darkMode = false
}) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // API state
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Master data for create form
  const [apiBrands, setApiBrands] = useState([]);
  const [apiStores, setApiStores] = useState([]);

  // Derived brand list and group categories from API
  const brandList = useMemo(() => apiBrands.map(b => ({
    id: b.id,
    code: b.code,
    name: b.name,
    groupId: b.groupId || 'A',
    color: b.colorConfig?.gradient || 'from-stone-400 to-stone-600',
  })), [apiBrands]);

  const groupBrandCategories = useMemo(() => {
    const groups = {};
    brandList.forEach(b => {
      const gid = b.groupId || 'A';
      if (!groups[gid]) groups[gid] = { id: gid, name: `Group ${gid}` };
    });
    return Object.values(groups).sort((a, b) => a.id.localeCompare(b.id));
  }, [brandList]);

  // Fetch budgets from API
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (selectedYear) filters.fiscalYear = selectedYear;
      if (selectedBrand) filters.brandId = selectedBrand;

      const response = await budgetService.getAll(filters);
      // Map API response to UI format
      const budgets = (response.data || response || []).map(budget => ({
        id: budget.id,
        fiscalYear: budget.fiscalYear,
        groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
        brandId: budget.groupBrandId || budget.brandId,
        brandName: budget.groupBrand?.name || budget.Brand?.name || budget.brandName || 'Unknown',
        totalBudget: Number(budget.totalBudget || budget.totalAmount) || 0,
        budgetName: budget.budgetCode || budget.name || budget.budgetName || 'Untitled',
        status: (budget.status || 'DRAFT').toLowerCase(),
        createdAt: budget.createdAt,
        createdBy: budget.createdBy
      }));
      setBudgetData(budgets);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setError(t('budget.failedToLoadBudgets'));
      setBudgetData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedBrand]);

  // Initial fetch
  useEffect(() => {
    fetchBudgets();
    // Fetch master data for create form
    masterDataService.getBrands().then(b => setApiBrands(Array.isArray(b) ? b : [])).catch(() => {});
    masterDataService.getStores().then(s => setApiStores(Array.isArray(s) ? s : [])).catch(() => {});
  }, [fetchBudgets]);

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currency, setCurrency] = useState('VND'); // VND or USD

  // Dropdown states
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [groupBrandDropdownOpen, setGroupBrandDropdownOpen] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Form state for create budget
  const [newBudgetForm, setNewBudgetForm] = useState({
    fiscalYear: 2026,
    groupBrand: 'A',
    brandId: '',
    seasonGroup: 'SS',
    seasonType: 'pre',
    name: '',
    totalBudget: '',
    description: ''
  });

  // Filter budgets
  const filteredBudgets = useMemo(() => {
    return budgetData.filter(budget => {
      if (selectedYear && budget.fiscalYear !== selectedYear) return false;
      if (selectedGroupBrand && budget.groupBrand !== selectedGroupBrand) return false;
      if (selectedBrand && budget.brandId !== selectedBrand) return false;
      if (searchQuery && !budget.budgetName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [budgetData, selectedYear, selectedGroupBrand, selectedBrand, searchQuery]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = budgetData.reduce((sum, b) => sum + (Number(b.totalBudget) || 0), 0);
    const approved = budgetData.filter(b => b.status === 'approved').reduce((sum, b) => sum + (Number(b.totalBudget) || 0), 0);
    const pending = budgetData.filter(b => b.status === 'pending').reduce((sum, b) => sum + (Number(b.totalBudget) || 0), 0);
    const draft = budgetData.filter(b => b.status === 'draft').reduce((sum, b) => sum + (Number(b.totalBudget) || 0), 0);
    const remaining = total - approved;

    // Group by brand for breakdown
    const byBrand = {};
    budgetData.forEach(b => {
      const name = b.brandName || b.groupBrand || 'Other';
      byBrand[name] = (byBrand[name] || 0) + (Number(b.totalBudget) || 0);
    });
    const brandBreakdown = Object.entries(byBrand)
      .map(([label, value]) => ({ label, value, displayValue: formatCurrency(value, { currency }), pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);

    // Status counts
    const statusCounts = { approved: 0, pending: 0, draft: 0 };
    budgetData.forEach(b => {
      const s = b.status || 'draft';
      if (statusCounts[s] !== undefined) statusCounts[s]++;
    });

    return {
      total,
      approved,
      pending,
      draft,
      remaining,
      count: budgetData.length,
      approvedPct: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      pendingPct: total > 0 ? ((pending / total) * 100).toFixed(1) : 0,
      remainingPct: total > 0 ? ((remaining / total) * 100).toFixed(1) : 0,
      brandBreakdown,
      statusCounts,
    };
  }, [budgetData, currency]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear(null);
    setSelectedGroupBrand(null);
    setSelectedBrand(null);
    setSearchQuery('');
  };

  const DetailRow = ({ label, value, strong }) => (
  <div className="flex justify-between gap-4">
    <span className="text-[#8C8178]">{label}</span>
    <span className={`text-right ${strong ? 'font-semibold text-[#1B6B45] font-[\'JetBrains_Mono\']' : ''}`}>
      {value}
    </span>
  </div>
);


  const hasActiveFilters = selectedYear || selectedGroupBrand || selectedBrand || searchQuery;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner darkMode={darkMode} size="lg" message={t('budget.loadingBudgets')} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorMessage darkMode={darkMode} message={error} onRetry={fetchBudgets} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Budget Alerts Banner */}
      <BudgetAlertsBanner darkMode={darkMode} />

      {/* Mobile Filter Sheet */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          darkMode={darkMode}
          title={t('budget.filters')}
          filters={[
            { key: 'year', label: t('budget.fiscalYear'), type: 'select', options: YEARS.map(y => ({ value: y, label: `FY${y}` })) },
            { key: 'groupBrand', label: t('budget.groupBrand'), type: 'select', options: groupBrandCategories.map(g => ({ value: g.id, label: g.name })) },
            { key: 'brand', label: t('budget.brand'), type: 'select', options: brandList.map(b => ({ value: b.id, label: b.name })) },
            { key: 'search', label: t('budget.searchBudgets'), type: 'search' },
          ]}
          values={{ year: selectedYear || '', groupBrand: selectedGroupBrand || '', brand: selectedBrand || '', search: searchQuery }}
          onApply={(v) => {
            setSelectedYear(v.year ? Number(v.year) : null);
            setSelectedGroupBrand(v.groupBrand || null);
            setSelectedBrand(v.brand || null);
            setSearchQuery(v.search || '');
          }}
          onReset={clearFilters}
        />
      )}

      {/* Filters Section */}
      <div className="rounded-lg shadow-sm border px-3 py-2 bg-white border-[#E8E2DB]">
        <div className="flex flex-wrap items-center gap-2">
          {isMobile ? (
            <>
              <button
                onClick={() => setShowMobileFilters(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium ${
                  hasActiveFilters
                    ? 'border-[rgba(196,151,90,0.4)] bg-[rgba(196,151,90,0.1)] text-[#8A6340]'
                    : 'border-[#E8E2DB] text-[#8C8178]'
                }`}
              >
                <Filter size={14} />
                {t('budget.filters')}
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-dafc-gold" />}
              </button>
              <div className="flex-1" />
            </>
          ) : (
            <>
              <Filter size={14} className="shrink-0 text-[#8C8178]" />
              <span className="text-xs font-medium font-['Montserrat'] shrink-0 text-[#8C8178]">{t('budget.filters')}</span>
              <div className="h-5 w-px shrink-0 bg-[#E8E2DB]"></div>
            </>
          )}
          {/* Desktop filters - hidden on mobile */}
          {!isMobile && <><div className="relative">
            <button
              onClick={() => {
                setYearDropdownOpen(!yearDropdownOpen);
                setGroupBrandDropdownOpen(false);
                setBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg transition-colors min-w-[110px] ${selectedYear
                ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(196,151,90,0.4)] text-[#8A6340]'
                : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(196,151,90,0.4)]'
                }`}
            >
              <span className="text-sm font-medium">{selectedYear ? `FY${selectedYear}` : t('budget.allYears')}</span>
              <ChevronDown size={16} className="opacity-50 shrink-0" />
            </button>
            {yearDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-1 z-20 min-w-[140px] bg-white border-[#E8E2DB]">
                <button
                  onClick={() => { setSelectedYear(null); setYearDropdownOpen(false); }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${!selectedYear ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                >
                  {t('budget.allYears')}
                </button>
                {YEARS.map(year => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setYearDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${selectedYear === year ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                  >
                    FY{year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group Brand Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setGroupBrandDropdownOpen(!groupBrandDropdownOpen);
                setYearDropdownOpen(false);
                setBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg transition-colors min-w-[130px] ${selectedGroupBrand
                ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(196,151,90,0.4)] text-[#8A6340]'
                : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(196,151,90,0.4)]'
                }`}
            >
              <span className="text-sm font-medium">
                {selectedGroupBrand
                  ? groupBrandCategories.find(g => g.id === selectedGroupBrand)?.name
                  : t('budget.allGroupBrands')}
              </span>
              <ChevronDown size={16} className="opacity-50 shrink-0" />
            </button>
            {groupBrandDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-1 z-20 min-w-[150px] bg-white border-[#E8E2DB]">
                <button
                  onClick={() => { setSelectedGroupBrand(null); setGroupBrandDropdownOpen(false); }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${!selectedGroupBrand ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                >
                  {t('budget.allGroupBrands')}
                </button>
                {groupBrandCategories.map(group => (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroupBrand(group.id); setGroupBrandDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${selectedGroupBrand === group.id ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setBrandDropdownOpen(!brandDropdownOpen);
                setYearDropdownOpen(false);
                setGroupBrandDropdownOpen(false);
              }}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg transition-colors min-w-[110px] ${selectedBrand
                ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(196,151,90,0.4)] text-[#8A6340]'
                : 'bg-white border-[#E8E2DB] text-[#2C2417] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(196,151,90,0.4)]'
                }`}
            >
              <span className="text-sm font-medium">
                {selectedBrand ? brandList.find(b => b.id === selectedBrand)?.name : t('budget.allBrands')}
              </span>
              <ChevronDown size={16} className="opacity-50 shrink-0" />
            </button>
            {brandDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg border py-1 z-20 min-w-[140px] bg-white border-[#E8E2DB]">
                <button
                  onClick={() => { setSelectedBrand(null); setBrandDropdownOpen(false); }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${!selectedBrand ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                >
                  {t('budget.allBrands')}
                </button>
                {brandList.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => { setSelectedBrand(brand.id); setBrandDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[rgba(160,120,75,0.18)] ${selectedBrand === brand.id ? 'text-[#8A6340] font-medium' : 'text-[#2C2417]'}`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B5D4F]" />
            <input
              type="text"
              placeholder={t('budget.searchBudgets')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-transparent bg-white border-[#E8E2DB] text-[#2C2417] placeholder-[#6B5D4F]"
            />
          </div></>}

          {/* Currency Toggle */}
          <div className="flex items-center rounded-lg p-1 bg-[#FBF9F7]">
            <button
              onClick={() => setCurrency('VND')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'VND'
                  ? 'bg-[#C4975A] text-white shadow-sm'
                  : 'text-[#6B5D4F] hover:text-[#2C2417]'
              }`}
            >
              VND
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold font-['JetBrains_Mono'] transition-all ${
                currency === 'USD'
                  ? 'bg-[#1B6B45] text-white shadow-sm'
                  : 'text-[#6B5D4F] hover:text-[#2C2417]'
              }`}
            >
              USD
            </button>
          </div>

          {/* View Toggle */}
          {/* <div className="flex items-center gap-1 rounded-lg p-1 ml-auto bg-[#FBF9F7]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#2C2417] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#2C2417]'
              }`}
            >
              <Table size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-white text-[#2C2417] shadow-sm'
                  : 'text-[#8C8178] hover:text-[#2C2417]'
              }`}
            >
              <PieChart size={16} />
              Charts
            </button>
          </div> */}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium transition-colors shrink-0 text-[#8C8178] hover:text-[#8A6340]"
            >
              <X size={12} />
              {t('budget.clearAll')}
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B6B45] text-white rounded-lg hover:bg-[#1B6B45]/90 transition-colors shadow-sm text-xs font-medium font-['Montserrat'] shrink-0"
          >
            <Plus size={14} />
            {t('budget.createBudget')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ExpandableStatCard
          title={t('budget.totalBudget')}
          value={formatCurrency(summaryStats.total, { currency })}
          sub={t('budget.allBudgetsCombined')}
          darkMode={darkMode}
          icon={Wallet}
          accent="gold"
          trendLabel={`${summaryStats.count} budgets`}
          trend={1}
          breakdown={summaryStats.brandBreakdown.slice(0, 5)}
          expandTitle={t('home.kpiDetail.byBrand')}
        />
        <ExpandableStatCard
          title={t('budget.allocated')}
          value={formatCurrency(summaryStats.approved, { currency })}
          sub={`${summaryStats.approvedPct}% ${t('budget.ofTotal')}`}
          darkMode={darkMode}
          icon={CircleCheckBig}
          accent="emerald"
          progress={Number(summaryStats.approvedPct)}
          progressLabel={t('budget.allocated')}
          badges={[
            { label: 'Approved', value: summaryStats.statusCounts.approved, color: '#1B6B45' },
            { label: 'Pending', value: summaryStats.statusCounts.pending, color: '#D97706' },
            { label: 'Draft', value: summaryStats.statusCounts.draft, color: '#8C8178' },
          ]}
          expandTitle={t('home.kpiDetail.byStatus')}
        />
        <ExpandableStatCard
          title={t('budget.remaining')}
          value={formatCurrency(summaryStats.remaining, { currency })}
          sub={`${summaryStats.remainingPct}% ${t('budget.ofTotal')}`}
          darkMode={darkMode}
          icon={Hourglass}
          accent="amber"
          progress={Number(summaryStats.remainingPct)}
          progressLabel={t('budget.remaining')}
          breakdown={[
            { label: 'Draft', value: summaryStats.draft, displayValue: formatCurrency(summaryStats.draft, { currency }), pct: summaryStats.total > 0 ? Math.round((summaryStats.draft / summaryStats.total) * 100) : 0, color: '#8C8178' },
            { label: 'Pending', value: summaryStats.pending, displayValue: formatCurrency(summaryStats.pending, { currency }), pct: summaryStats.total > 0 ? Math.round((summaryStats.pending / summaryStats.total) * 100) : 0, color: '#D97706' },
          ]}
          expandTitle={t('home.kpiDetail.breakdown')}
        />
      </div>

      {/* Data Table / Mobile Cards */}
      {viewMode === 'table' && isMobile && (
        <div className="space-y-3">
          {filteredBudgets.length === 0 ? (
            <div className="py-8">
              <EmptyState
                darkMode={darkMode}
                title={hasActiveFilters ? t('budget.noMatchingBudgets') : t('budget.noBudgetsYet')}
                message={hasActiveFilters ? t('budget.tryAdjustingFilters') : t('budget.createFirstBudget')}
                actionLabel={hasActiveFilters ? undefined : t('budget.createBudget')}
                onAction={hasActiveFilters ? undefined : () => setShowCreateModal(true)}
              />
            </div>
          ) : (
            filteredBudgets.map((budget) => (
              <MobileDataCard
                key={budget.id}
                darkMode={darkMode}
                title={budget.budgetName}
                subtitle={`FY${budget.fiscalYear} · ${budget.brandName}`}
                status={budget.status}
                statusColor={budget.status === 'approved' ? 'success' : budget.status === 'pending' ? 'warning' : 'neutral'}
                metrics={[
                  { label: t('budget.groupBrand'), value: budget.groupBrand },
                  { label: t('budget.amount'), value: formatCurrency(budget.totalBudget, { currency }) },
                ]}
                actions={[
                  { label: t('budget.view'), onClick: () => { setSelectedBudget(budget); setShowViewModal(true); } },
                  { label: t('budget.allocate'), primary: true, onClick: () => onAllocate?.({ id: budget.id, year: budget.fiscalYear, groupBrand: budget.groupBrand, brandId: budget.brandId, brandName: budget.brandName, totalBudget: budget.totalBudget, budgetName: budget.budgetName }) },
                ]}
              />
            ))
          )}
        </div>
      )}

      {viewMode === 'table' && !isMobile && (
        <div className="rounded-xl shadow-sm border overflow-hidden bg-white border-[#E8E2DB]">
          <table className="w-full">
            <thead className="bg-[rgba(160,120,75,0.18)]">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('budget.fiscalYear')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('budget.groupBrand')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('budget.brand')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('budget.budgetName')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('budget.amount')}
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold tracking-wider font-['Montserrat'] text-[#6B5D4F]">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DB]">
              {filteredBudgets.map((budget) => (
                <tr
                  key={budget.id}
                  className="transition-colors hover:bg-[rgba(160,120,75,0.18)]"
                >
                  <td className="px-3 py-2">
                    <span className="text-sm font-medium text-[#2C2417]">FY{budget.fiscalYear}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FBF9F7] text-[#2C2417]">
                      {budget.groupBrand}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm text-[#8C8178]">{budget.brandName}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm font-medium cursor-pointer transition-colors text-[#8A6340] hover:text-[#8A6340]/80 hover:underline">
                      {budget.budgetName}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm font-semibold font-['JetBrains_Mono'] text-[#2C2417]">{formatCurrency(budget.totalBudget, { currency })}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {/* View */}
                      <button
                        onClick={() => {
                          setSelectedBudget(budget);
                          setShowViewModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition text-[#8C8178] hover:text-[#2C2417] hover:bg-[#FBF9F7]"
                      >
                        <Eye size={14} />
                        {t('budget.view')}
                      </button>

                      {/* Allocate */}
                      <button
                        onClick={() =>
                          onAllocate &&
                          onAllocate({
                            id: budget.id,
                            year: budget.fiscalYear,
                            groupBrand: budget.groupBrand,
                            brandId: budget.brandId,
                            brandName: budget.brandName,
                            totalBudget: budget.totalBudget,
                            budgetName: budget.budgetName,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition bg-[rgba(160,120,75,0.18)] text-[#8A6340] hover:bg-[rgba(196,151,90,0.25)] border border-[rgba(196,151,90,0.4)]"
                      >
                        <Split size={14} />
                        {t('budget.allocate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBudgets.length === 0 && (
            <div className="py-8">
              <EmptyState
                darkMode={darkMode}
                title={hasActiveFilters ? t('budget.noMatchingBudgets') : t('budget.noBudgetsYet')}
                message={hasActiveFilters
                  ? t('budget.tryAdjustingFilters')
                  : t('budget.createFirstBudget')
                }
                actionLabel={hasActiveFilters ? undefined : t('budget.createBudget')}
                onAction={hasActiveFilters ? undefined : () => setShowCreateModal(true)}
              />
              {hasActiveFilters && (
                <div className="text-center">
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium transition-colors text-[#8A6340] hover:text-[#8A6340]/80"
                  >
                    {t('common.clearAllFilters')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showViewModal && selectedBudget && (
        <div className="fixed inset-0 z-[9999]">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowViewModal(false)}
          />

          {/* Modal */}
          <div className="relative flex min-h-screen items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden bg-white text-[#2C2417]"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b border-[#E8E2DB]"
              >
                <h3 className="text-lg font-semibold font-['Montserrat']">{t('budget.budgetDetail')}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-[#FBF9F7]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4 text-sm">
                <DetailRow label={t('budget.fiscalYear')} value={`FY${selectedBudget.fiscalYear}`} />
                <DetailRow label={t('budget.groupBrand')} value={selectedBudget.groupBrand} />
                <DetailRow label={t('budget.brand')} value={selectedBudget.brandName} />
                <DetailRow label={t('budget.budgetName')} value={selectedBudget.budgetName} />
                <DetailRow label={t('budget.createdBy')} value="TC Admin" />
                <DetailRow label={t('budget.createdOn')} value="02/02/2025" />

                <DetailRow
                  label={t('budget.totalBudget')}
                  value={formatCurrency(selectedBudget.totalBudget, { currency })}
                  strong
                />
              </div>

              {/* Footer */}
              <div
                className="flex justify-end px-6 py-4 border-t border-[#E8E2DB]"
              >
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[#FBF9F7] hover:bg-[#E8E2DB] text-[#2C2417]"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Charts View Placeholder */}
      {viewMode === 'charts' && (
        <div className="rounded-xl shadow-sm border p-12 bg-white border-[#E8E2DB]">
          <div className="text-center">
            <PieChart size={48} className="mx-auto mb-4 text-[#6B5D4F]" />
            <p className="text-[#6B5D4F]">{t('common.chartsComingSoon')}</p>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-hidden bg-white">
            <div className="flex items-center justify-between p-6 border-b border-[#E8E2DB]">
              <h3 className="text-lg font-semibold font-['Montserrat'] text-[#2C2417]">{t('budget.createNewBudget')}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg transition-colors text-[#6B5D4F] hover:text-[#2C2417] hover:bg-[#FBF9F7]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)]">
              {/* Fiscal Year */}
              <div className="grid grid-cols-3 gap-4">
                {/* Fiscal Year */}
                <div>
                  <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                    {t('budget.fiscalYear')} <span className="text-[#DC3545]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.fiscalYear}
                    onChange={(e) =>
                      setNewBudgetForm({
                        ...newBudgetForm,
                        fiscalYear: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group Brand */}
                <div>
                  <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                    {t('budget.groupBrand')} <span className="text-[#DC3545]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.groupBrand}
                    onChange={(e) =>
                      setNewBudgetForm({ ...newBudgetForm, groupBrand: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                  >
                    {groupBrandCategories.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                    {t('budget.brand')} <span className="text-[#DC3545]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.brandId}
                    onChange={(e) =>
                      setNewBudgetForm({ ...newBudgetForm, brandId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                  >
                    <option value="">{t('budget.selectBrand')}</option>
                    {apiBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Season Group & Season Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                    {t('otbAnalysis.seasonGroup')} <span className="text-[#DC3545]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.seasonGroup}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, seasonGroup: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                  >
                    <option value="SS">Spring Summer</option>
                    <option value="FW">Fall Winter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                    {t('otbAnalysis.season')} <span className="text-[#DC3545]">{t('common.required')}</span>
                  </label>
                  <select
                    value={newBudgetForm.seasonType}
                    onChange={(e) => setNewBudgetForm({ ...newBudgetForm, seasonType: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417]"
                  >
                    <option value="pre">Pre</option>
                    <option value="main">Main / Show</option>
                  </select>
                </div>
              </div>

              {/* Budget Name */}
              <div>
                <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                  {t('budget.budgetName')} <span className="text-[#DC3545]">{t('common.required')}</span>
                </label>
                <input
                  type="text"
                  value={newBudgetForm.name}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, name: e.target.value })}
                  placeholder={t('budget.enterBudgetName')}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417] placeholder-[#6B5D4F]"
                />
              </div>

              {/* Total Budget */}
              <div>
                <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                  {t('budget.amountVND')} <span className="text-[#DC3545]">{t('common.required')}</span>
                </label>
                <input
                  type="text"
                  value={newBudgetForm.totalBudget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewBudgetForm({ ...newBudgetForm, totalBudget: value });
                  }}
                  placeholder={t('budget.enterTotalBudgetAmount')}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] bg-white border-[#E8E2DB] text-[#2C2417] placeholder-[#6B5D4F]"
                />
                {newBudgetForm.totalBudget && (
                  <p className="text-xs mt-1 font-['JetBrains_Mono'] text-[#6B5D4F]">
                    {formatCurrency(parseInt(newBudgetForm.totalBudget) || 0, { currency })}
                  </p>
                )}
              </div>



              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 font-['Montserrat'] text-[#2C2417]">
                  {t('common.description')}
                </label>
                <textarea
                  value={newBudgetForm.description}
                  onChange={(e) => setNewBudgetForm({ ...newBudgetForm, description: e.target.value })}
                  placeholder={t('budget.enterDescription')}
                  rows={3}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4975A] focus:border-[#C4975A] resize-none bg-white border-[#E8E2DB] text-[#2C2417] placeholder-[#6B5D4F]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E8E2DB] bg-[#FBF9F7] rounded-b-2xl">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBudgetForm({ fiscalYear: 2026, groupBrand: 'A', brandId: apiBrands[0]?.id || '', seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
                }}
                className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors text-[#8C8178] hover:bg-[#E8E2DB]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!newBudgetForm.totalBudget || !newBudgetForm.brandId) return;

                  setCreating(true);
                  try {
                    const totalAmount = parseInt(newBudgetForm.totalBudget) || 0;
                    if (apiStores.length === 0) {
                      toast.error(t('budget.noStoresAvailable') || 'No stores available');
                      return;
                    }
                    // Split budget equally across all stores
                    const stores = apiStores;
                    const perStore = Math.floor(totalAmount / stores.length);
                    const details = stores.map((store, idx) => ({
                      storeId: store.id,
                      budgetAmount: idx === 0 ? totalAmount - perStore * (stores.length - 1) : perStore,
                    }));

                    await budgetService.create({
                      groupBrandId: newBudgetForm.brandId,
                      seasonGroupId: newBudgetForm.seasonGroup,
                      seasonType: newBudgetForm.seasonType,
                      fiscalYear: newBudgetForm.fiscalYear,
                      comment: newBudgetForm.description || undefined,
                      details,
                    });
                    toast.success(t('budget.budgetCreatedSuccess'));
                    setShowCreateModal(false);
                    setNewBudgetForm({ fiscalYear: 2026, groupBrand: 'A', brandId: apiBrands[0]?.id || '', seasonGroup: 'SS', seasonType: 'pre', name: '', totalBudget: '', description: '' });
                    // Refresh the list
                    fetchBudgets();
                  } catch (err) {
                    console.error('Failed to create budget:', err);
                    toast.error(err.response?.data?.message || t('budget.failedToCreateBudget'));
                  } finally {
                    setCreating(false);
                  }
                }}
                disabled={!newBudgetForm.totalBudget || !newBudgetForm.name || creating}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  !newBudgetForm.totalBudget || !newBudgetForm.name || creating
                    ? 'bg-[#E8E2DB] cursor-not-allowed text-[#8C8178]'
                    : 'bg-[#1B6B45] hover:bg-[#1B6B45]/90'
                }`}
              >
                {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {creating ? t('budget.creating') : t('budget.createBudget')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BudgetManagementScreen;
