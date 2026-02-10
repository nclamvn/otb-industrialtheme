'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Award, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { analyticsService } from '../services';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Common';
import { useLanguage } from '@/contexts/LanguageContext';

const SEASONS = ['SS', 'FW'];
const YEARS = [2023, 2024, 2025];

const SalesPerformanceScreen = ({ darkMode = false }) => {
  const { t } = useLanguage();

  const [seasonGroup, setSeasonGroup] = useState('SS');
  const [fiscalYear, setFiscalYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [topSkus, setTopSkus] = useState([]);
  const [bottomSkus, setBottomSkus] = useState([]);
  const [salesByDimension, setSalesByDimension] = useState([]);
  const [sellThroughSummary, setSellThroughSummary] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { seasonGroup, fiscalYear, limit: 10 };
      const [top, bottom, dims, stSummary] = await Promise.all([
        analyticsService.getTopSkus(params),
        analyticsService.getBottomSkus(params),
        analyticsService.getSalesByDimension({ ...params, dimensionType: 'category' }),
        analyticsService.getSellThroughSummary(params),
      ]);
      setTopSkus(Array.isArray(top) ? top : []);
      setBottomSkus(Array.isArray(bottom) ? bottom : []);
      setSalesByDimension(Array.isArray(dims) ? dims : []);
      setSellThroughSummary(Array.isArray(stSummary) ? stSummary : []);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setError(err.message || 'Failed to load sales analytics');
      toast.error('Failed to load sales analytics');
    } finally {
      setLoading(false);
    }
  }, [seasonGroup, fiscalYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = useMemo(() => {
    const totalRevenue = topSkus.reduce((s, r) => s + Number(r.totalRevenue || 0), 0);
    const avgSellThrough = topSkus.length > 0
      ? topSkus.reduce((s, r) => s + Number(r.sellThroughPct || 0), 0) / topSkus.length
      : 0;
    const avgMargin = topSkus.length > 0
      ? topSkus.reduce((s, r) => s + Number(r.grossMarginPct || 0), 0) / topSkus.length
      : 0;
    const topScore = topSkus.length > 0 ? topSkus[0]?.performanceScore || 0 : 0;
    return { totalRevenue, avgSellThrough, avgMargin, topScore };
  }, [topSkus]);

  const maxDimAmount = useMemo(() =>
    Math.max(...salesByDimension.map(d => Number(d.allocatedAmount || 0)), 1)
  , [salesByDimension]);

  const bg = darkMode ? 'bg-[#0A0A0A]' : 'bg-[#fdfbf9]';
  const cardBg = darkMode ? 'bg-[#111]' : 'bg-white';
  const border = darkMode ? 'border-[#222]' : 'border-[#e5e0da]';
  const text = darkMode ? 'text-gray-200' : 'text-gray-800';
  const subtext = darkMode ? 'text-gray-400' : 'text-gray-500';
  const accent = '#D7B797';

  if (loading) return <div className={`flex-1 ${bg} flex items-center justify-center`}><LoadingSpinner /></div>;
  if (error) return <div className={`flex-1 ${bg} p-6`}><ErrorMessage message={error} onRetry={fetchData} /></div>;

  return (
    <div className={`flex-1 ${bg} ${text} p-6 overflow-y-auto`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.salesPerformance', 'Sales Performance')}</h1>
          <p className={subtext}>{t('analytics.salesDesc', 'SKU performance analysis and sell-through metrics')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={seasonGroup} onChange={e => setSeasonGroup(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${border} ${cardBg} ${text} text-sm`}>
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))}
            className={`px-3 py-2 rounded-lg border ${border} ${cardBg} ${text} text-sm`}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchData} className="p-2 rounded-lg border" style={{ borderColor: accent, color: accent }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: t('analytics.totalRevenue', 'Total Revenue'), value: formatCurrency(kpis.totalRevenue), icon: DollarSign, color: '#D7B797' },
          { label: t('analytics.avgSellThrough', 'Avg Sell-Through'), value: `${kpis.avgSellThrough.toFixed(1)}%`, icon: Target, color: '#2A9E6A' },
          { label: t('analytics.avgGrossMargin', 'Avg Gross Margin'), value: `${kpis.avgMargin.toFixed(1)}%`, icon: TrendingUp, color: '#3B82F6' },
          { label: t('analytics.topScore', 'Top Score'), value: kpis.topScore, icon: Award, color: '#E3B341' },
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

      {/* Top & Bottom SKUs side-by-side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Top SKUs */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" />
            {t('analytics.topSkus', 'Top Performing SKUs')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${subtext} text-xs uppercase`}>
                  <th className="text-left pb-2">{t('analytics.sku', 'SKU')}</th>
                  <th className="text-right pb-2">{t('analytics.score', 'Score')}</th>
                  <th className="text-right pb-2">{t('analytics.sellThrough', 'ST%')}</th>
                  <th className="text-right pb-2">{t('analytics.revenue', 'Revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {topSkus.slice(0, 8).map((sku, i) => (
                  <tr key={i} className={`border-t ${border}`}>
                    <td className="py-2 font-mono text-xs">{sku.skuCode}</td>
                    <td className="py-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: `${accent}22`, color: accent }}>
                        {sku.performanceScore}
                      </span>
                    </td>
                    <td className="py-2 text-right">{Number(sku.sellThroughPct).toFixed(1)}%</td>
                    <td className="py-2 text-right text-xs">{formatCurrency(Number(sku.totalRevenue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom SKUs */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" />
            {t('analytics.bottomSkus', 'Bottom Performing SKUs')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${subtext} text-xs uppercase`}>
                  <th className="text-left pb-2">{t('analytics.sku', 'SKU')}</th>
                  <th className="text-right pb-2">{t('analytics.score', 'Score')}</th>
                  <th className="text-right pb-2">{t('analytics.sellThrough', 'ST%')}</th>
                  <th className="text-right pb-2">{t('analytics.margin', 'Margin')}</th>
                </tr>
              </thead>
              <tbody>
                {bottomSkus.slice(0, 8).map((sku, i) => (
                  <tr key={i} className={`border-t ${border}`}>
                    <td className="py-2 font-mono text-xs">{sku.skuCode}</td>
                    <td className="py-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-500">
                        {sku.performanceScore}
                      </span>
                    </td>
                    <td className="py-2 text-right">{Number(sku.sellThroughPct).toFixed(1)}%</td>
                    <td className="py-2 text-right">{Number(sku.grossMarginPct).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sales by Category - Bar Chart */}
      <div className={`${cardBg} border ${border} rounded-xl p-4 mb-6`}>
        <h3 className="font-semibold mb-4">{t('analytics.salesByCategory', 'Sales by Category')}</h3>
        <div className="space-y-3">
          {salesByDimension.map((dim, i) => {
            const pct = (Number(dim.allocatedAmount) / maxDimAmount) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-sm w-36 truncate ${subtext}`}>{dim.dimensionValue}</span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ backgroundColor: darkMode ? '#1a1a1a' : '#f3f0ec' }}>
                  <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: accent }}>
                    <span className="text-xs font-semibold text-black whitespace-nowrap">{Number(dim.allocatedPct).toFixed(1)}%</span>
                  </div>
                </div>
                <span className="text-xs w-28 text-right">{formatCurrency(Number(dim.allocatedAmount))}</span>
              </div>
            );
          })}
          {salesByDimension.length === 0 && <EmptyState message={t('analytics.noData', 'No data available')} />}
        </div>
      </div>

      {/* Sell-Through Summary Table */}
      <div className={`${cardBg} border ${border} rounded-xl p-4`}>
        <h3 className="font-semibold mb-3">{t('analytics.sellThroughSummary', 'Sell-Through Summary by Product Type')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${subtext} text-xs uppercase`}>
                <th className="text-left pb-2">{t('analytics.productType', 'Product Type')}</th>
                <th className="text-right pb-2">{t('analytics.skuCount', 'SKUs')}</th>
                <th className="text-right pb-2">{t('analytics.avgSellThrough', 'Avg ST%')}</th>
                <th className="text-right pb-2">{t('analytics.avgMargin', 'Avg Margin')}</th>
                <th className="text-right pb-2">{t('analytics.totalRevenue', 'Total Revenue')}</th>
                <th className="text-right pb-2">{t('analytics.perfScore', 'Perf Score')}</th>
              </tr>
            </thead>
            <tbody>
              {sellThroughSummary.map((row, i) => (
                <tr key={i} className={`border-t ${border}`}>
                  <td className="py-2 font-medium">{row.productType}</td>
                  <td className="py-2 text-right">{row.count}</td>
                  <td className="py-2 text-right">{row.avgSellThrough}%</td>
                  <td className="py-2 text-right">{row.avgMargin}%</td>
                  <td className="py-2 text-right">{formatCurrency(row.totalRevenue)}</td>
                  <td className="py-2 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: `${accent}22`, color: accent }}>
                      {row.avgPerformanceScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPerformanceScreen;
