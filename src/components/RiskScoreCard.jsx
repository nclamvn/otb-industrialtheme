'use client';
import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldClose,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { useLanguage } from '@/contexts/LanguageContext';

// ═══════════════════════════════════════════════════════════════════════════
// Risk Score Card — AI risk assessment for approvers
// DAFC Design System
// ═══════════════════════════════════════════════════════════════════════════

const RISK_LEVELS = {
  low: {
    color: '#1B6B45',
    bgAlpha: 'rgba(27,107,69,0.12)',
    borderAlpha: 'rgba(27,107,69,0.25)',
    grad: 'rgba(27,107,69,0.18)',
    mid: 'rgba(27,107,69,0.06)',
    glow: 'rgba(27,107,69,0.08)',
    labelKey: 'ai.lowRisk',
    Icon: ShieldCheck,
  },
  medium: {
    color: '#C4975A',
    bgAlpha: 'rgba(196,151,90,0.12)',
    borderAlpha: 'rgba(196,151,90,0.25)',
    grad: 'rgba(196,151,90,0.20)',
    mid: 'rgba(196,151,90,0.06)',
    glow: 'rgba(196,151,90,0.08)',
    labelKey: 'ai.mediumRisk',
    Icon: Shield,
  },
  high: {
    color: '#D97706',
    bgAlpha: 'rgba(217,119,6,0.12)',
    borderAlpha: 'rgba(217,119,6,0.25)',
    grad: 'rgba(217,119,6,0.18)',
    mid: 'rgba(217,119,6,0.06)',
    glow: 'rgba(217,119,6,0.08)',
    labelKey: 'ai.highRisk',
    Icon: ShieldAlert,
  },
  critical: {
    color: '#DC3545',
    bgAlpha: 'rgba(220,53,69,0.12)',
    borderAlpha: 'rgba(220,53,69,0.25)',
    grad: 'rgba(220,53,69,0.18)',
    mid: 'rgba(220,53,69,0.06)',
    glow: 'rgba(220,53,69,0.08)',
    labelKey: 'ai.criticalRisk',
    Icon: ShieldClose,
  },
};

function getFactorStatusIcon(score) {
  if (score <= 3) return { Icon: CheckCircle, color: '#1B6B45' };
  if (score <= 6) return { Icon: AlertTriangle, color: '#C4975A' };
  return { Icon: ShieldAlert, color: '#DC3545' };
}

function getFactorBarColor(score) {
  if (score <= 3) return '#1B6B45';
  if (score <= 6) return '#C4975A';
  return '#DC3545';
}

