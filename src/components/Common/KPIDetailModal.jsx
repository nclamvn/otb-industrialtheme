'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, Download, AlertTriangle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKPIBreakdown } from '../../hooks/useKPIBreakdown';
import { useLanguage } from '@/contexts/LanguageContext';

const ROUTE_MAP = {
  totalSales: '/budget-management',
  budgetUtilization: '/budget-management',
  avgMargin: '/otb-analysis',
  sellThrough: '/otb-analysis',
  totalBrands: '/master-data/brands',
  categories: '/master-data/categories',
  pendingApprovals: '/approvals',
  activePlans: '/planning',
};

const BREAKDOWN_LABEL_KEY = {
  totalSales: 'byBrand',
  budgetUtilization: 'byStatus',
  avgMargin: 'byCategory',
  sellThrough: 'byCollection',
  totalBrands: 'byBrand',
  categories: 'byCategory',
  pendingApprovals: 'byEntityType',
  activePlans: 'byStatus',
};

const BAR_COLORS = [
  '#C4975A', '#1B6B45', '#2563EB', '#DC3545',
  '#D97706', '#0891B2', '#7C3AED',
];

// Shimmer skeleton block
const Skeleton = ({ className }) => (
  <div
    className={`rounded animate-pulse bg-[#F0EBE5] ${className}`}
  />
);

