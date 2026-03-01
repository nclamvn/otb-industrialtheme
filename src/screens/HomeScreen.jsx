'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  RefreshCcw,
  DollarSign,
  Target,
  Percent,
  ShoppingCart,
  Building2,
  Boxes,
  ClipboardCheck,
  BarChart3,
  Bell,
  Check,
  ArrowUpRight,
  Package
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { budgetService, masterDataService, approvalService, planningService, proposalService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ROUTE_MAP } from '@/utils/routeMap';
import KPIDetailModal from '../components/Common/KPIDetailModal';

/* ── Smart zero-state helper ── */
const isEmptyValue = (v) => !v || v === '0' || v === '0%' || v === '$0' || v === '0.0%';

/* ── Safe number parser ── */
const toNum = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };

/* ── Format currency (compact) ── */
const fmtCurrency = (v) => {
  const n = toNum(v);
  if (!n) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs}`;
};

/* ── Circular Gauge (270° arc) ── */
const CircularGauge = ({ value, max = 100, color = '#C4975A', size = 56 }) => {
  const sw = size >= 52 ? 5 : 4;
  const r = (size - sw - 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const empty = isEmptyValue(String(value));
  const offset = arc - arc * (empty ? 0 : pct);
  const displayVal = empty ? '—%' : `${Math.round(pct * 100)}%`;
  const fs = Math.round(size * 0.22);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E2DB" strokeWidth={sw}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={empty ? '#D4CBBC' : color} strokeWidth={sw}
        strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={fs} fontWeight="700" fontFamily="JetBrains Mono, monospace"
        fill={empty ? '#6B5D4F' : '#2C2417'}>{displayVal}</text>
    </svg>
  );
};

/* ── IntelCard — watermark icon, compact layout ── */
const IntelCard = ({ title, value, trend, trendLabel, icon: Icon, color, variant = 'gauge', gaugeValue, gaugeMax, onClick }) => {
  const empty = isEmptyValue(value);
  const displayValue = empty ? (variant === 'bar' ? '—' : '—%') : value;
  return (
    <div
      className="relative bg-white rounded-xl px-3.5 py-3 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer border border-transparent overflow-hidden"
      style={{ borderColor: 'transparent' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = `${color}30`}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
      onClick={onClick}
    >
      {Icon && (
        <Icon size={80} strokeWidth={0.8} className="absolute -bottom-3 -right-3 pointer-events-none transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.15]" style={{ color, opacity: 0.08 }} />
      )}
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] font-brand text-content-secondary relative">
        {title}
      </p>
      <div className="flex items-end gap-2 mt-0.5 relative">
        <span className={`text-2xl font-bold font-data tabular-nums leading-none ${empty ? 'text-content-muted' : 'text-content'}`}>
          {displayValue}
        </span>
        {trendLabel && !empty && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold font-data rounded-full whitespace-nowrap mb-0.5 ${
            trend > 0
              ? 'bg-status-success-muted text-status-success'
              : 'bg-status-critical-muted text-status-critical'
          }`}>
            {trend > 0 ? '▲' : '▼'} {trendLabel}
          </span>
        )}
      </div>
      <div className="mt-1.5 relative">
        {variant === 'bar' ? (
          <div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: empty ? '0%' : `${Math.min(gaugeValue || 65, 100)}%`, backgroundColor: color }} />
            </div>
            <p className="text-[9px] text-content-muted mt-0.5 font-brand font-medium">vs target</p>
          </div>
        ) : (
          <CircularGauge value={gaugeValue || 0} max={gaugeMax || 100} color={color} size={44} />
        )}
      </div>
    </div>
  );
};

/* ── Mini horizontal bar for pipeline ── */
const PipelineBar = ({ segments, total }) => {
  if (!total) return <div className="h-2 bg-border-muted rounded-full" />;
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-border-muted">
      {segments.map((seg, i) => (
        <div key={seg.label || i} className="h-full transition-all duration-500" title={`${seg.label}: ${seg.value}`}
          style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }} />
      ))}
    </div>
  );
};

