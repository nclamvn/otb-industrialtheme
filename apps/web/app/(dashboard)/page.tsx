import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import {
  DAFCKPICard,
  DAFCSalesTrendChart,
  DAFCCategoryTable,
  DAFCAlertsPanel,
  DAFCContextBar,
  ActivityFeed,
  QuickActions,
  AIInsightsWidget,
  PendingApprovals,
} from '@/components/dashboard';
import type { ActivityItem, QuickAction, AIInsight, PendingApproval } from '@/components/dashboard';

// Demo data for the DAFC-styled dashboard
function getDashboardData() {
  const stats = {
    brandsCount: 5,
    categoriesCount: 12,
    locationsCount: 8,
    usersCount: 24,
    currentSeason: { id: 'demo', name: 'Spring/Summer 2025', code: 'SS25', isCurrent: true },
    totalBudget: 15000000000,
    budgetUtilized: 8500000000,
    pendingApprovals: 7,
    activePlans: 12,
    totalSales: 12500000000,
    totalUnits: 45000,
    avgMargin: 42.5,
    sellThrough: 68.3,
  };

  // Sales trend data
  const salesTrendData = [
    { period: 'Jan', sales: 1200000000, target: 1100000000, lastYear: 950000000 },
    { period: 'Feb', sales: 1400000000, target: 1350000000, lastYear: 1100000000 },
    { period: 'Mar', sales: 1600000000, target: 1550000000, lastYear: 1300000000 },
    { period: 'Apr', sales: 1800000000, target: 1750000000, lastYear: 1450000000 },
    { period: 'May', sales: 2000000000, target: 1900000000, lastYear: 1600000000 },
    { period: 'Jun', sales: 2200000000, target: 2100000000, lastYear: 1800000000 },
  ];

  // Category performance data
  const categoryData = [
    { id: '1', name: 'Footwear', sales: 4500000000, target: 4200000000, units: 15000, margin: 45.2, trend: 12.5, status: 'exceeded' as const },
    { id: '2', name: 'Apparel - Men', sales: 3200000000, target: 3500000000, units: 12000, margin: 38.5, trend: -2.3, status: 'at-risk' as const },
    { id: '3', name: 'Apparel - Women', sales: 2800000000, target: 2800000000, units: 10000, margin: 42.1, trend: 5.8, status: 'on-track' as const },
    { id: '4', name: 'Accessories', sales: 1500000000, target: 1400000000, units: 5000, margin: 52.3, trend: 8.9, status: 'exceeded' as const },
    { id: '5', name: 'Equipment', sales: 500000000, target: 600000000, units: 3000, margin: 35.7, trend: -5.2, status: 'at-risk' as const },
  ];

  // Alerts data
  const alerts = [
    {
      id: '1',
      title: 'Low Stock Alert',
      description: 'Nike Air Max 90 (Size 42) inventory below threshold. Immediate replenishment required.',
      severity: 'critical' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      actionLabel: 'View Details',
      actionUrl: '/inventory/nike-air-max-90',
      dismissible: true,
    },
    {
      id: '2',
      title: 'Budget Threshold Warning',
      description: 'Adidas SS25 budget utilization at 92%. Consider reallocation or approval for additional funds.',
      severity: 'warning' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      actionLabel: 'Review Budget',
      actionUrl: '/budgets/adidas-ss25',
      dismissible: true,
    },
    {
      id: '3',
      title: 'OTB Plan Approved',
      description: 'Nike SS25 V3 OTB plan has been approved by Finance Head and is now active.',
      severity: 'success' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      dismissible: true,
    },
    {
      id: '4',
      title: 'New Size Profile Available',
      description: 'AI-generated size profile for Women\'s Running category is ready for review.',
      severity: 'info' as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      actionLabel: 'Review Profile',
      actionUrl: '/size-profiles/womens-running',
      dismissible: true,
    },
  ];

  // Context bar items
  const contextItems = [
    {
      id: 'season',
      label: 'Season',
      value: 'SS25',
      icon: 'calendar' as const,
      options: [
        { id: 'ss25', label: 'Spring/Summer 2025' },
        { id: 'fw24', label: 'Fall/Winter 2024' },
        { id: 'ss24', label: 'Spring/Summer 2024' },
      ],
    },
    {
      id: 'brand',
      label: 'Brand',
      value: 'All Brands',
      icon: 'brand' as const,
      options: [
        { id: 'all', label: 'All Brands' },
        { id: 'nike', label: 'Nike' },
        { id: 'adidas', label: 'Adidas' },
        { id: 'puma', label: 'Puma' },
      ],
    },
    {
      id: 'location',
      label: 'Region',
      value: 'Vietnam',
      icon: 'location' as const,
      options: [
        { id: 'vn', label: 'Vietnam' },
        { id: 'th', label: 'Thailand' },
        { id: 'sg', label: 'Singapore' },
      ],
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'budget',
      action: 'Budget Approved',
      description: 'Nike SS25 budget approved by Finance Head',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'success',
      user: 'John Smith',
      link: '/budgets',
    },
    {
      id: '2',
      type: 'otb',
      action: 'OTB Plan Submitted',
      description: 'Adidas SS25 V2 plan submitted for review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'pending',
      user: 'Jane Doe',
      link: '/otb-plans',
    },
    {
      id: '3',
      type: 'sku',
      action: 'SKU Validation Complete',
      description: '245 SKUs validated, 3 warnings found',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      status: 'warning',
      user: 'Mike Johnson',
      link: '/sku-proposals',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: '/budgets/new',
      icon: 'Plus',
      title: 'Create Budget',
      description: 'Start a new budget allocation',
      color: 'primary',
    },
    {
      href: '/otb-plans/new',
      icon: 'FileText',
      title: 'New OTB Plan',
      description: 'Create open-to-buy plan',
      color: 'secondary',
    },
    {
      href: '/sku-proposals/upload',
      icon: 'Package',
      title: 'Upload SKUs',
      description: 'Import SKU proposal file',
      color: 'success',
    },
    {
      href: '/approvals',
      icon: 'DollarSign',
      title: 'Review Approvals',
      description: 'View pending items',
      color: 'warning',
    },
  ];

  const aiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'trend',
      title: 'Strong Footwear Demand',
      description: 'Running shoes category showing 23% higher demand vs last season based on historical patterns.',
      impact: 'high',
      metric: {
        label: 'Projected Growth',
        value: '+23%',
        change: 23,
      },
      actionUrl: '/otb-plans?category=footwear',
    },
    {
      id: '2',
      type: 'anomaly',
      title: 'Budget Utilization Gap',
      description: 'Nike SS25 budget is only 64% utilized with 45 days remaining in the planning cycle.',
      impact: 'medium',
      metric: {
        label: 'Utilization Rate',
        value: '64%',
        change: -12,
      },
      actionUrl: '/budgets/nike-ss25',
    },
  ];

  const pendingApprovals: PendingApproval[] = [
    {
      id: '1',
      type: 'budget',
      title: 'Adidas SS25 Budget',
      description: 'Q1 allocation request',
      submittedBy: { name: 'Jane Doe' },
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      priority: 'high',
      amount: 4000000000,
      href: '/budgets/adidas-ss25',
    },
    {
      id: '2',
      type: 'otb',
      title: 'Puma OTB V2',
      description: 'Revised plan after feedback',
      submittedBy: { name: 'Mike Johnson' },
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      priority: 'medium',
      amount: 2500000000,
      href: '/otb-plans/puma-v2',
    },
  ];

  return {
    stats,
    salesTrendData,
    categoryData,
    alerts,
    contextItems,
    activities,
    quickActions,
    aiInsights,
    pendingApprovals,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations('dashboard');
  const data = getDashboardData();
  const { stats } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section - Modern Minimal Design */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-muted-foreground">
            {t('welcome', { name: session?.user?.name?.split(' ')[0] || 'User' })}
          </p>
          <p className="text-xs font-bold text-muted-foreground/70 mt-0.5">
            {t('overview')}
          </p>
        </div>
        <div className="dafc-badge dafc-badge-gold">
          <span>{stats.currentSeason.name}</span>
        </div>
      </div>

      {/* Context Bar */}
      <DAFCContextBar
        items={data.contextItems}
      />

      {/* Key KPIs - Unified Budget Card Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DAFCKPICard
          title="Total Sales"
          value={formatCurrency(stats.totalSales)}
          subtitle={`${stats.totalUnits.toLocaleString()} units sold`}
          icon="DollarSign"
          variant="blue"
          trend={{ value: 12.5, label: 'vs last season' }}
          sparklineData={[10, 12, 11, 14, 13, 15, 15.5]}
        />
        <DAFCKPICard
          title="Budget Utilization"
          value={`${Math.round((stats.budgetUtilized / stats.totalBudget) * 100)}%`}
          subtitle={formatCurrency(stats.budgetUtilized)}
          icon="Target"
          variant="purple"
          trend={{ value: 8.2, label: 'this month' }}
          sparklineData={[5, 6, 7, 7.5, 8, 8.2]}
        />
        <DAFCKPICard
          title="Avg Margin"
          value={`${stats.avgMargin}%`}
          subtitle="Across all categories"
          icon="Percent"
          variant="green"
          trend={{ value: 2.3, label: 'vs target' }}
        />
        <DAFCKPICard
          title="Sell-Through"
          value={`${stats.sellThrough}%`}
          subtitle="Current season performance"
          icon="ShoppingCart"
          variant="amber"
          trend={{ value: -1.5, label: 'vs last week' }}
          status="warning"
        />
      </div>

      {/* Secondary KPIs - Unified Budget Card Design */}
      <div className="grid gap-4 md:grid-cols-4">
        <DAFCKPICard
          title={t('totalBrands')}
          value={stats.brandsCount}
          subtitle={t('activeBrands')}
          icon="Building2"
          variant="blue"
        />
        <DAFCKPICard
          title={t('categories')}
          value={stats.categoriesCount}
          subtitle={t('productCategories')}
          icon="Package"
          variant="purple"
        />
        <DAFCKPICard
          title={t('pendingApprovals')}
          value={stats.pendingApprovals}
          subtitle={t('itemsAwaitingReview')}
          icon="Target"
          variant="amber"
          status={stats.pendingApprovals > 5 ? 'warning' : undefined}
        />
        <DAFCKPICard
          title={t('activePlans')}
          value={stats.activePlans}
          subtitle={t('otbPlansInProgress')}
          icon="BarChart3"
          variant="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DAFCSalesTrendChart
          data={data.salesTrendData}
          title="Sales Performance"
          subtitle="Monthly sales vs target comparison"
          variant="area"
          showTarget={true}
          showLastYear={true}
        />
        <DAFCAlertsPanel
          alerts={data.alerts}
          title="Active Alerts"
          maxVisible={4}
        />
      </div>

      {/* Category Performance Table */}
      <DAFCCategoryTable
        data={data.categoryData}
        title="Category Performance"
        subtitle="Sales performance by product category"
      />

      {/* Insights & Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIInsightsWidget insights={data.aiInsights} />
        <ActivityFeed activities={data.activities} maxHeight="350px" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={data.quickActions} />

      {/* Pending Approvals */}
      <PendingApprovals
        approvals={data.pendingApprovals}
        viewAllHref="/approvals"
      />
    </div>
  );
}