const KPIDetailModal = ({
  isOpen,
  onClose,
  cardKey,
  title,
  icon: Icon,
  accent,
  darkMode,
  currentValue,
  trend,
  trendLabel,
  subtitle,
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { loading, error, data, retry, accentColor } = useKPIBreakdown(cardKey, isOpen);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Portal mount point
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  const borderColor = 'border-[#E8E2DB]';
  const textMuted = 'text-[#8C8178]';
  const textPrimary = 'text-[#2C2417]';
  const textSecondary = 'text-[#6B5D4F]';
  const panelBg = 'bg-[#FBF9F7]';
  const breakdownLabel = t(`home.kpiDetail.${BREAKDOWN_LABEL_KEY[cardKey] || 'breakdown'}`);

  const chartMax = data?.chartData
    ? Math.max(...data.chartData.map(d => d.value), 1)
    : 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop - covers entire viewport including sidebar/header */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-4xl max-h-[85vh] overflow-y-auto border ${borderColor} rounded-2xl shadow-2xl animate-scale-in bg-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-5 border-b ${borderColor} bg-white`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Icon size={20} color={accentColor} />
              </div>
            )}
            <div>
              <h2 className={`text-lg font-bold font-brand ${textPrimary}`}>{title}</h2>
              <p className={`text-xs ${textMuted}`}>{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150 bg-white border-[#E8E2DB] text-[#6B5D4F] hover:bg-red-50 hover:text-red-500 hover:border-red-300`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Error state */}
          {error && !loading && (
            <div className={`flex flex-col items-center justify-center py-12 gap-3`}>
              <AlertTriangle size={32} className="text-[#DC3545]" />
              <p className={`text-sm ${textSecondary}`}>{t('home.kpiDetail.errorLoading')}</p>
              <button
                onClick={retry}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors bg-[rgba(196,151,90,0.2)] text-[#6B4D30] hover:bg-[rgba(196,151,90,0.3)]"
              >
                {t('home.kpiDetail.retry')}
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-14 w-3/4" />
                <Skeleton className="h-14 w-1/2" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          )}

          {/* Loaded content */}
          {!loading && !error && data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Column 1: Value Panel */}
              <div className="space-y-4">
                {/* Big number */}
                <div className={`border ${borderColor} rounded-xl p-4 ${panelBg}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMuted} font-brand`}>
                    {t('home.kpiDetail.currentValue')}
                  </p>
                  <div
                    className={`mt-2 text-3xl font-bold font-data tabular-nums`}
                    style={{ color: accentColor }}
                  >
                    {currentValue}
                  </div>
                  {trendLabel && (
                    <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-xs font-semibold font-data rounded ${
                      trend > 0
                        ? 'bg-[rgba(27,107,69,0.12)] text-[#1B6B45]'
                        : 'bg-[rgba(220,53,69,0.10)] text-[#DC3545]'
                    }`}>
                      {trend > 0 ? '\u25B2' : '\u25BC'} {trendLabel}
                    </span>
                  )}
                  <p className={`mt-2 text-xs ${textMuted}`}>{t('home.kpiDetail.vsLastPeriod')}</p>
                </div>

                {/* Alerts */}
                <div className={`border ${borderColor} rounded-xl p-4 ${panelBg}`}>
                  <p className={`text-xs font-medium uppercase tracking-wider ${textMuted} font-brand mb-3`}>
                    {t('home.kpiDetail.activeAlerts')}
                  </p>
                  {data.alerts.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <Info size={14} className={textMuted} />
                      <span className={`text-xs ${textMuted}`}>{t('home.kpiDetail.noAlerts')}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.alerts.slice(0, 3).map((alert, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                            alert.severity === 'critical'
                              ? 'bg-[rgba(220,53,69,0.1)] text-[#DC3545]'
                              : 'bg-[rgba(217,119,6,0.1)] text-[#D97706]'
                          }`}
                        >
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Chart Panel */}
              <div className={`border ${borderColor} rounded-xl p-4 ${panelBg}`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMuted} font-brand mb-4`}>
                  {t('home.kpiDetail.trendAnalysis')}
                </p>
                {data.chartData.length > 0 ? (
                  <svg viewBox="0 0 220 160" className="w-full">
                    {data.chartData.slice(0, 7).map((d, i) => {
                      const barH = Math.max((d.value / chartMax) * 120, 4);
                      const x = 8 + i * 30;
                      return (
                        <g key={i}>
                          <rect
                            x={x}
                            y={140 - barH}
                            width={22}
                            height={barH}
                            rx={4}
                            fill={BAR_COLORS[i % BAR_COLORS.length]}
                            opacity={0.85}
                            className="transition-all duration-700"
                          />
                          <text
                            x={x + 11}
                            y={154}
                            textAnchor="middle"
                            fontSize="7"
                            fill="#8C8178"
                            fontFamily="Montserrat"
                          >
                            {d.label.length > 5 ? d.label.slice(0, 5) + '..' : d.label}
                          </text>
                          <text
                            x={x + 11}
                            y={140 - barH - 4}
                            textAnchor="middle"
                            fontSize="7"
                            fill="#6B5D4F"
                            fontFamily="JetBrains Mono"
                          >
                            {d.value}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <span className={`text-xs ${textMuted}`}>{t('home.kpiDetail.noData')}</span>
                  </div>
                )}
              </div>

              {/* Column 3: Breakdown Panel */}
              <div className={`border ${borderColor} rounded-xl p-4 ${panelBg}`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMuted} font-brand mb-4`}>
                  {breakdownLabel}
                </p>
                {data.breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {data.breakdown.slice(0, 8).map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${textPrimary} font-brand truncate max-w-[60%]`}>
                            {item.label}
                          </span>
                          <span className={`text-xs font-data tabular-nums ${textSecondary}`}>
                            {typeof item.value === 'number' && item.value > 999
                              ? `${(item.value / 1_000_000).toFixed(1)}M`
                              : item.value}
                            {item.pct != null && ` (${item.pct}%)`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-[#E8E2DB]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(item.pct || 0, 100)}%`,
                              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {data.summary && (
                      <div className={`pt-3 mt-3 border-t ${borderColor} flex items-center justify-between`}>
                        <span className={`text-xs font-semibold ${textMuted} font-brand uppercase`}>
                          {t('home.kpiDetail.total')}
                        </span>
                        <span className={`text-sm font-bold font-data tabular-nums`} style={{ color: accentColor }}>
                          {data.summary.total > 999
                            ? `${(data.summary.total / 1_000_000).toFixed(1)}M`
                            : data.summary.total}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <span className={`text-xs ${textMuted}`}>{t('home.kpiDetail.noData')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No data fallback */}
          {!loading && !error && !data && (
            <div className="flex items-center justify-center py-12">
              <span className={`text-sm ${textMuted}`}>{t('home.kpiDetail.noData')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex items-center justify-between p-4 border-t ${borderColor} bg-white`}>
          <button
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 border-[#E8E2DB] text-[#6B5D4F] hover:bg-[#FBF9F7] hover:text-[#2C2417]"
          >
            <Download size={14} />
            {t('home.kpiDetail.export')}
          </button>
          <button
            onClick={() => {
              const route = ROUTE_MAP[cardKey];
              if (route) {
                onClose();
                router.push(route);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {t('home.kpiDetail.viewFullReport')}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KPIDetailModal;
