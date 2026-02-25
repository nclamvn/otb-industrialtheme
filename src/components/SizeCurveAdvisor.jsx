'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { aiService } from '../services/aiService';
import { useLanguage } from '@/contexts/LanguageContext';

const SizeCurveAdvisor = ({
  skuId,
  category,
  storeId,
  userSizing,        // { '0002': 0, '0004': 3, '0006': 3, '0008': 2 }
  onApplyRecommendation,
  darkMode = true,
}) => {
  const { t } = useLanguage();
  const [recommendation, setRecommendation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const totalQty = Object.values(userSizing || {}).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (category && storeId && totalQty > 0) {
      fetchRecommendation();
    }
  }, [category, storeId, totalQty]);

  useEffect(() => {
    if (recommendation && userSizing && totalQty > 0) {
      compareWithUser();
    }
  }, [userSizing, recommendation]);

  const fetchRecommendation = async () => {
    setLoading(true);
    const data = await aiService.getSizeCurve(category, storeId, totalQty);
    if (data) setRecommendation(data);
    setLoading(false);
  };

  const compareWithUser = async () => {
    if (!skuId) return;
    const data = await aiService.compareSizeCurve(skuId, storeId, userSizing);
    if (data) setComparison(data);
  };

  const handleApply = () => {
    if (recommendation && onApplyRecommendation) {
      const newSizing = {};
      recommendation.forEach(r => {
        newSizing[r.sizeCode] = r.recommendedQty;
      });
      onApplyRecommendation(newSizing);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm mt-3">
        <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
        <span className="text-[#6B5D4F]">{t('ai.analyzingSizePatterns')}</span>
      </div>
    );
  }

  if (!recommendation || totalQty === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl border border-purple-200" style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(147,51,234,0.06) 35%, rgba(99,102,241,0.18) 100%)',
      boxShadow: 'inset 0 -1px 0 rgba(99,102,241,0.08), 0 1px 3px rgba(44,36,23,0.06)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-semibold font-['Montserrat'] text-purple-900">
            {t('ai.sizeAdvisor')}
          </span>
        </div>

        {comparison && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            comparison.alignment === 'good'
              ? 'bg-emerald-100 text-[#1B6B45]'
              : comparison.alignment === 'warning'
              ? 'bg-amber-100 text-[#D97706]'
              : 'bg-red-100 text-[#DC3545]'
          }`}>
            {comparison.alignment === 'good' && <CheckCircle className="w-4 h-4" />}
            {comparison.alignment !== 'good' && <AlertTriangle className="w-4 h-4" />}
            {t('ai.aligned', { pct: comparison.score })}
          </div>
        )}
      </div>

      {/* Suggestion */}
      {comparison && (
        <p className="text-sm mb-3 text-[#6B5D4F]">
          {comparison.suggestion}
        </p>
      )}

      {/* Size Comparison Chart */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {recommendation.map(rec => {
          const userQty = userSizing?.[rec.sizeCode] || 0;
          const userPct = totalQty > 0 ? (userQty / totalQty * 100) : 0;
          const deviation = Math.abs(userPct - rec.recommendedPct);

          return (
            <div key={rec.sizeCode} className="text-center">
              <div className="text-xs font-medium mb-1 text-[#6B5D4F]">
                {rec.sizeCode}
              </div>

              {/* Bars */}
              <div className="h-16 flex items-end justify-center gap-1 mb-1">
                <div
                  className="w-3 rounded-t bg-[#8C8178]"
                  style={{ height: `${Math.max(Math.min(userPct, 100) * 0.6, 2)}px` }}
                  title={`Your: ${userPct.toFixed(0)}%`}
                />
                <div
                  className="w-3 bg-purple-500 rounded-t"
                  style={{ height: `${Math.max(Math.min(rec.recommendedPct, 100) * 0.6, 2)}px` }}
                  title={`AI: ${rec.recommendedPct.toFixed(0)}%`}
                />
              </div>

              {/* Values */}
              <div className="text-xs">
                <span className="text-[#6B5D4F]">{userQty}</span>
                <span className="mx-1 text-[#E8E2DB]">&rarr;</span>
                <span className={`font-medium ${
                  deviation > 10
                    ? 'text-[#D97706]'
                    : 'text-purple-600'
                }`}>
                  {rec.recommendedQty}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs mb-3 text-[#6B5D4F]">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded bg-[#8C8178]" /> {t('ai.yourInput')}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded" /> {t('ai.aiRecommended')}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs flex items-center gap-1 hover:underline text-purple-600"
        >
          <Info className="w-3 h-3" />
          {showDetails ? t('ai.hideReasoning') : t('ai.showReasoning')}
        </button>

        <button
          onClick={handleApply}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          {t('ai.applyAiSuggestion')}
        </button>
      </div>

      {/* Detailed Reasoning */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="space-y-2">
            {recommendation.map(rec => (
              <div key={rec.sizeCode} className="flex items-start gap-2 text-xs">
                <span className="font-medium w-12 text-[#2C2417]">
                  {rec.sizeCode}:
                </span>
                <span className="flex-1 text-[#6B5D4F]">
                  {rec.reasoning}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${
                  rec.confidence >= 0.8
                    ? 'bg-emerald-100 text-[#1B6B45]'
                    : rec.confidence >= 0.5
                    ? 'bg-amber-100 text-[#D97706]'
                    : 'bg-[#FBF9F7] text-[#6B5D4F]'
                }`}>
                  {t('ai.conf', { pct: (rec.confidence * 100).toFixed(0) })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeCurveAdvisor;
