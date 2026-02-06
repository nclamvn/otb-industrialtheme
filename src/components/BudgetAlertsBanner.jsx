'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, ChevronRight } from 'lucide-react';
import { aiService } from '../services/aiService';

const BudgetAlertsBanner = ({ budgetId, darkMode = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [budgetId]);

  const fetchAlerts = async () => {
    try {
      const data = await aiService.getBudgetAlerts({ budgetId, unreadOnly: true });
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
    setLoading(false);
  };

  const handleDismiss = async (alertId, e) => {
    e.stopPropagation();
    try {
      await aiService.dismissAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: darkMode ? 'bg-[rgba(248,81,73,0.1)]' : 'bg-red-50',
          border: darkMode ? 'border-[rgba(248,81,73,0.3)]' : 'border-red-200',
          Icon: AlertCircle,
          iconColor: darkMode ? 'text-[#FF7B72]' : 'text-red-600',
          textColor: darkMode ? 'text-[#FF7B72]' : 'text-red-800',
          subText: darkMode ? 'text-[rgba(255,123,114,0.7)]' : 'text-red-600',
        };
      case 'warning':
        return {
          bg: darkMode ? 'bg-[rgba(215,183,151,0.1)]' : 'bg-amber-50',
          border: darkMode ? 'border-[rgba(215,183,151,0.3)]' : 'border-amber-200',
          Icon: AlertTriangle,
          iconColor: darkMode ? 'text-[#D7B797]' : 'text-amber-600',
          textColor: darkMode ? 'text-[#D7B797]' : 'text-amber-800',
          subText: darkMode ? 'text-[rgba(215,183,151,0.7)]' : 'text-amber-600',
        };
      default:
        return {
          bg: darkMode ? 'bg-[rgba(99,102,241,0.1)]' : 'bg-blue-50',
          border: darkMode ? 'border-[rgba(99,102,241,0.3)]' : 'border-blue-200',
          Icon: Info,
          iconColor: darkMode ? 'text-indigo-400' : 'text-blue-600',
          textColor: darkMode ? 'text-indigo-300' : 'text-blue-800',
          subText: darkMode ? 'text-indigo-400/70' : 'text-blue-600',
        };
    }
  };

  if (loading || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const topAlert = alerts[0];
  const config = getSeverityConfig(topAlert.severity);
  const TopIcon = config.Icon;

  return (
    <div className="mb-4">
      {/* Collapsed Banner */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`${config.bg} ${config.border} border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bg}`}>
              <TopIcon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <div className={`font-semibold font-['Montserrat'] ${config.textColor}`}>
                {topAlert.title}
              </div>
              <div className={`text-sm ${config.subText}`}>
                {topAlert.message}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="px-2 py-0.5 bg-[#F85149] text-white text-xs font-bold rounded-full">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 bg-[#D7B797] text-[#0A0A0A] text-xs font-bold rounded-full">
                  {warningCount} warning
                </span>
              )}
            </div>
            <ChevronRight className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''} ${
              darkMode ? 'text-[#666666]' : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Expanded List */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {alerts.map(alert => {
            const alertConfig = getSeverityConfig(alert.severity);
            const AlertIcon = alertConfig.Icon;

            return (
              <div
                key={alert.id}
                className={`${alertConfig.bg} ${alertConfig.border} border rounded-lg p-3 flex items-start justify-between gap-3`}
              >
                <div className="flex items-start gap-3">
                  <AlertIcon className={`w-4 h-4 mt-0.5 shrink-0 ${alertConfig.iconColor}`} />
                  <div>
                    <div className={`font-medium text-sm ${alertConfig.textColor}`}>
                      {alert.title}
                    </div>
                    <div className={`text-xs mt-0.5 ${alertConfig.subText}`}>
                      {alert.message}
                    </div>
                    {alert.budget && (
                      <div className={`text-xs mt-1 ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`}>
                        {alert.budget.groupBrand?.name} — {alert.budget.budgetCode}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDismiss(alert.id, e)}
                  className={`p-1 rounded transition-colors shrink-0 ${
                    darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                >
                  <X className={`w-4 h-4 ${darkMode ? 'text-[#666666]' : 'text-gray-400'}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetAlertsBanner;
