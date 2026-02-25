'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../services';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../components/Common';
import { useLanguage } from '@/contexts/LanguageContext';

const SEASONS = ['SS', 'FW'];
const YEARS = [2024, 2025];
const ATTR_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'color', label: 'Color' },
  { value: 'composition', label: 'Composition' },
  { value: 'product_type', label: 'Product Type' },
];

const CategoryTrendsScreen = () => {
  const { t } = useLanguage();

  const [seasonGroup, setSeasonGroup] = useState('SS');
  const [fiscalYear, setFiscalYear] = useState(2025);
  const [attributeType, setAttributeType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [trendAttributes, setTrendAttributes] = useState([]);
  const [yoyComparison, setYoyComparison] = useState([]);
  const [genderBreakdown, setGenderBreakdown] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { seasonGroup, fiscalYear, ...(attributeType ? { attributeType } : {}) };
      const [trends, yoy, gender] = await Promise.all([
        analyticsService.getTrendAttributes(params),
        analyticsService.getYoyComparison({ seasonGroup, attributeType: attributeType || 'color' }),
        analyticsService.getGenderBreakdown({ seasonGroup, fiscalYear }),
      ]);
      setTrendAttributes(Array.isArray(trends) ? trends : []);
      setYoyComparison(Array.isArray(yoy) ? yoy : []);
      setGenderBreakdown(Array.isArray(gender) ? gender : []);
    } catch (err) {
      console.error('Failed to fetch trend data:', err);
      setError(err.message || 'Failed to load category trends');
      toast.error('Failed to load category trends');
    } finally {
      setLoading(false);
    }
  }, [seasonGroup, fiscalYear, attributeType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = useMemo(() => {
    const totalAttrs = trendAttributes.length;
    const avgTrendScore = totalAttrs > 0
      ? trendAttributes.reduce((s, a) => s + (a.trendScore || 0), 0) / totalAttrs
      : 0;
    const yoyItems = yoyComparison.filter(y => y.yoyGrowth != null);
    const avgYoyGrowth = yoyItems.length > 0
      ? yoyItems.reduce((s, y) => s + Number(y.yoyGrowth), 0) / yoyItems.length
      : 0;
    return { totalAttrs, avgTrendScore, avgYoyGrowth };
  }, [trendAttributes, yoyComparison]);

  const maxTrendScore = useMemo(() =>
    Math.max(...trendAttributes.map(a => a.trendScore || 0), 1)
  , [trendAttributes]);

  const bg = 'bg-[#FAF8F5]';
  const cardBg = 'bg-[#FFFFFF]';
  const border = 'border-[#E8E2DB]';
  const text = 'text-[#2C2417]';
  const subtext = 'text-[#6B5D4F]';
  const accent = '#C4975A';

  if (loading) return <div className={`flex-1 ${bg} flex items-center justify-center`}><LoadingSpinner /></div>;
  if (error) return <div className={`flex-1 ${bg} p-6`}><ErrorMessage message={error} onRetry={fetchData} /></div>;

  return (
    <div className={`flex-1 ${bg} ${text} p-6 overflow-y-auto`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('analytics.categoryTrends', 'Category Trends')}</h1>
          <p className={subtext}>{t('analytics.trendsDesc', 'Attribute trends, YoY comparison, and gender breakdown')}</p>
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
          <select value={attributeType} onChange={e => setAttributeType(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${border} ${cardBg} ${text} text-sm`}>
            {ATTR_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
          </select>
          <button onClick={fetchData} className="p-2 rounded-lg border" style={{ borderColor: accent, color: accent }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t('analytics.totalAttributes', 'Total Attributes'), value: kpis.totalAttrs, icon: BarChart3, color: '#C4975A' },
          { label: t('analytics.avgTrendScore', 'Avg Trend Score'), value: kpis.avgTrendScore.toFixed(0), icon: Activity, color: '#1B6B45' },
          { label: t('analytics.avgYoyGrowth', 'Avg YoY Growth'), value: `${kpis.avgYoyGrowth >= 0 ? '+' : ''}${kpis.avgYoyGrowth.toFixed(1)}%`, icon: kpis.avgYoyGrowth >= 0 ? ArrowUpRight : ArrowDownRight, color: kpis.avgYoyGrowth >= 0 ? '#1B6B45' : '#DC3545' },
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

      {/* Trend Score Ranking - Horizontal Bar Chart */}
      <div className={`${cardBg} border ${border} rounded-xl p-4 mb-6`}>
        <h3 className="font-semibold mb-4">{t('analytics.trendScoreRanking', 'Trend Score Ranking')}</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {trendAttributes.slice(0, 20).map((attr, i) => {
            const pct = (attr.trendScore / maxTrendScore) * 100;
            const typeColor = attr.attributeType === 'color' ? '#3B82F6'
              : attr.attributeType === 'composition' ? '#8B5CF6'
              : attr.attributeType === 'product_type' ? accent
              : '#6B7280';
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs w-32 truncate`}>{attr.attributeValue}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${typeColor}22`, color: typeColor }}>
                  {attr.attributeType}
                </span>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: '#F0EBE5' }}>
                  <div className="h-full rounded flex items-center px-2" style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: typeColor }}>
                    <span className="text-xs font-bold text-white">{attr.trendScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {trendAttributes.length === 0 && <EmptyState message={t('analytics.noTrends', 'No trend data')} />}
        </div>
      </div>

      {/* YoY Comparison & Gender Breakdown side-by-side */}
      <div className="grid grid-cols-2 gap-4">
        {/* YoY Comparison Table */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3">{t('analytics.yoyComparison', 'Year-over-Year Comparison')}</h3>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`${subtext} text-xs uppercase`}>
                  <th className="text-left pb-2">{t('analytics.attribute', 'Attribute')}</th>
                  <th className="text-right pb-2">{t('analytics.trendScore', 'Score')}</th>
                  <th className="text-right pb-2">{t('analytics.yoyGrowth', 'YoY')}</th>
                  <th className="text-right pb-2">{t('analytics.avgSellThrough', 'ST%')}</th>
                </tr>
              </thead>
              <tbody>
                {yoyComparison.slice(0, 15).map((row, i) => {
                  const growth = Number(row.yoyGrowth);
                  return (
                    <tr key={i} className={`border-t ${border}`}>
                      <td className="py-2">
                        <div className="text-xs font-medium">{row.attributeValue}</div>
                        <div className={`text-xs ${subtext}`}>{row.attributeType}</div>
                      </td>
                      <td className="py-2 text-right">{row.trendScore}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${growth >= 0 ? 'text-[#1B6B45]' : 'text-[#DC3545]'}`}>
                          {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-xs">{Number(row.avgSellThrough).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {yoyComparison.length === 0 && <EmptyState message={t('analytics.noYoYData', 'No YoY data')} />}
          </div>
        </div>

        {/* Gender Breakdown Panel */}
        <div className={`${cardBg} border ${border} rounded-xl p-4`}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users size={16} style={{ color: accent }} />
            {t('analytics.genderBreakdown', 'Gender Breakdown')}
          </h3>
          <div className="space-y-4">
            {genderBreakdown.map((g, i) => (
              <div key={i} className={`rounded-lg p-3 border ${border}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{g.gender}</span>
                  <span className="text-sm" style={{ color: accent }}>{g.totalSkus} SKUs</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={`text-xs ${subtext}`}>{t('analytics.sellThrough', 'Sell-Through')}</div>
                    <div className="text-sm font-bold">{g.avgSellThrough}%</div>
                  </div>
                  <div>
                    <div className={`text-xs ${subtext}`}>{t('analytics.margin', 'Margin')}</div>
                    <div className="text-sm font-bold">{g.avgMargin}%</div>
                  </div>
                  <div>
                    <div className={`text-xs ${subtext}`}>{t('analytics.trendScore', 'Trend')}</div>
                    <div className="text-sm font-bold">{g.avgTrendScore}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.categories?.map((cat, ci) => (
                    <span key={ci} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${accent}22`, color: accent }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {genderBreakdown.length === 0 && <EmptyState message={t('analytics.noGenderData', 'No gender data')} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryTrendsScreen;
