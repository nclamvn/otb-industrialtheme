'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronRight, ShieldAlert, Bell } from 'lucide-react';
import { aiService } from '../services/aiService';

const SEVERITY_THEMES = {
  critical: {
    color: '#DC3545',
    grad: 'linear-gradient(135deg, #ffffff 0%, rgba(220,53,69,0.06) 35%, rgba(220,53,69,0.16) 100%)',
    border: 'rgba(220,53,69,0.25)',
    glow: '0 0 20px rgba(220,53,69,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    Icon: AlertCircle,
    WatermarkIcon: ShieldAlert,
    iconBg: 'rgba(220,53,69,0.10)',
    text: '#C53030',
    sub: '#9B2C2C',
    badgeBg: 'linear-gradient(135deg, #DC3545 0%, #DC2626 100%)',
    badgeText: '#FFFFFF',
  },
  warning: {
    color: '#D97706',
    grad: 'linear-gradient(135deg, #ffffff 0%, rgba(217,119,6,0.06) 35%, rgba(217,119,6,0.16) 100%)',
    border: 'rgba(217,119,6,0.25)',
    glow: '0 0 20px rgba(217,119,6,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    Icon: AlertTriangle,
    WatermarkIcon: Bell,
    iconBg: 'rgba(217,119,6,0.10)',
    text: '#92600A',
    sub: '#7C4F0A',
    badgeBg: 'linear-gradient(135deg, #C4975A 0%, #C49A6C 100%)',
    badgeText: '#2C2417',
  },
  info: {
    color: '#818CF8',
    grad: 'linear-gradient(135deg, #ffffff 0%, rgba(80,90,220,0.06) 35%, rgba(80,90,220,0.14) 100%)',
    border: 'rgba(80,90,220,0.25)',
    glow: '0 0 20px rgba(80,90,220,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    Icon: Info,
    WatermarkIcon: Info,
    iconBg: 'rgba(80,90,220,0.10)',
    text: '#3730A3',
    sub: '#4338CA',
    badgeBg: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
    badgeText: '#FFFFFF',
  },
};

const BudgetAlertsBanner = ({ budgetId, darkMode = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [budgetId]);

  const fetchAlerts = async () => {
    const data = await aiService.getBudgetAlerts({ budgetId, unreadOnly: true });
    setAlerts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleDismiss = async (alertId, e) => {
    e.stopPropagation();
    await aiService.dismissAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getTheme = (severity) => SEVERITY_THEMES[severity] || SEVERITY_THEMES.info;

  if (loading || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity !== 'critical' && a.severity !== 'warning').length;
  const topAlert = alerts[0];
  const theme = getTheme(topAlert.severity);
  const TopIcon = theme.Icon;
  const WatermarkIcon = theme.WatermarkIcon;

  return (
    <div className="mb-2">
      {/* Collapsed Banner */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 group"
        style={{
          background: theme.grad,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.glow,
        }}
      >
        {/* Watermark Icon */}
        <div
          className="absolute -right-2 -bottom-2 transition-all duration-500 group-hover:scale-110 pointer-events-none"
          style={{ opacity: 0.04 }}
        >
          <WatermarkIcon size={64} color={theme.color} strokeWidth={0.8} />
        </div>

        {/* Accent line on the left */}
        <div
          className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
          style={{ backgroundColor: theme.color, opacity: 0.7 }}
        />

        <div className="relative z-10 flex items-center justify-between px-3 py-2 pl-4">
          <div className="flex items-center gap-2.5">
            {/* Icon compact */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0"
              style={{ backgroundColor: theme.iconBg }}
            >
              <TopIcon size={14} color={theme.color} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-semibold font-brand text-xs leading-tight"
                  style={{ color: theme.text }}
                >
                  {topAlert.title}
                </span>
                <span
                  className="text-xs leading-snug truncate"
                  style={{ color: theme.sub }}
                >
                  {topAlert.message}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* Severity badges */}
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                  style={{ background: SEVERITY_THEMES.critical.badgeBg, color: SEVERITY_THEMES.critical.badgeText }}
                >
                  <AlertCircle size={10} />
                  {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                  style={{ background: SEVERITY_THEMES.warning.badgeBg, color: SEVERITY_THEMES.warning.badgeText }}
                >
                  <AlertTriangle size={10} />
                  {warningCount}
                </span>
              )}
              {infoCount > 0 && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                  style={{ background: SEVERITY_THEMES.info.badgeBg, color: SEVERITY_THEMES.info.badgeText }}
                >
                  <Info size={10} />
                  {infoCount}
                </span>
              )}
            </div>
            <ChevronRight
              size={14}
              className={`transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}
              color="#8C8178"
            />
          </div>
        </div>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {alerts.map(alert => {
            const t = getTheme(alert.severity);
            const AlertIcon = t.Icon;

            return (
              <div
                key={alert.id}
                className="relative overflow-hidden rounded-xl transition-all duration-200 group/item hover:shadow-md"
                style={{
                  background: t.grad,
                  border: `1px solid ${t.border}`,
                }}
              >
                {/* Subtle left accent */}
                <div
                  className="absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-full"
                  style={{ backgroundColor: t.color, opacity: 0.5 }}
                />

                <div className="flex items-start justify-between gap-3 p-4 pl-5">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: t.iconBg }}
                    >
                      <AlertIcon size={15} color={t.color} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-semibold text-sm font-brand"
                        style={{ color: t.text }}
                      >
                        {alert.title}
                      </div>
                      <div
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: t.sub }}
                      >
                        {alert.message}
                      </div>
                      {alert.budget && (
                        <div className="text-[11px] mt-1.5 font-data text-[#8C8178]">
                          {alert.budget.groupBrand?.name} — {alert.budget.budgetCode}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    className="p-1.5 rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover/item:opacity-100"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <X size={14} color="#8C8178" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetAlertsBanner;
