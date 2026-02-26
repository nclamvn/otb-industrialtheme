'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BAR_COLORS = ['#C4975A', '#1B6B45', '#2563EB', '#DC3545', '#D97706', '#0891B2', '#7C3AED'];

const ACCENTS = {
  gold:    { color: '#C4975A', grad: 'rgba(196,151,90,0.30)', mid: 'rgba(196,151,90,0.12)', icon: 'rgba(196,151,90,0.18)', glow: 'rgba(196,151,90,0.15)' },
  emerald: { color: '#1B6B45', grad: 'rgba(27,107,69,0.28)', mid: 'rgba(27,107,69,0.10)', icon: 'rgba(27,107,69,0.16)', glow: 'rgba(27,107,69,0.12)' },
  blue:    { color: '#2563EB', grad: 'rgba(37,99,235,0.25)', mid: 'rgba(37,99,235,0.10)', icon: 'rgba(37,99,235,0.16)', glow: 'rgba(37,99,235,0.12)' },
  rose:    { color: '#DC3545', grad: 'rgba(220,53,69,0.25)',  mid: 'rgba(220,53,69,0.10)',  icon: 'rgba(220,53,69,0.16)', glow: 'rgba(220,53,69,0.12)' },
  amber:   { color: '#D97706', grad: 'rgba(217,119,6,0.28)',  mid: 'rgba(217,119,6,0.10)',  icon: 'rgba(217,119,6,0.16)', glow: 'rgba(217,119,6,0.12)' },
  teal:    { color: '#0891B2', grad: 'rgba(8,145,178,0.25)',   mid: 'rgba(8,145,178,0.10)',  icon: 'rgba(8,145,178,0.16)', glow: 'rgba(8,145,178,0.12)' },
  violet:  { color: '#7C3AED', grad: 'rgba(124,58,237,0.25)', mid: 'rgba(124,58,237,0.10)', icon: 'rgba(124,58,237,0.16)', glow: 'rgba(124,58,237,0.12)' },
  indigo:  { color: '#4F46E5', grad: 'rgba(79,70,229,0.25)',  mid: 'rgba(79,70,229,0.10)',  icon: 'rgba(79,70,229,0.16)', glow: 'rgba(79,70,229,0.12)' },
  red:     { color: '#DC3545', grad: 'rgba(220,53,69,0.25)',   mid: 'rgba(220,53,69,0.10)',  icon: 'rgba(220,53,69,0.16)', glow: 'rgba(220,53,69,0.12)' },
};

const ExpandableStatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  accent = 'blue',
  trend,
  trendLabel,
  progress,
  progressLabel,
  breakdown,
  badges,
  expandTitle,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const a = ACCENTS[accent] || ACCENTS.blue;
  const hasExpandContent = breakdown?.length > 0 || badges?.length > 0 || progress != null;

  return (
    <div
      className={`relative overflow-hidden border border-[#E8E2DB] rounded-xl transition-all duration-300 ${
        expanded ? 'shadow-lg' : 'hover:shadow-md'
      } group`}
      style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${a.mid} 35%, ${a.grad} 100%)`,
        boxShadow: `inset 0 -1px 0 ${a.glow}`,
      }}
    >
      {/* Watermark Icon */}
      {Icon && (
        <div className="absolute -bottom-3 -right-3 transition-all duration-300 group-hover:scale-110 group-hover:opacity-[0.18] pointer-events-none opacity-[0.10]">
          <Icon size={80} color={a.color} strokeWidth={0.8} />
        </div>
      )}

      {/* Main card area - clickable */}
      <div
        className={`relative z-10 px-3 py-2 ${hasExpandContent ? 'cursor-pointer' : ''}`}
        onClick={() => hasExpandContent && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B5D4F] font-brand">{title}</p>
              {hasExpandContent && (
                <ChevronDown
                  size={10}
                  className={`transition-transform duration-300 text-[#6B5D4F] ${expanded ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <div className="mt-0.5 text-lg font-bold font-data tabular-nums leading-tight text-[#2C2417]">
              {value}
            </div>

            {/* Trend badge + sub in a row */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {trendLabel && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold font-data rounded ${
                  trend > 0
                    ? 'bg-[rgba(27,107,69,0.12)] text-[#1B6B45]'
                    : trend < 0
                      ? 'bg-[rgba(220,53,69,0.10)] text-[#DC3545]'
                      : 'bg-[rgba(140,129,120,0.12)] text-[#8C8178]'
                }`}>
                  {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {trendLabel}
                </span>
              )}
              {sub && <p className="text-[10px] text-[#6B5D4F]">{sub}</p>}
            </div>

            {/* Progress bar (always visible when provided) */}
            {progress != null && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  {progressLabel && (
                    <span className="text-[9px] font-medium text-[#6B5D4F] font-brand">{progressLabel}</span>
                  )}
                  <span className="text-[9px] font-semibold font-data text-[#6B5D4F]">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-[#E8E2DB]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: a.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Icon badge */}
          {Icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0"
              style={{ backgroundColor: a.icon }}
            >
              <Icon size={14} color={a.color} />
            </div>
          )}
        </div>

        {/* Expand hint */}
        {hasExpandContent && !expanded && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowUpRight size={10} color={a.color} />
          </div>
        )}
      </div>

      {/* Expanded Panel */}
      <div
        className={`relative z-10 overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pb-2.5 border-t border-[#E8E2DB]">
          {/* Expand title */}
          {expandTitle && (
            <p className="text-[9px] font-semibold uppercase tracking-wider mt-2 mb-1.5 text-[#6B5D4F] font-brand">
              {expandTitle}
            </p>
          )}

          {/* Badges row */}
          {badges?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5">
              {badges.map((badge, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold font-data"
                  style={{
                    backgroundColor: `${badge.color || a.color}18`,
                    color: badge.color || a.color,
                  }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: badge.color || a.color }} />
                  {badge.label}: {badge.value}
                </span>
              ))}
            </div>
          )}

          {/* Breakdown bars */}
          {breakdown?.length > 0 && (
            <div className="space-y-1.5 mt-1.5">
              {breakdown.map((item, i) => {
                const maxVal = Math.max(...breakdown.map(b => b.pct ?? b.value ?? 0), 1);
                const pct = item.pct ?? (maxVal > 0 ? Math.round(((item.value ?? 0) / maxVal) * 100) : 0);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-[#2C2417] font-brand truncate max-w-[60%]">
                        {item.label}
                      </span>
                      <span className="text-[9px] font-data tabular-nums text-[#6B5D4F]">
                        {item.displayValue || item.value}
                      </span>
                    </div>
                    <div className="h-0.5 rounded-full overflow-hidden mt-0.5 bg-[#E8E2DB]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: item.color || BAR_COLORS[i % BAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpandableStatCard;
