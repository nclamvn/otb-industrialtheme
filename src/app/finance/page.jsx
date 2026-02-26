'use client';

import { useState } from 'react';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Wallet, Building2,
  Shield, FileText, Coins, Settings, HelpCircle, ChevronDown,
  PanelLeftClose, Search, Calendar, Download, Plus, Send,
  RefreshCw, MoreHorizontal, ArrowUpDown, TrendingUp,
  TrendingDown, ArrowUpRight, ChevronRight, Sun, Moon, Eye, Copy,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

/* ═══════════ PALETTE ═══════════ */
const GOLD = '#C4975A';
const GOLD_D = '#A67B3D';
const GOLD_XL = '#EDE0D0';
const AMBER = '#D4B082';
const BRONZE = '#7D5A28';
const DARK = '#2C2417';

/* ═══════════ CHART DATA ═══════════ */
const pieData = [
  { name: 'AMEX', value: 40, amount: '80K' },
  { name: 'HSBC', value: 32, amount: '62K' },
  { name: 'Others', value: 28, amount: '48K' },
];
const PIE_COLORS = [GOLD, BRONZE, GOLD_XL];

const providers = [
  { name: 'AMEX', pct: 100 },
  { name: 'HSBC', pct: 59.37 },
  { name: 'Bank of America', pct: 68.75 },
  { name: 'Citibank', pct: 62.5 },
];

const cashFlow = [
  { date: '18 Oct', income: 3200, expense: -1800 },
  { date: '21 Oct', income: 2800, expense: -2200 },
  { date: '25 Oct', income: 4100, expense: -1500 },
  { date: '28 Oct', income: 3600, expense: -2800 },
  { date: '2 Nov', income: 2900, expense: -1900 },
  { date: '5 Nov', income: 4500, expense: -2100 },
  { date: '9 Nov', income: 3800, expense: -2500 },
  { date: '12 Nov', income: 5200, expense: -1700 },
];

const volumeData = [
  { date: '18 Oct', credit: 45000, bank: 28000 },
  { date: '21 Oct', credit: 52000, bank: 31000 },
  { date: '25 Oct', credit: 48000, bank: 35000 },
  { date: '28 Oct', credit: 55000, bank: 29000 },
  { date: '2 Nov', credit: 62000, bank: 38000 },
  { date: '5 Nov', credit: 58000, bank: 42000 },
  { date: '9 Nov', credit: 70000, bank: 35000 },
  { date: '12 Nov', credit: 65000, bank: 40000 },
];

