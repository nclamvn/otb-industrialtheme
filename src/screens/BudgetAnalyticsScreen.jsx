'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, Percent, Bell, Zap, RefreshCw, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { analyticsService, masterDataService } from '../services';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Common';
import { useLanguage } from '@/contexts/LanguageContext';

const SEASONS = ['SS', 'FW'];

const severityConfig = {
  critical: { icon: AlertTriangle, color: '#DC3545', bg: 'bg-red-500/10', label: 'Critical' },
  warning: { icon: AlertCircle, color: '#D97706', bg: 'bg-yellow-500/10', label: 'Warning' },
  info: { icon: Info, color: '#2563EB', bg: 'bg-blue-500/10', label: 'Info' },
};

const BudgetAnalyticsScreen = () => {
  const { t } = useLanguage();

  const [seasonGroup, setSeasonGroup] = useState('SS');
  const [groupBrandId, setGroupBrandId] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({});
  const [utilizationTrend, setUtilizationTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [efficiency, setEfficiency] = useState([]);

  useEffect(() => {
    masterDataService.getBrands().then(data => {
      const list = Array.isArray(data) ? data : [];
      setBrands(list);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { seasonGroup, ...(groupBrandId ? { groupBrandId } : {}) };
      const [sumRes, trendRes, alertRes, effRes] = await Promise.allSettled([
        analyticsService.getBudgetSummary(params),
        analyticsService.getUtilizationTrend(params),
        analyticsService.getBudgetAlerts(params),
        analyticsService.getAllocationEfficiency({ ...params, fiscalYear: 2024 }),
      ]);
      setSummary(sumRes.status === 'fulfilled' && sumRes.value ? sumRes.value : {});
      setUtilizationTrend(trendRes.status === 'fulfilled' && Array.isArray(trendRes.value) ? trendRes.value : []);
      setAlerts(alertRes.status === 'fulfilled' && Array.isArray(alertRes.value) ? alertRes.value : []);
      setEfficiency(effRes.status === 'fulfilled' && Array.isArray(effRes.value) ? effRes.value : []);
      const allFailed = [sumRes, trendRes, alertRes, effRes].every(r => r.status === 'rejected');
      if (allFailed) {
        setError('Analytics endpoints are not available yet');
      }
    } catch (err) {
      console.error('Failed to fetch budget analytics:', err);
      setError(err.message || 'Failed to load budget analytics');
    } finally {
      setLoading(false);
    }
  }, [seasonGroup, groupBrandId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group snapshots by budgetCode for the line chart
  const trendLines = useMemo(() => {
    const grouped = {};
    for (const snap of utilizationTrend) {
      const code = snap.budget?.budgetCode || snap.budgetId;
      if (!grouped[code]) grouped[code] = { code, points: [] };
      grouped[code].points.push({
        date: new Date(snap.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        utilization: Number(snap.utilizationPct),
      });
    }
    return Object.values(grouped);
  }, [utilizationTrend]);

  // Group alerts by severity
  const alertGroups = useMemo(() => {
    const groups = { critical: [], warning: [], info: [] };
    for (const a of alerts) {
      if (groups[a.severity]) groups[a.severity].push(a);
    }
    return groups;
  }, [alerts]);

  const bg = 'bg-[#FAF8F5]';
  const cardBg = 'bg-white';
  const border = 'border-[#E8E2DB]';
  const text = 'text-[#2C2417]';
  const subtext = 'text-[#6B5D4F]';
  const accent = '#C4975A';

  if (loading) return (
    <div className={`flex-1 ${bg} p-6`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E8E2DB] p-4 animate-pulse">
            <div className="h-3 w-20 bg-[#E8E2DB] rounded mb-3" />
            <div className="h-6 w-28 bg-[#E8E2DB] rounded mb-2" />
            <div className="h-3 w-16 bg-[#E8E2DB] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E8E2DB] p-6 animate-pulse">
        <div className="h-4 w-40 bg-[#E8E2DB] rounded mb-4" />
        <div className="h-48 bg-[#E8E2DB] rounded" />
      </div>
    </div>
  );
  if (error) return <div className={`flex-1 ${bg} p-6`}><ErrorMessage message={error} onRetry={fetchData} /></div>;

  return (
    <div className={`flex-1 ${bg} ${text} p-6 overflow-y-auto`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.budgetAnalytics', 'Budget Analytics')}</h1>
          <p className={subtext}>{t('analytics.budgetDesc', 'Budget utilization trends and variance alerts')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={seasonGroup} onChange={e => setSeasonGroup(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${border} ${cardBg} ${text} text-sm`}>
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={groupBrandId} onChange={e => setGroupBrandId(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${border} ${cardBg} ${text} text-sm`}>
            <option value="">{t('budget.brand')}</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button onClick={fetchData} className="p-2 rounded-lg border" style={{ borderColor: accent, color: accent }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: t('analytics.totalBudget', 'Total Budget'), value: formatCurrency(summary.totalBudget || 0), icon: Wallet, color: '#C4975A' },
          { label: t('analytics.avgUtilization', 'Avg Utilization'), value: `${(summary.avgUtilization || 0).toFixed(1)}%`, icon: Percent, color: '#1B6B45' },
          { label: t('analytics.unreadAlerts', 'Unread Alerts'), value: summary.unreadAlerts || 0, icon: Bell, color: '#DC3545' },
          { label: t('analytics.allocEfficiency', 'Alloc Efficiency'), value: `${(summary.avgEfficiency || 0).toFixed(1)}%`, icon: Zap, color: '#D4B082' },
        ].map((kpi, i) => (
          <div key={i} className={`${cardBg} border ${border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${subtext} uppercase tracking-wide`}>{kpi.label}</span>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <div className="text-xl font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Utilization Trend Chart */}
      <div className={`${cardBg} border ${border} rounded-xl p-4 mb-6`}>
        <h3 className="font-semibold mb-4">{t('analytics.utilizationTrend', 'Utilization Trend (30 Days)')}</h3>
        {trendLines.length > 0 ? (
          <div className="space-y-4">
            {trendLines.slice(0, 4).map((line, li) => (
              <div key={li}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono" style={{ color: accent }}>{line.code}</span>
                  <span className={`text-xs ${subtext}`}>
                    {line.points.length > 0 ? `${line.points[line.points.length - 1].utilization.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <svg viewBox={`0 0 ${line.points.length * 20} 40`} className="w-full h-10">
                  <polyline
                    fill="none" stroke={accent} strokeWidth="1.5"
                    points={line.points.map((p, pi) => `${pi * 20 + 10},${40 - p.utilization * 0.4}`).join(' ')}
                  />
                  {line.points.map((p, pi) => (
                    <circle key={pi} cx={pi * 20 + 10} cy={40 - p.utilization * 0.4} r="2" fill={accent} />
                  ))}
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message={t('analytics.noTrendData', 'No trend data available')} />
        )}
      </div>

      {/* Alerts Panel & Efficiency Table side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Alerts */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bell size={16} style={{ color: '#DC3545' }} />
            {t('analytics.budgetAlerts', 'Budget Alerts')} ({alerts.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {['critical', 'warning', 'info'].map(sev => {
              const items = alertGroups[sev] || [];
              if (items.length === 0) return null;
              const cfg = severityConfig[sev];
              const Icon = cfg.icon;
              return (
                <div key={sev}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} style={{ color: cfg.color }} />
                    <span className="text-xs font-semibold uppercase" style={{ color: cfg.color }}>{cfg.label} ({items.length})</span>
                  </div>
                  {items.map((a, i) => (
                    <div key={i} className={`${cfg.bg} rounded-lg p-2 mb-1 text-xs`}>
                      <div className="font-semibold">{a.title}</div>
                      <div className={subtext}>{a.message}</div>
                    </div>
                  ))}
                </div>
              );
            })}
            {alerts.length === 0 && <EmptyState message={t('analytics.noAlerts', 'No alerts')} />}
          </div>
        </div>

        {/* Allocation Efficiency */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap size={16} style={{ color: '#D4B082' }} />
            {t('analytics.allocEfficiencyTable', 'Allocation Efficiency')}
          </h3>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${subtext} text-xs uppercase`}>
                  <th className="text-left pb-2">{t('analytics.dimension', 'Dimension')}</th>
                  <th className="text-right pb-2">{t('analytics.allocated', 'Allocated')}</th>
                  <th className="text-right pb-2">{t('analytics.actual', 'Actual')}</th>
                  <th className="text-right pb-2">{t('analytics.efficiency', 'Efficiency')}</th>
                </tr>
              </thead>
              <tbody>
                {efficiency.filter(e => e.actualSales).slice(0, 15).map((row, i) => (
                  <tr key={i} className={`border-t ${border}`}>
                    <td className="py-2">
                      <div className="text-xs font-medium">{row.dimensionValue}</div>
                      <div className={`text-xs ${subtext}`}>{row.dimensionType}</div>
                    </td>
                    <td className="py-2 text-right text-xs">{formatCurrency(Number(row.allocatedAmount))}</td>
                    <td className="py-2 text-right text-xs">{formatCurrency(Number(row.actualSales))}</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        row.efficiency > 90 ? 'bg-green-500/10 text-green-500' :
                        row.efficiency > 75 ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {row.efficiency?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {efficiency.filter(e => e.actualSales).length === 0 && <EmptyState message={t('analytics.noEffData', 'No efficiency data')} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalyticsScreen;