export default function RiskScoreCard({
  entityType = 'proposal',
  entityId,
  autoCalculate = true,
  onScoreCalculated,
  darkMode = true,
}) {
  const { t } = useLanguage();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch existing assessment on mount / entityId change ───────────
  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    const fetchAssessment = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await aiService.getRiskAssessment(entityType, entityId);
        if (cancelled) return;

        if (data && data.overallScore !== undefined) {
          setAssessment(data);
          onScoreCalculated?.(data);

          // Auto-refresh if stale
          if (data.isStale && autoCalculate) {
            const refreshed = await aiService.refreshRiskAssessment(entityType, entityId);
            if (!cancelled) {
              setAssessment(refreshed);
              onScoreCalculated?.(refreshed);
            }
          }
        } else if (autoCalculate) {
          // No assessment found — auto-calculate
          const newData = await aiService.assessRisk(entityType, entityId);
          if (!cancelled) {
            setAssessment(newData);
            onScoreCalculated?.(newData);
          }
        }
      } catch (err) {
        if (cancelled) return;

        // If 404 and autoCalculate, create a new one
        if ((err?.response?.status === 404 || err?.response?.status === 400) && autoCalculate) {
          try {
            const newData = await aiService.assessRisk(entityType, entityId);
            if (!cancelled) {
              setAssessment(newData);
              onScoreCalculated?.(newData);
            }
          } catch (calcErr) {
            if (!cancelled) setError(calcErr.message || 'Failed to calculate risk assessment');
          }
        } else {
          setError(err.message || 'Failed to load risk assessment');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAssessment();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  // ── Manual calculate ───────────────────────────────────────────────
  const calculateRisk = async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.assessRisk(entityType, entityId);
      setAssessment(data);
      onScoreCalculated?.(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate risk assessment');
    } finally {
      setLoading(false);
    }
  };

  // ── Manual recalculate ─────────────────────────────────────────────
  const recalculateRisk = async () => {
    if (!entityId) return;
    setRefreshing(true);
    try {
      const data = await aiService.assessRisk(entityType, entityId);
      setAssessment(data);
      onScoreCalculated?.(data);
    } catch (err) {
      setError(err.message || 'Failed to recalculate risk assessment');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────
  const riskLevel = assessment?.riskLevel?.toLowerCase() || 'medium';
  const riskConfig = RISK_LEVELS[riskLevel] || RISK_LEVELS.medium;
  const RiskIcon = riskConfig.Icon;
  const score = assessment?.overallScore ?? 0;
  const scorePercent = Math.min(score, 100);

  // SVG circle math
  const circleRadius = 44;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // ════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ════════════════════════════════════════════════════════════════════
  if (loading && !assessment) {
    return (
      <div
        className="border rounded-xl p-5"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(196,151,90,0.06) 35%, rgba(196,151,90,0.20) 100%)',
          borderColor: '#E8E2DB',
          boxShadow: '0 1px 3px rgba(44,36,23,0.06), inset 0 -1px 0 rgba(196,151,90,0.08)',
        }}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: '#FBF9F7' }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 rounded w-1/3"
                style={{ backgroundColor: '#FBF9F7' }}
              />
              <div
                className="h-3 rounded w-1/2"
                style={{ backgroundColor: '#FBF9F7' }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center py-6">
            <div
              className="w-24 h-24 rounded-full"
              style={{ backgroundColor: '#FBF9F7' }}
            />
          </div>
          <div
            className="h-12 rounded-lg"
            style={{ backgroundColor: '#FBF9F7' }}
          />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ════════════════════════════════════════════════════════════════════
  if (error && !assessment) {
    return (
      <div
        className="border rounded-xl p-5"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(220,53,69,0.06) 35%, rgba(220,53,69,0.18) 100%)',
          borderColor: '#E8E2DB',
          boxShadow: '0 1px 3px rgba(44,36,23,0.06), inset 0 -1px 0 rgba(220,53,69,0.08)',
        }}
      >
        <div className="flex flex-col items-center gap-3 py-4">
          <Info size={28} style={{ color: '#8C8178' }} />
          <p
            className="text-sm text-center"
            style={{ color: '#6B5D4F' }}
          >
            {error}
          </p>
          <button
            onClick={calculateRisk}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: riskConfig.bgAlpha,
              border: `1px solid ${riskConfig.borderAlpha}`,
              color: '#C4975A',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <Zap size={16} />
            {t('ai.calculateRisk')}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // NO ASSESSMENT YET (no autoCalculate)
  // ════════════════════════════════════════════════════════════════════
  if (!assessment) {
    return (
      <div
        className="border rounded-xl p-5"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(196,151,90,0.06) 35%, rgba(196,151,90,0.20) 100%)',
          borderColor: '#E8E2DB',
          boxShadow: '0 1px 3px rgba(44,36,23,0.06), inset 0 -1px 0 rgba(196,151,90,0.08)',
        }}
      >
        <div className="flex flex-col items-center gap-3 py-4">
          <Shield size={28} style={{ color: '#8C8178' }} />
          <p
            className="text-sm text-center"
            style={{ color: '#6B5D4F' }}
          >
            {t('ai.noRiskAssessment')}
          </p>
          <button
            onClick={calculateRisk}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'rgba(196,151,90,0.12)',
              border: '1px solid rgba(196,151,90,0.25)',
              color: '#C4975A',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <Zap size={16} />
            {t('ai.calculateRisk')}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // MAIN DISPLAY
  // ════════════════════════════════════════════════════════════════════
  return (
    <div
      className="border rounded-xl overflow-hidden sm:col-span-2"
      style={{
        background: `linear-gradient(135deg, #FFFFFF 0%, ${riskConfig.mid} 35%, ${riskConfig.grad} 100%)`,
        borderColor: '#E8E2DB',
        boxShadow: `0 1px 3px rgba(44,36,23,0.06), inset 0 -1px 0 ${riskConfig.glow}`,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: riskConfig.bgAlpha,
              border: `1px solid ${riskConfig.borderAlpha}`,
            }}
          >
            <RiskIcon size={20} style={{ color: riskConfig.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: '#8C8178',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              {t('ai.riskAssessment')}
            </h3>
            <p
              className="text-sm font-semibold"
              style={{
                color: riskConfig.color,
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              {t(riskConfig.labelKey)}
            </p>
          </div>
          {assessment.isStale && (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full"
              style={{
                backgroundColor: 'rgba(196,151,90,0.15)',
                color: '#C4975A',
              }}
            >
              {t('ai.stale')}
            </span>
          )}
        </div>

        {/* ── Score Circle ─────────────────────────────────────────── */}
        <div className="flex items-center justify-center py-2">
          <div className="relative" style={{ width: 108, height: 108 }}>
            <svg width="108" height="108" viewBox="0 0 108 108">
              {/* Background circle */}
              <circle
                cx="54"
                cy="54"
                r={circleRadius}
                fill="none"
                stroke="#E8E2DB"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="54"
                cy="54"
                r={circleRadius}
                fill="none"
                stroke={riskConfig.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 54 54)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            {/* Score text in center */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span
                className="text-2xl font-bold"
                style={{
                  color: riskConfig.color,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {score}
              </span>
              <span
                className="text-[10px] uppercase tracking-wide"
                style={{
                  color: '#8C8178',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                / 100
              </span>
            </div>
          </div>
        </div>

        {/* ── Recommendation ───────────────────────────────────────── */}
        {assessment.recommendation && (
          <div
            className="rounded-lg px-4 py-3 mt-3 text-sm"
            style={{
              backgroundColor: '#FBF9F7',
              border: '1px solid #E8E2DB',
              color: '#6B5D4F',
            }}
          >
            {assessment.recommendation}
          </div>
        )}

        {/* ── Toggle Details ───────────────────────────────────────── */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-center gap-2 mt-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: 'rgba(196,151,90,0.1)',
            border: '1px solid #E8E2DB',
            color: '#C4975A',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              {t('ai.hideDetails')}
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              {t('ai.showDetails')}
            </>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         EXPANDED DETAILS
      ═══════════════════════════════════════════════════════════════ */}
      {expanded && (
        <div
          className="px-5 pb-5 space-y-4"
          style={{
            borderTop: '1px solid #E8E2DB',
            paddingTop: 20,
          }}
        >
          {/* ── Risk Factors ──────────────────────────────────────── */}
          {assessment.factors && assessment.factors.length > 0 && (
            <div className="space-y-3">
              <h4
                className="text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: '#8C8178',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {t('ai.riskFactors')}
              </h4>
              {assessment.factors.map((factor, idx) => {
                const factorStatus = getFactorStatusIcon(factor.score);
                const FactorIcon = factorStatus.Icon;
                const barColor = getFactorBarColor(factor.score);
                const barWidth = Math.min((factor.score / 10) * 100, 100);

                return (
                  <div
                    key={idx}
                    className="rounded-lg p-3"
                    style={{
                      backgroundColor: '#FBF9F7',
                      border: '1px solid #E8E2DB',
                    }}
                  >
                    {/* Factor header */}
                    <div className="flex items-center gap-2 mb-2">
                      <FactorIcon
                        size={16}
                        style={{ color: factorStatus.color, flexShrink: 0 }}
                      />
                      <span
                        className="flex-1 text-sm font-medium"
                        style={{
                          color: '#2C2417',
                          fontFamily: 'Montserrat, sans-serif',
                        }}
                      >
                        {factor.name}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: factorStatus.color,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {Number(factor.score).toFixed(1)}/10
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: '#E8E2DB',
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: barColor,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>

                    {/* Factor details */}
                    {factor.details && (
                      <p
                        className="text-xs mt-2"
                        style={{ color: '#6B5D4F' }}
                      >
                        {factor.details}
                      </p>
                    )}

                    {/* Factor recommendation */}
                    {factor.recommendation && (
                      <p
                        className="text-xs mt-1 italic"
                        style={{ color: '#92724B' }}
                      >
                        {factor.recommendation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Warnings ──────────────────────────────────────────── */}
          {assessment.warnings && assessment.warnings.length > 0 && (
            <div className="space-y-2">
              <h4
                className="text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: '#8C8178',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {t('ai.warnings')}
              </h4>
              {assessment.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: 'rgba(220,53,69,0.06)',
                    border: '1px solid rgba(220,53,69,0.15)',
                    color: '#DC3545',
                  }}
                >
                  <AlertTriangle
                    size={14}
                    className="shrink-0 mt-0.5"
                    style={{ color: '#DC3545' }}
                  />
                  <span>{typeof warning === 'string' ? warning : warning.message || JSON.stringify(warning)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Recalculate Button ────────────────────────────────── */}
          <button
            onClick={recalculateRisk}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'rgba(196,151,90,0.15)',
              border: '1px solid rgba(196,151,90,0.4)',
              color: '#C4975A',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? t('ai.recalculating') : t('ai.recalculateRiskScore')}
          </button>
        </div>
      )}
    </div>
  );
}