const transactions = [
  { amount: '$4,242.00', fee: '0.5', merchant: '52 - Zoyami Trading', customer: 'janedoe@gmail.com', provider: 'Amex', date: '02/31/24, 11:58 AM', status: 'Succeeded' },
  { amount: '$106.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'dolores@gmail.com', provider: 'HSBC', date: '02/31/24, 11:58 AM', status: 'Pending' },
  { amount: '$328.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'tanya@gmail.com', provider: 'Bank of America', date: '02/31/24, 11:58 AM', status: 'Succeeded' },
  { amount: '$871.32', fee: '0.5', merchant: '32 - Paul Trading', customer: 'michael@example.com', provider: 'Chase', date: '02/31/24, 11:58 AM', status: 'Succeeded' },
  { amount: '$192.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'curtis@example.com', provider: 'Citibank', date: '02/31/24, 11:58 AM', status: 'Pending' },
  { amount: '$268.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'mitc@example.com', provider: 'Amex', date: '02/31/24, 11:58 AM', status: 'Pending' },
  { amount: '$567.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'felicia@example.com', provider: 'HSBC', date: '02/31/24, 11:58 AM', status: 'Pending' },
  { amount: '$994.00', fee: '0.5', merchant: '32 - Paul Trading', customer: 'rivera@example.com', provider: 'Chase', date: '02/31/24, 11:58 AM', status: 'Succeeded' },
];

const recentActivity = [
  { name: 'Theo Lawrence', action: 'Add', date: 'Oct 18, 2024', amount: '€ 500,00', sub: '120 USD', status: 'Success', method: 'Credit Card', card: '**** 3560' },
  { name: 'Amy March', action: 'Sent', date: 'May 24, 2024', amount: '- € 250,00', sub: '80 USD', status: 'Pending', method: 'Bank Transfer', card: '**** 2285' },
];

/* ═══════════ NAV CONFIG ═══════════ */
const navSections = [
  {
    label: 'GENERAL',
    items: [
      { icon: LayoutDashboard, text: 'Dashboard', active: true },
      { icon: CreditCard, text: 'Payment' },
      { icon: ArrowLeftRight, text: 'Transaction' },
      { icon: Wallet, text: 'Cards', sub: true },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { icon: Building2, text: 'Capital' },
      { icon: Shield, text: 'Vaults' },
      { icon: FileText, text: 'Reports' },
      { icon: Coins, text: 'Earn', badge: '150' },
    ],
  },
];

/* ═══════════ CUSTOM TOOLTIP ═══════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-semibold text-content mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-content-secondary">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: p.color }} />
          {p.name || p.dataKey}: <span className="font-data font-semibold text-content">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function FinanceDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  return (
    <div className="flex h-screen bg-canvas font-brand text-content overflow-hidden">

      {/* ──────── SIDEBAR ──────── */}
      <aside
        className={`${sidebarOpen ? 'w-[260px]' : 'w-[72px]'} flex-shrink-0 bg-white border-r border-border flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-border-muted">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dafc-gold to-dafc-gold-dark flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">DAFC Finance</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <PanelLeftClose className={`w-4 h-4 text-content-muted transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((sec) => (
            <div key={sec.label}>
              {sidebarOpen && (
                <p className="text-[11px] font-semibold tracking-wider text-content-muted mb-2 px-2 uppercase">
                  {sec.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {sec.items.map((item) => (
                  <li key={item.text}>
                    <a
                      href="#"
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors
                        ${item.active
                          ? 'bg-dafc-gold/10 text-dafc-gold font-semibold'
                          : 'text-content-secondary hover:bg-surface-secondary'
                        }`}
                    >
                      <span className="relative flex-shrink-0">
                        <item.icon className={`w-[18px] h-[18px] ${item.active ? 'text-dafc-gold' : ''}`} />
                        {item.active && (
                          <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-dafc-gold" />
                        )}
                      </span>
                      {sidebarOpen && (
                        <>
                          <span className="flex-1">{item.text}</span>
                          {item.sub && <ChevronDown className="w-4 h-4 text-content-muted" />}
                          {item.badge && (
                            <span className="text-[10px] font-bold bg-dafc-gold/15 text-dafc-gold px-2 py-0.5 rounded-full">
                              {'€'} {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Bottom */}
        {sidebarOpen && (
          <div className="border-t border-border-muted p-3 space-y-3">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-content-secondary hover:bg-surface-secondary transition-colors">
              <Settings className="w-[18px] h-[18px]" /> Settings
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-content-secondary hover:bg-surface-secondary transition-colors">
              <HelpCircle className="w-[18px] h-[18px]" /> Help
            </a>

            {/* Theme Toggle */}
            <div className="flex items-center bg-surface-secondary rounded-full p-0.5">
              <button
                onClick={() => setIsDark(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${!isDark ? 'bg-white shadow-sm text-content' : 'text-content-muted'}`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                onClick={() => setIsDark(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${isDark ? 'bg-white shadow-sm text-content' : 'text-content-muted'}`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>

            {/* Premium Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dafc-gold/10 via-dafc-gold/5 to-transparent p-4">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 opacity-[0.07]">
                <TrendingUp className="w-full h-full text-dafc-gold" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-dafc-gold/15 flex items-center justify-center mb-3">
                <Coins className="w-4 h-4 text-dafc-gold" />
              </div>
              <button className="mb-3 text-xs font-semibold bg-dafc-gold text-white px-3 py-1.5 rounded-full hover:bg-dafc-gold-dark transition-colors">
                Upgrade Now <ChevronRight className="inline w-3 h-3 -mt-px" />
              </button>
              <p className="font-bold text-sm">Premium +</p>
              <p className="text-xs text-content-muted">Get started right now.</p>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dafc-gold to-dafc-gold-dark flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                YA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Young Alaska</p>
                <p className="text-[11px] text-content-muted truncate">alskayng@gmail.com</p>
              </div>
              <ChevronDown className="w-4 h-4 text-content-muted flex-shrink-0" />
            </div>
            <p className="text-[10px] text-content-muted text-center">@ 2024 DAFC Finance Inc.</p>
          </div>
        )}
      </aside>

      {/* ──────── MAIN ──────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header Bar */}
        <header className="h-[60px] flex items-center gap-4 px-6 bg-white border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 bg-surface-secondary rounded-xl px-3 py-2 w-[240px]">
            <Search className="w-4 h-4 text-content-muted" />
            <span className="text-sm text-content-muted flex-1">Search</span>
            <kbd className="text-[10px] font-mono bg-white border border-border rounded px-1.5 py-0.5 text-content-muted">{'⌘'}+F</kbd>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <Calendar className="w-4 h-4" />
            <span>18 Oct 2024 - 18 Nov 2024</span>
          </div>
          <select className="text-sm border border-border rounded-xl px-3 py-1.5 bg-white text-content cursor-pointer focus:outline-none focus:ring-2 focus:ring-dafc-gold/25">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 text-sm font-medium border border-border rounded-xl px-3 py-1.5 hover:bg-surface-secondary transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dafc-gold to-dafc-gold-dark flex items-center justify-center text-white text-sm font-bold cursor-pointer">
            YA
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── TOTAL BALANCE ── */}
          <div className="rounded-2xl bg-gradient-to-r from-[#2C2417] via-[#3D3222] to-[#2C2417] p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #C4975A 0%, transparent 50%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/70">Total Balance</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold font-data tracking-tight text-white">{'€'} 320.845,20</span>
                <span className="text-sm font-semibold text-dafc-gold">
                  15.8% <ArrowUpRight className="inline w-3.5 h-3.5" />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 relative">
              <button className="flex items-center gap-2 bg-dafc-gold hover:bg-dafc-gold-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-dafc-gold/20">
                <Plus className="w-4 h-4" /> Add
              </button>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                <Send className="w-4 h-4" /> Send
              </button>
              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4" /> Request
              </button>
              <button className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-colors">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* ── PAYMENT TYPES + PROVIDER BREAKDOWN ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Payment Types */}
            <div className="bg-white rounded-2xl border border-border-muted p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-content-muted" />
                  <h3 className="font-semibold text-base">Payment Types</h3>
                </div>
                <select className="text-xs border border-border rounded-xl px-3 py-1.5 text-content-secondary bg-white focus:outline-none">
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="relative h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-data text-content">2.87K</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-muted">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-[3px] h-5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <div>
                      <p className="text-xs text-content-muted">{d.name}</p>
                      <p className="text-sm font-bold font-data">
                        {d.value}% <span className="font-normal text-content-muted">{d.amount}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider Breakdown */}
            <div className="bg-white rounded-2xl border border-border-muted p-6 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-content-muted" />
                  <h3 className="font-semibold text-base">Provider Breakdown</h3>
                </div>
                <select className="text-xs border border-border rounded-xl px-3 py-1.5 text-content-secondary bg-white focus:outline-none">
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="space-y-4">
                {providers.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-content-muted w-4 text-right font-data">{i + 1}.</span>
                    <span className="text-sm font-medium w-[130px] truncate">{p.name}</span>
                    <div className="flex-1 bg-dafc-gold-lighter/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-dafc-gold to-dafc-gold-light transition-all duration-500"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-data font-semibold w-[60px] text-right">{p.pct}%</span>
                    <div className="w-6 h-6 rounded bg-surface-secondary flex items-center justify-center">
                      <Building2 className="w-3 h-3 text-content-muted" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border-muted flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold font-data">15.62%</p>
                  <p className="text-xs text-content-muted">All Provider Breakdown</p>
                </div>
                <p className="text-xs text-content-muted">18 Oct 2024 – 18 Nov 2024</p>
              </div>
            </div>
          </div>

          {/* ── CASH FLOW ── */}
          <div className="bg-white rounded-2xl border border-border-muted p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-content-muted" />
                <h3 className="font-semibold text-base">Cash Flow</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-surface-secondary rounded-xl p-0.5">
                  <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white shadow-sm text-content">Weekly</button>
                  <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-content-muted hover:text-content transition-colors">Daily</button>
                </div>
                <button className="text-xs font-medium border border-border rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:bg-surface-secondary transition-colors">
                  <Settings className="w-3 h-3" /> Manage
                </button>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-1 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashFlow} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8C8178' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `€ ${Math.abs(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="income" name="Income" fill={GOLD} radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="expense" name="Expense" fill={DARK} radius={[0, 0, 4, 4]} barSize={18} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[200px] flex flex-col gap-4 justify-center">
                <div className="bg-surface-secondary rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-dafc-gold/15 flex items-center justify-center mb-2">
                    <TrendingUp className="w-4 h-4 text-dafc-gold" />
                  </div>
                  <p className="text-xs text-content-muted mb-0.5">Income</p>
                  <p className="text-lg font-bold font-data">{'€'} 12.378,20</p>
                  <span className="text-xs font-semibold text-status-success">
                    45.0% <ArrowUpRight className="inline w-3 h-3" />
                  </span>
                </div>
                <div className="bg-surface-secondary rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-status-critical-muted flex items-center justify-center mb-2">
                    <TrendingDown className="w-4 h-4 text-status-critical" />
                  </div>
                  <p className="text-xs text-content-muted mb-0.5">Expense</p>
                  <p className="text-lg font-bold font-data">{'€'} 5.788,21</p>
                  <span className="text-xs font-semibold text-status-critical">
                    12.5% <TrendingDown className="inline w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACCOUNT SUMMARY CARDS ── */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Business account', icon: Building2, amount: '€ 8.672,20', change: '+16.0%', positive: true, vs: '7.120,14' },
              { title: 'Total Saving', icon: Shield, amount: '€ 3.765,35', change: '-8.2%', positive: false, vs: '4.116,50' },
              { title: 'Tax Reserve', icon: FileText, amount: '€ 14.376,16', change: '+35.2%', positive: true, vs: '10.236,46' },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-border-muted p-5 shadow-card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-dafc-gold/10 flex items-center justify-center">
                      <card.icon className="w-3.5 h-3.5 text-dafc-gold" />
                    </div>
                    <span className="text-sm font-medium">{card.title}</span>
                  </div>
                  <span className="text-[11px] text-content-muted">Last 30 days</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold font-data">{card.amount}</span>
                  <span className={`text-xs font-semibold ${card.positive ? 'text-status-success' : 'text-status-critical'}`}>
                    {card.change}{' '}
                    {card.positive
                      ? <ArrowUpRight className="inline w-3 h-3" />
                      : <TrendingDown className="inline w-3 h-3" />}
                  </span>
                </div>
                <p className="text-xs text-content-muted">vs. {card.vs} Last Period</p>
              </div>
            ))}
          </div>

          {/* ── RECENT ACTIVITY + MY CARDS ── */}
          <div className="grid grid-cols-5 gap-6">

            {/* Recent Activity */}
            <div className="col-span-3 bg-white rounded-2xl border border-border-muted p-6 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-content-muted" />
                  <h3 className="font-semibold text-base">Recent Activity</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs font-medium border border-border rounded-xl px-3 py-1.5 flex items-center gap-1.5 hover:bg-surface-secondary transition-colors">
                    <ArrowUpDown className="w-3 h-3" /> Sort
                  </button>
                  <button className="p-1.5 border border-border rounded-xl hover:bg-surface-secondary transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5 text-content-muted" />
                  </button>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                    <th className="text-left pb-3">Type</th>
                    <th className="text-left pb-3">Amount</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.name} className="border-t border-border-muted">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                            ${row.action === 'Add' ? 'bg-dafc-gold/10 text-dafc-gold' : 'bg-status-info-muted text-status-info'}`}
                          >
                            {row.action === 'Add' ? <Plus className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{row.name}</p>
                            <p className="text-[11px] text-content-muted">{row.action} &middot; {row.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-sm font-data font-semibold">{row.amount}</p>
                        <p className="text-[11px] text-content-muted font-data">{row.sub}</p>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                          ${row.status === 'Success' ? 'bg-status-success-muted text-status-success-text' : 'bg-dafc-gold/10 text-dafc-gold'}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="text-sm">{row.method}</p>
                        <p className="text-[11px] text-content-muted font-data">{row.card}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* My Cards */}
            <div className="col-span-2 bg-white rounded-2xl border border-border-muted p-6 shadow-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-base">My Cards</h3>
                <a href="#" className="text-xs font-semibold text-dafc-gold hover:text-dafc-gold-dark transition-colors">
                  See All <ArrowUpRight className="inline w-3 h-3" />
                </a>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-dafc-gold via-dafc-gold-dark to-[#7D5A28] p-5 text-white flex flex-col justify-between" style={{ aspectRatio: '1.7 / 1' }}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold tracking-[0.15em]">VISA</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/30" />
                    <div className="w-6 h-6 rounded-full bg-white/20" />
                  </div>
                </div>
                <div>
                  <p className="text-sm tracking-[0.25em] font-data mb-4 opacity-90">**** **** **** 2104</p>
                  <p className="text-2xl font-bold font-data">{'€'} 4.540,20</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── MONTHLY VOLUME ── */}
          <div className="bg-white rounded-2xl border border-border-muted p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-base">Monthly Volume</h3>
              <select className="text-xs border border-border rounded-xl px-3 py-1.5 text-content-secondary bg-white focus:outline-none">
                <option>Last 7 days</option>
              </select>
            </div>
            <div className="flex gap-6">
              <div className="flex-1 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#8C8178' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$ ${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="credit" name="Credit Debit Card" stroke={DARK} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="bank" name="Bank Amount" stroke={GOLD} strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[210px] flex flex-col gap-5 justify-center">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3 h-3 rounded" style={{ background: DARK }} />
                    <span className="text-xs text-content-muted">Credit Debit Card</span>
                  </div>
                  <p className="text-xl font-bold font-data">$ 12.378,20</p>
                  <span className="text-xs font-semibold text-status-success">
                    45.0% <ArrowUpRight className="inline w-3 h-3" />
                  </span>
                </div>
                <div className="border-t border-border-muted pt-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3 h-3 rounded" style={{ background: GOLD }} />
                    <span className="text-xs text-content-muted">Bank Amount</span>
                  </div>
                  <p className="text-xl font-bold font-data">$ 5.788,21</p>
                  <span className="text-xs font-semibold text-status-critical">
                    12.5% <TrendingDown className="inline w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TRANSACTION OVERVIEW ── */}
          <div className="bg-white rounded-2xl border border-border-muted p-6 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-content-muted" />
                <h3 className="font-semibold text-base">Transaction Overview</h3>
              </div>
              <select className="text-xs border border-border rounded-xl px-3 py-1.5 text-content-secondary bg-white focus:outline-none">
                <option>Last 7 days</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[11px] font-semibold text-content-muted uppercase tracking-wider border-b border-border-muted">
                    <th className="text-left pb-3 pr-4 w-8">
                      <input type="checkbox" className="rounded border-border accent-dafc-gold" />
                    </th>
                    <th className="text-left pb-3 pr-4">Amount</th>
                    <th className="text-left pb-3 pr-4">Total Fee</th>
                    <th className="text-left pb-3 pr-4">Merchant</th>
                    <th className="text-left pb-3 pr-4">Customer</th>
                    <th className="text-left pb-3 pr-4">Provider</th>
                    <th className="text-left pb-3 pr-4">Date</th>
                    <th className="text-left pb-3 pr-2">Status</th>
                    <th className="pb-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className="border-b border-border-muted last:border-0 hover:bg-surface-secondary/60 transition-colors">
                      <td className="py-3 pr-4">
                        <input type="checkbox" className="rounded border-border accent-dafc-gold" />
                      </td>
                      <td className="py-3 pr-4 text-sm font-data font-semibold">{tx.amount}</td>
                      <td className="py-3 pr-4 text-sm text-content-muted">
                        <Copy className="inline w-3 h-3 mr-1 opacity-50" />{tx.fee}
                      </td>
                      <td className="py-3 pr-4 text-sm">{tx.merchant}</td>
                      <td className="py-3 pr-4 text-sm text-status-info">{tx.customer}</td>
                      <td className="py-3 pr-4 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-content-muted" /> {tx.provider}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-content-muted font-data">{tx.date}</td>
                      <td className="py-3 pr-2">
                        <span className={`text-xs font-semibold ${tx.status === 'Succeeded' ? 'text-status-success' : 'text-dafc-gold'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <MoreHorizontal className="w-4 h-4 text-content-muted cursor-pointer hover:text-content transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-muted">
              <p className="text-xs text-content-muted">919 results</p>
              <div className="flex items-center gap-2">
                <button className="text-xs font-medium border border-border rounded-xl px-4 py-1.5 hover:bg-surface-secondary transition-colors">
                  Previous
                </button>
                <button className="text-xs font-medium border border-border rounded-xl px-4 py-1.5 hover:bg-surface-secondary transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
