'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown,
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
  TrendingUp
} from 'lucide-react';
import { budgetService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, subtitle, trend, trendLabel, icon: Icon, darkMode, chart }) => {
  const cardBg = darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const iconBg = darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(215,183,151,0.1)]';

  return (
    <div className={`border ${cardBg} rounded-lg p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${textMuted}`}>{title}</p>
          <div className={`mt-2 text-2xl font-bold font-['JetBrains_Mono'] tabular-nums ${textPrimary}`}>{value}</div>
          {trendLabel && (
            <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 text-xs font-semibold font-['JetBrains_Mono'] rounded ${
              trend > 0
                ? 'bg-[rgba(18,119,73,0.15)] text-[#2A9E6A]'
                : 'bg-[rgba(248,81,73,0.15)] text-[#FF7B72]'
            }`}>
              {trend > 0 ? '\u25B2' : '\u25BC'} {trendLabel}
            </span>
          )}
          <p className={`mt-2 text-xs ${textMuted}`}>{subtitle}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={22} className="text-[#D7B797]" />
        </div>
      </div>
      {chart && <div className="mt-4">{chart}</div>}
    </div>
  );
};

const SmallCard = ({ title, value, subtitle, icon: Icon, darkMode }) => {
  const cardBg = darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';
  const iconBg = darkMode ? 'bg-[#1A1A1A]' : 'bg-[rgba(215,183,151,0.1)]';

  return (
    <div className={`border ${cardBg} rounded-lg p-4 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${textMuted}`}>{title}</p>
          <div className={`mt-2 text-xl font-bold font-['JetBrains_Mono'] tabular-nums ${textPrimary}`}>{value}</div>
          <p className={`mt-1 text-xs ${textMuted}`}>{subtitle}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className="text-[#D7B797]" />
        </div>
      </div>
    </div>
  );
};

const HomeScreen = ({ darkMode = true }) => {
  const { user } = useAuth();
  const panelBg = darkMode ? 'bg-[#121212] border-[#2E2E2E]' : 'bg-white border-gray-200';
  const textMuted = darkMode ? 'text-[#666666]' : 'text-gray-700';
  const textPrimary = darkMode ? 'text-[#F2F2F2]' : 'text-gray-900';

  // Stats from API
  const [stats, setStats] = useState({
    totalSales: '0',
    budgetUtilization: '0%',
    avgMargin: '0%',
    sellThrough: '0%',
    totalBrands: '0',
    categories: '0',
    pendingApprovals: '0',
    activePlans: '0'
  });
  const [statsLoading, setStatsLoading] = useState(true);

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

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div>
            <h2 className={`text-xl font-bold font-['Montserrat'] ${textPrimary}`}>Welcome back, {userName}!</h2>
            <p className={`text-sm ${textMuted}`}>Here's what's happening with your OTB planning today.</p>
          </div>
        </div>
        <span className="inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-wider font-['Montserrat'] rounded-full bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.3)]">
          Spring/Summer 2025
        </span>
      </div>

      {/* Filter Bar */}
      <div className={`border ${panelBg} rounded-lg p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold uppercase rounded bg-[rgba(18,119,73,0.15)] text-[#2A9E6A] border border-[rgba(18,119,73,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[#127749]"></span>
            LIVE
          </span>
          {[
            { label: 'Season', value: 'SS25' },
            { label: 'Brand', value: 'All Brands' },
            { label: 'Region', value: 'Vietnam' }
          ].map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-150 ${
                darkMode
                  ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                  : 'border-gray-200 text-gray-600 hover:bg-[rgba(215,183,151,0.15)] hover:border-[rgba(184,153,112,0.4)] hover:text-[#8A6340]'
              }`}
            >
              <span className="uppercase tracking-wide text-[10px]">{item.label}</span>
              <span className={`text-sm font-['JetBrains_Mono'] ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{item.value}</span>
              <ChevronDown size={14} />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className={`inline-flex items-center gap-2 ${textMuted}`}>
              <span className="w-2 h-2 rounded-full bg-[#127749]"></span>
              Updated just now
            </span>
            <button className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150 ${
              darkMode
                ? 'border-[#2E2E2E] text-[#999999] hover:bg-[rgba(215,183,151,0.08)] hover:border-[rgba(215,183,151,0.25)] hover:text-[#D7B797]'
                : 'border-gray-200 text-gray-600 hover:bg-[rgba(215,183,151,0.15)] hover:text-[#8A6340]'
            }`}>
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value="12,5 T d"
          trend={12.5}
          trendLabel="12.5%"
          subtitle="45,000 units sold vs last season"
          icon={DollarSign}
          darkMode={darkMode}
          chart={(
            <svg viewBox="0 0 160 40" className="w-full h-10">
              <polyline
                fill="none"
                stroke="#D7B797"
                strokeWidth="3"
                points="0,32 24,28 48,20 72,22 96,14 120,16 144,8 160,10"
              />
            </svg>
          )}
        />
        <StatCard
          title="Budget Utilization"
          value="57%"
          trend={8.2}
          trendLabel="8.2%"
          subtitle="8,5 T d this month"
          icon={Target}
          darkMode={darkMode}
          chart={(
            <svg viewBox="0 0 160 40" className="w-full h-10">
              <polyline
                fill="none"
                stroke="#2A9E6A"
                strokeWidth="3"
                points="0,30 30,26 60,22 90,18 120,16 150,12 160,10"
              />
            </svg>
          )}
        />
        <StatCard
          title="Avg Margin"
          value="42.5%"
          trend={2.3}
          trendLabel="2.3%"
          subtitle="Across all categories vs target"
          icon={Percent}
          darkMode={darkMode}
        />
        <StatCard
          title="Sell-Through"
          value="68.3%"
          trend={-1.5}
          trendLabel="1.5%"
          subtitle="Current season performance vs last week"
          icon={ShoppingCart}
          darkMode={darkMode}
        />
      </div>

      {/* Small Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SmallCard
          title="Total Brands"
          value={stats.totalBrands}
          subtitle="Active brands"
          icon={Building2}
          darkMode={darkMode}
        />
        <SmallCard
          title="Categories"
          value={stats.categories}
          subtitle="Product categories"
          icon={Boxes}
          darkMode={darkMode}
        />
        <SmallCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Items awaiting review"
          icon={ClipboardCheck}
          darkMode={darkMode}
        />
        <SmallCard
          title="Active Plans"
          value={stats.activePlans}
          subtitle="OTB plans in progress"
          icon={BarChart3}
          darkMode={darkMode}
        />
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Sales Performance Chart */}
        <div className={`border ${panelBg} rounded-lg p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold font-['Montserrat'] ${textPrimary}`}>Sales Performance</h3>
              <p className={`text-xs ${textMuted}`}>Monthly sales vs target comparison</p>
            </div>
            <span className="inline-flex px-3 py-1 text-xs font-semibold uppercase tracking-wider font-['Montserrat'] rounded-full bg-[rgba(215,183,151,0.15)] text-[#D7B797] border border-[rgba(215,183,151,0.3)]">
              Live Data
            </span>
          </div>
          <div className="mt-5">
            <svg viewBox="0 0 520 220" className="w-full h-56">
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D7B797" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#D7B797" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="30" y1="180" x2="500" y2="180" stroke={darkMode ? '#2E2E2E' : '#e5e7eb'} strokeDasharray="6 6" />
              <line x1="30" y1="120" x2="500" y2="120" stroke={darkMode ? '#2E2E2E' : '#e5e7eb'} strokeDasharray="6 6" />
              <line x1="30" y1="60" x2="500" y2="60" stroke={darkMode ? '#2E2E2E' : '#e5e7eb'} strokeDasharray="6 6" />
              <path
                d="M30 180 L90 160 L150 140 L210 130 L270 115 L330 100 L390 85 L450 70 L500 60 L500 200 L30 200 Z"
                fill="url(#salesFill)"
              />
              <polyline
                fill="none"
                stroke="#D7B797"
                strokeWidth="3"
                points="30,180 90,160 150,140 210,130 270,115 330,100 390,85 450,70 500,60"
              />
              <polyline
                fill="none"
                stroke="#127749"
                strokeDasharray="6 6"
                strokeWidth="2"
                points="30,190 90,170 150,155 210,140 270,130 330,118 390,108 450,98 500,88"
              />
            </svg>
          </div>
        </div>

        {/* Active Alerts */}
        <div className={`border ${panelBg} rounded-lg p-5 transition-all duration-150 hover:border-[rgba(215,183,151,0.25)]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode ? 'bg-[rgba(215,183,151,0.15)]' : 'bg-[rgba(215,183,151,0.1)]'
              }`}>
                <Bell size={18} className="text-[#D7B797]" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold font-['Montserrat'] ${textPrimary}`}>Active Alerts</h3>
                <p className={`text-xs ${textMuted}`}>4 active alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[rgba(248,81,73,0.15)] text-[#FF7B72] font-semibold">1</span>
              <span className="px-2 py-1 rounded bg-[rgba(210,153,34,0.15)] text-[#E3B341] font-semibold">1</span>
              <span className="px-2 py-1 rounded bg-[rgba(88,166,255,0.15)] text-[#79C0FF] font-semibold">1</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {/* Critical Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.08)] hover:border-[rgba(248,81,73,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(248,81,73,0.2)]">
                  <Bell size={16} className="text-[#F85149]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>Low Stock Alert</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>15m ago</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    Nike Air Max 90 (Size 42) inventory below threshold. Immediate replenishment required.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#FF7B72] hover:text-[#F85149] transition-colors">View details</button>
                </div>
              </div>
            </div>

            {/* Warning Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(210,153,34,0.3)] bg-[rgba(210,153,34,0.08)] hover:border-[rgba(210,153,34,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(210,153,34,0.2)]">
                  <TrendingUp size={16} className="text-[#D29922]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>Budget Threshold Warning</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>1h ago</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    Adidas SS25 budget utilization at 92%. Consider reallocation or approval for additional funds.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#E3B341] hover:text-[#D29922] transition-colors">View details</button>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className={`border rounded-lg p-4 transition-all duration-150 border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.08)] hover:border-[rgba(88,166,255,0.5)]`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(88,166,255,0.2)]">
                  <BarChart3 size={16} className="text-[#58A6FF]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimary}`}>Sales Spike</span>
                    <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>3h ago</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-[#999999]' : 'text-gray-600'}`}>
                    Gucci Heritage line is outperforming plan by 18% this week. Review stock availability.
                  </p>
                  <button className="mt-2 text-xs font-semibold text-[#79C0FF] hover:text-[#58A6FF] transition-colors">View details</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