const CARD_CONFIG = {
  totalSales: { icon: DollarSign, accent: 'gold' },
  budgetUtilization: { icon: Target, accent: 'emerald' },
  avgMargin: { icon: Percent, accent: 'blue' },
  sellThrough: { icon: ShoppingCart, accent: 'rose' },
  totalBrands: { icon: Building2, accent: 'amber' },
  categories: { icon: Boxes, accent: 'teal' },
  pendingApprovals: { icon: ClipboardCheck, accent: 'violet' },
  activePlans: { icon: BarChart3, accent: 'indigo' },
};

const STATUS_COLORS = {
  DRAFT: '#8C8178',
  SUBMITTED: '#D97706',
  LEVEL1_APPROVED: '#2563EB',
  LEVEL2_APPROVED: '#7C3AED',
  APPROVED: '#1B6B45',
  FINAL: '#1B6B45',
  REJECTED: '#DC3545',
  ARCHIVED: '#6B5D4F',
};

const HomeScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const navigateTo = (screenId) => { const r = ROUTE_MAP[screenId]; if (r) router.push(r); };

  const [expandedCard, setExpandedCard] = useState(null);

  // Primary stats from API
  const [stats, setStats] = useState({
    totalSales: '0', budgetUtilization: '0%', avgMargin: '0%', sellThrough: '0%',
    totalBrands: '0', categories: '0', pendingApprovals: '0', activePlans: '0'
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Enriched data from multiple services
  const [budgets, setBudgets] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [brands, setBrands] = useState([]);
  const [enrichedLoading, setEnrichedLoading] = useState(true);

  // Dashboard filter state
  const SEASON_OPTIONS = ['SS25', 'FW25', 'SS26', 'FW26'];
  const REGION_OPTIONS = ['Vietnam', 'Global'];
  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('Vietnam');
  const [brandOptions, setBrandOptions] = useState([]);
  const [openFilter, setOpenFilter] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setOpenFilter(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch brands for filter
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const b = await masterDataService.getBrands();
        const list = Array.isArray(b) ? b : (b?.data || []);
        setBrands(list);
        setBrandOptions(list.map(b => b.name || b.code || 'Unknown'));
      } catch { setBrandOptions([]); }
    };
    fetchBrands();
  }, []);

  // Primary stats
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const data = await budgetService.getStatistics();
        if (data) {
          setStats({
            totalSales: data.totalSales || data.totalBudget || '0',
            budgetUtilization: data.budgetUtilization || data.utilization || '0%',
            avgMargin: data.avgMargin || '0%',
            sellThrough: data.sellThrough || '0%',
            totalBrands: String(data.totalBrands || data.brandCount || 0),
            categories: String(data.categories || data.categoryCount || 0),
            pendingApprovals: String(data.pendingApprovals || data.pendingCount || 0),
            activePlans: String(data.activePlans || data.planCount || 0)
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Enriched data — parallel, fail-safe
  const fetchEnrichedData = useCallback(async () => {
    setEnrichedLoading(true);
    const [budgetRes, pendingRes, planRes, proposalRes] = await Promise.allSettled([
      budgetService.getAll(),
      approvalService.getPending(),
      planningService.getAll(),
      proposalService.getAll(),
    ]);
    if (budgetRes.status === 'fulfilled') {
      const d = budgetRes.value;
      setBudgets(Array.isArray(d) ? d : d?.data || []);
    }
    if (pendingRes.status === 'fulfilled') {
      setPendingItems(Array.isArray(pendingRes.value) ? pendingRes.value : []);
    }
    if (planRes.status === 'fulfilled') {
      const d = planRes.value;
      setPlans(Array.isArray(d) ? d : d?.data || []);
    }
    if (proposalRes.status === 'fulfilled') {
      const d = proposalRes.value;
      setProposals(Array.isArray(d) ? d : d?.data || []);
    }
    setEnrichedLoading(false);
  }, []);

  useEffect(() => { fetchEnrichedData(); }, [fetchEnrichedData]);

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  // ── Computed metrics from real data ──
  const totalBudgetAmount = budgets.reduce((s, b) => s + toNum(b.totalBudget || b.amount || b.totalAmount), 0);
  const budgetsByStatus = {};
  budgets.forEach(b => {
    const st = (b.status || 'DRAFT').toUpperCase();
    budgetsByStatus[st] = (budgetsByStatus[st] || 0) + 1;
  });
  const budgetPipeline = Object.entries(budgetsByStatus).map(([label, value]) => ({
    label: label.replace(/_/g, ' '),
    value,
    color: STATUS_COLORS[label] || '#8C8178',
  }));

  // Approval queue breakdown
  const approvalsByType = {};
  pendingItems.forEach(p => {
    const type = p.entityType || 'other';
    approvalsByType[type] = (approvalsByType[type] || 0) + 1;
  });

  // Top brands by budget
  const brandBudgetMap = {};
  budgets.forEach(b => {
    const name = b.brandName || b.groupBrandName || b.brand || 'Other';
    brandBudgetMap[name] = (brandBudgetMap[name] || 0) + toNum(b.totalBudget || b.amount || b.totalAmount);
  });
  const topBrands = Object.entries(brandBudgetMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const maxBrandBudget = topBrands[0]?.amount || 1;

  // Proposal stats
  const totalProposalValue = proposals.reduce((s, p) => s + toNum(p.totalValue), 0);
  const totalSkuCount = proposals.reduce((s, p) => s + toNum(p.totalSkuCount || p.products?.length), 0);

  // Plans by status
  const plansByStatus = {};
  plans.forEach(p => {
    const st = (p.status || 'DRAFT').toUpperCase();
    plansByStatus[st] = (plansByStatus[st] || 0) + 1;
  });

  // Dynamic alerts — computed from real data
  const dynamicAlerts = [];
  const highUtilBudgets = budgets.filter(b => (b.utilization || 0) > 85);
  if (highUtilBudgets.length > 0) {
    dynamicAlerts.push({
      severity: 'critical',
      title: `${highUtilBudgets.length} budget${highUtilBudgets.length > 1 ? 's' : ''} > 85% utilized`,
      time: 'Live',
    });
  }
  if (pendingItems.length > 5) {
    dynamicAlerts.push({
      severity: 'warning',
      title: `${pendingItems.length} items awaiting approval`,
      time: 'Queue',
    });
  }
  if (pendingItems.length > 0 && pendingItems.length <= 5) {
    dynamicAlerts.push({
      severity: 'info',
      title: `${pendingItems.length} pending approval${pendingItems.length > 1 ? 's' : ''}`,
      time: 'Queue',
    });
  }
  const draftBudgets = budgetsByStatus['DRAFT'] || 0;
  if (draftBudgets > 0) {
    dynamicAlerts.push({
      severity: 'info',
      title: `${draftBudgets} draft budget${draftBudgets > 1 ? 's' : ''} not yet submitted`,
      time: 'Action',
    });
  }
  // Fallback static alerts if no real data
  if (dynamicAlerts.length === 0) {
    dynamicAlerts.push(
      { severity: 'critical', title: t('home.lowStockAlert'), time: t('home.timeAgo15m') },
      { severity: 'warning', title: t('home.budgetThresholdWarning'), time: t('home.timeAgo1h') },
      { severity: 'info', title: t('home.salesSpike'), time: t('home.timeAgo3h') },
    );
  }

  const alertCount = dynamicAlerts.length;
  const severityColor = { critical: 'bg-status-critical', warning: 'bg-status-warning', info: 'bg-status-info' };
  const severityBg = { critical: 'bg-status-critical-muted', warning: 'hover:bg-status-warning-muted', info: 'hover:bg-status-info-muted' };

  // Filter config
  const filters = [
    { key: 'season', label: t('home.season'), value: selectedSeason, options: SEASON_OPTIONS, onSelect: setSelectedSeason },
    { key: 'brand', label: t('home.brand'), value: selectedBrand === 'all' ? t('home.brand') : selectedBrand, options: ['all', ...brandOptions], onSelect: setSelectedBrand, displayFn: (v) => v === 'all' ? t('home.brand') : v },
    { key: 'region', label: t('home.region'), value: selectedRegion, options: REGION_OPTIONS, onSelect: setSelectedRegion }
  ];

  return (
    <div className="max-w-[1400px] mx-auto">

      {/* ── Command Bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="mr-auto">
          <h2 className="text-lg font-bold font-brand text-content leading-tight">{t('screenConfig.dashboard')}</h2>
          <p className="text-[10px] font-brand text-content-muted">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div ref={filterRef} className={`flex items-center gap-2 ${isMobile ? 'overflow-x-auto w-full order-3' : ''}`}>
          {filters.map((filter) => {
            const isActive = openFilter === filter.key;
            return (
              <div key={filter.key} className="relative">
                <button
                  onClick={() => setOpenFilter(isActive ? null : filter.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-brand transition-all duration-150 whitespace-nowrap ${
                    isActive ? 'bg-dafc-gold text-white' : 'bg-white text-content-secondary hover:bg-surface-secondary shadow-sm'
                  }`}
                >
                  <span className="font-semibold font-data">{filter.value}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                </button>
                {isActive && (
                  <div className="absolute top-full left-0 mt-2 min-w-[160px] rounded-2xl shadow-lg border overflow-hidden z-50 bg-white border-border-muted">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {filter.options.map((opt) => {
                        const display = filter.displayFn ? filter.displayFn(opt) : opt;
                        const isSelected = filter.key === 'brand' ? (opt === selectedBrand) : (opt === filter.value);
                        return (
                          <button key={opt} onClick={() => { filter.onSelect(opt); setOpenFilter(null); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                              isSelected ? 'bg-dafc-gold/8 text-dafc-gold' : 'text-content hover:bg-surface-secondary'
                            }`}>
                            <span className="font-medium font-brand">{display}</span>
                            {isSelected && <Check size={14} className="text-dafc-gold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-data bg-dafc-gold/15 text-dafc-gold-dark">
            <Bell size={12} strokeWidth={2.25} /> {alertCount}
          </span>
          <button onClick={() => { fetchEnrichedData(); }} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-150 text-content-muted hover:text-content-secondary hover:shadow-md">
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── Hero KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <IntelCard
          title={t('home.totalSales')}
          value={statsLoading ? '...' : (totalBudgetAmount > 0 ? fmtCurrency(totalBudgetAmount) : stats.totalSales)}
          trend={12.5} trendLabel="12.5%" icon={DollarSign} color="#C4975A" variant="bar"
          gaugeValue={budgets.length > 0 ? Math.round((budgets.filter(b => ['APPROVED', 'FINAL', 'LEVEL2_APPROVED'].includes((b.status || '').toUpperCase())).length / budgets.length) * 100) : 0}
          onClick={() => setExpandedCard({ key: 'totalSales', title: t('home.totalSales'), value: totalBudgetAmount > 0 ? fmtCurrency(totalBudgetAmount) : stats.totalSales, trend: 12.5, trendLabel: '12.5%', subtitle: `${budgets.length} budgets · ${fmtCurrency(totalBudgetAmount)} total` })}
        />
        <IntelCard
          title={t('home.budgetUtilization')}
          value={statsLoading ? '...' : stats.budgetUtilization}
          trend={8.2} trendLabel="8.2%" icon={Target} color="#1B6B45" variant="gauge"
          gaugeValue={parseFloat(stats.budgetUtilization) || 0} gaugeMax={100}
          onClick={() => setExpandedCard({ key: 'budgetUtilization', title: t('home.budgetUtilization'), value: stats.budgetUtilization, trend: 8.2, trendLabel: '8.2%', subtitle: t('home.thisMonth') })}
        />
        <IntelCard
          title={t('home.avgMargin')}
          value={statsLoading ? '...' : stats.avgMargin}
          trend={2.3} trendLabel="2.3%" icon={Percent} color="#2563EB" variant="gauge"
          gaugeValue={parseFloat(stats.avgMargin) || 0} gaugeMax={100}
          onClick={() => setExpandedCard({ key: 'avgMargin', title: t('home.avgMargin'), value: stats.avgMargin, trend: 2.3, trendLabel: '2.3%', subtitle: t('home.acrossCategories') })}
        />
        <IntelCard
          title={t('home.sellThrough')}
          value={statsLoading ? '...' : stats.sellThrough}
          trend={-1.5} trendLabel="1.5%" icon={ShoppingCart} color="#DC3545" variant="gauge"
          gaugeValue={parseFloat(stats.sellThrough) || 0} gaugeMax={100}
          onClick={() => setExpandedCard({ key: 'sellThrough', title: t('home.sellThrough'), value: stats.sellThrough, trend: -1.5, trendLabel: '1.5%', subtitle: t('home.currentSeasonPerformance') })}
        />
      </div>

      {/* ── Intelligence Grid — chart (2/3) + sidebar (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* Sales Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm cursor-pointer group/chart hover:shadow-md transition-all" onClick={() => navigateTo('analytics-sales')}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
              {t('home.salesPerformance')}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-[2px] rounded-full bg-dafc-gold"></span>
                <span className="text-[9px] font-brand text-content-muted">{t('home.actualSales')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-[2px] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #1B6B45 0, #1B6B45 3px, transparent 3px, transparent 6px)' }}></span>
                <span className="text-[9px] font-brand text-content-muted">{t('home.targetSales')}</span>
              </div>
              <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/chart:opacity-100 transition-opacity" />
            </div>
          </div>
          <svg viewBox="0 0 300 160" className="w-full" style={{ height: '100%' }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4975A" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#C4975A" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[30, 60, 90, 120].map((y) => (
              <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#F0EBE5" strokeWidth="0.5" />
            ))}
            <path d="M10,128 L42,118 L74,102 L106,95 L138,82 L170,72 L202,60 L234,50 L266,40 L266,140 L10,140 Z" fill="url(#salesFill)" />
            <polyline fill="none" stroke="#C4975A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              points="10,128 42,118 74,102 106,95 138,82 170,72 202,60 234,50 266,40" />
            <polyline fill="none" stroke="#1B6B45" strokeDasharray="4 3" strokeWidth="1.5" strokeLinecap="round"
              points="10,134 42,124 74,114 106,104 138,96 170,88 202,80 234,72 266,64" />
            {[[10,128],[42,118],[74,102],[106,95],[138,82],[170,72],[202,60],[234,50],[266,40]].map(([cx, cy], i) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" fill="#FFF" stroke="#C4975A" strokeWidth="1.5" />
            ))}
            {[
              { x: 10, m: 'jan' }, { x: 42, m: 'feb' }, { x: 74, m: 'mar' },
              { x: 106, m: 'apr' }, { x: 138, m: 'may' }, { x: 170, m: 'jun' },
              { x: 202, m: 'jul' }, { x: 234, m: 'aug' }, { x: 266, m: 'sep' },
            ].map((tick) => (
              <text key={tick.m} x={tick.x} y={155} textAnchor="middle" fontSize="7" fill="#8C8178" fontFamily="Montserrat" fontWeight="500">
                {t(`home.${tick.m}`)}
              </text>
            ))}
          </svg>
          <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-border-muted">
            {[
              { label: t('home.totalRevenue'), value: totalBudgetAmount > 0 ? fmtCurrency(totalBudgetAmount) : (statsLoading ? '...' : stats.totalSales), trend: '+12.5%', up: true },
              { label: t('home.monthlyGrowth'), value: '+8.2%', trend: t('home.aboveTarget'), up: true },
            ].map((s, i) => (
              <div key={s.label || i}>
                <p className="text-[9px] font-brand uppercase tracking-wider text-content-muted">{s.label}</p>
                <p className="text-base font-bold font-data tabular-nums mt-0.5 text-content">{s.value}</p>
                <span className={`text-[10px] font-semibold font-data ${s.up ? 'text-status-success' : 'text-status-critical'}`}>
                  {s.up ? '▲' : '▼'} {s.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Alerts + Approval Queue */}
        <div className="flex flex-col gap-3">

          {/* Dynamic Alerts — click navigates to approvals */}
          <div className="bg-white rounded-2xl p-3 shadow-sm cursor-pointer group/alerts hover:shadow-md transition-all" onClick={() => navigateTo('approvals')}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
                {t('home.activeAlerts')}
              </p>
              <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/alerts:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              {dynamicAlerts.slice(0, 4).map((alert, i) => (
                <div key={alert.title || i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                  i === 0 && alert.severity === 'critical' ? 'bg-status-critical-muted' : severityBg[alert.severity] || ''
                }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${severityColor[alert.severity]} ${
                    i === 0 && alert.severity === 'critical' ? 'ring-2 ring-status-critical/20' : ''
                  }`}></span>
                  <span className={`text-xs ${i === 0 ? 'font-semibold' : 'font-medium'} font-brand text-content flex-1 truncate`}>{alert.title}</span>
                  <span className="text-[10px] font-data text-content-secondary whitespace-nowrap">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Queue — click navigates to approvals */}
          <div className="bg-white rounded-2xl p-3 shadow-sm cursor-pointer group/queue hover:shadow-md transition-all" onClick={() => navigateTo('approvals')}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
                Approval Queue
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold font-data tabular-nums text-content">{pendingItems.length}</span>
                <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/queue:opacity-100 transition-opacity" />
              </div>
            </div>
            {pendingItems.length === 0 ? (
              <p className="text-xs text-content-muted font-brand py-2">All clear — no pending items</p>
            ) : (
              <div className="space-y-1.5">
                {[
                  { type: 'budget', icon: DollarSign, label: 'Budgets', color: '#C4975A', count: approvalsByType.budget || 0 },
                  { type: 'planning', icon: BarChart3, label: 'Planning', color: '#2563EB', count: approvalsByType.planning || 0 },
                  { type: 'proposal', icon: Package, label: 'Proposals', color: '#7C3AED', count: approvalsByType.proposal || 0 },
                ].filter(r => r.count > 0).map((row) => (
                  <div key={row.type} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                    <row.icon size={13} strokeWidth={2} style={{ color: row.color }} className="shrink-0" />
                    <span className="text-xs font-medium font-brand text-content flex-1">{row.label}</span>
                    <span className="text-xs font-bold font-data tabular-nums" style={{ color: row.color }}>{row.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Pipeline — click navigates to budget management */}
          {budgets.length > 0 && (
            <div className="bg-white rounded-2xl p-3 shadow-sm cursor-pointer group/pipe hover:shadow-md transition-all" onClick={() => navigateTo('budget-management')}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
                  Budget Pipeline
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-data tabular-nums text-content">{budgets.length}</span>
                  <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/pipe:opacity-100 transition-opacity" />
                </div>
              </div>
              <PipelineBar segments={budgetPipeline} total={budgets.length} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {budgetPipeline.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                    <span className="text-[9px] font-brand text-content-muted">{seg.label}</span>
                    <span className="text-[9px] font-bold font-data text-content-secondary">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Operations + Brand Budget + Proposals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* Operations Pulse */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">Operations Pulse</p>
          </div>
          {[
            { title: t('home.totalBrands'), value: brands.length > 0 ? String(brands.length) : stats.totalBrands, subtitle: `${brands.filter(b => (b.status || 'active') === 'active').length} active`, key: 'totalBrands', icon: Building2, color: '#D97706', screen: 'master-brands' },
            { title: t('home.categoriesTitle'), value: stats.categories, subtitle: t('home.productCategories'), key: 'categories', icon: Boxes, color: '#0891B2', screen: 'master-categories' },
            { title: t('home.pendingApprovals'), value: pendingItems.length > 0 ? String(pendingItems.length) : stats.pendingApprovals, subtitle: pendingItems.length === 0 ? 'All clear' : `${approvalsByType.budget || 0}B · ${approvalsByType.planning || 0}P · ${approvalsByType.proposal || 0}S`, key: 'pendingApprovals', icon: ClipboardCheck, color: '#7C3AED', screen: 'approvals' },
            { title: t('home.activePlans'), value: plans.length > 0 ? String(plans.length) : stats.activePlans, subtitle: plans.length > 0 ? `${plansByStatus.DRAFT || 0} draft · ${plansByStatus.FINAL || plansByStatus.APPROVED || 0} final` : 'No active plans', key: 'activePlans', icon: BarChart3, color: '#2563EB', screen: 'planning' },
          ].map((item) => (
            <button key={item.key}
              onClick={() => navigateTo(item.screen)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-150 hover:bg-surface-secondary group border-l-2 border-transparent hover:border-l-dafc-gold">
              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                <item.icon size={14} strokeWidth={2.25} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold font-brand text-content-secondary uppercase tracking-wider">{item.title}</p>
                <p className="text-[10px] text-content-muted">{item.subtitle}</p>
              </div>
              <span className={`text-sm font-bold font-data tabular-nums ${isEmptyValue(item.value) ? 'text-content-muted' : 'text-content'}`}>
                {isEmptyValue(item.value) ? '0' : item.value}
              </span>
              <ArrowUpRight size={10} className="text-content-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>

        {/* Top Brands by Budget */}
        <div className="bg-white rounded-2xl p-3 shadow-sm cursor-pointer group/brands hover:shadow-md transition-all" onClick={() => navigateTo('budget-management')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
              Top Brands by Budget
            </p>
            <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/brands:opacity-100 transition-opacity" />
          </div>
          {topBrands.length === 0 ? (
            <p className="text-xs text-content-muted font-brand py-3">No budget data available</p>
          ) : (
            <div className="space-y-2">
              {topBrands.map((brand, i) => (
                <div key={brand.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium font-brand text-content truncate">{brand.name}</span>
                    <span className="text-[11px] font-bold font-data tabular-nums text-content-secondary ml-2">{fmtCurrency(brand.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-border-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(brand.amount / maxBrandBudget) * 100}%`, backgroundColor: i === 0 ? '#C4975A' : i === 1 ? '#1B6B45' : '#2563EB' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proposal Summary */}
        <div className="bg-white rounded-2xl p-3 shadow-sm cursor-pointer group/proposals hover:shadow-md transition-all" onClick={() => navigateTo('proposal')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold font-brand uppercase tracking-[0.12em] text-content-secondary">
              Proposal Summary
            </p>
            <ArrowUpRight size={11} className="text-content-muted opacity-0 group-hover/proposals:opacity-100 transition-opacity" />
          </div>
          {proposals.length === 0 ? (
            <p className="text-xs text-content-muted font-brand py-3">No proposals yet</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-brand uppercase tracking-wider text-content-muted">Proposals</p>
                  <p className="text-lg font-bold font-data tabular-nums text-content">{proposals.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-brand uppercase tracking-wider text-content-muted">Total SKUs</p>
                  <p className="text-lg font-bold font-data tabular-nums text-content">{totalSkuCount}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-brand uppercase tracking-wider text-content-muted">Total Value</p>
                <p className="text-lg font-bold font-data tabular-nums text-content">{fmtCurrency(totalProposalValue)}</p>
              </div>
              {/* Proposal status breakdown */}
              <div className="space-y-1">
                {Object.entries(
                  proposals.reduce((acc, p) => {
                    const st = (p.status || 'DRAFT').toUpperCase();
                    acc[st] = (acc[st] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#8C8178' }}></span>
                      <span className="text-[10px] font-brand text-content-muted">{status.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[10px] font-bold font-data text-content-secondary">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Detail Modal */}
      {expandedCard && (
        <KPIDetailModal
          isOpen={!!expandedCard}
          onClose={() => setExpandedCard(null)}
          cardKey={expandedCard.key}
          title={expandedCard.title}
          icon={CARD_CONFIG[expandedCard.key]?.icon}
          accent={CARD_CONFIG[expandedCard.key]?.accent}
          currentValue={expandedCard.value}
          trend={expandedCard.trend}
          trendLabel={expandedCard.trendLabel}
          subtitle={expandedCard.subtitle}
        />
      )}
    </div>
  );
};

export default HomeScreen;
