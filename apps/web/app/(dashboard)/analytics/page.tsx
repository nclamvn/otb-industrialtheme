'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/dashboard/stats-card';
import { BudgetChart } from '@/components/dashboard/budget-chart';
import { OTBTrendsChart } from '@/components/dashboard/otb-trends-chart';
import { Heatmap, GaugeChart, ForecastChart, WaterfallChart, RadarChart } from '@/components/charts';
import {
  BarChart3,
  TrendingUp,
  Target,
  Calculator,
  Sparkles,
  ArrowRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Building2,
  DollarSign,
} from 'lucide-react';
import {
  StorePerformanceCard,
  StoreComparisonPanel,
  useStorePerformance,
} from '@/components/store-performance';
import {
  PriceRangeChart,
  PriceRangePanel,
  usePriceRange,
} from '@/components/price-range';
import { VarianceIndicator } from '@/components/shared/VarianceIndicator';

// Demo data - static values
const summaryMetrics = {
  totalSales: 8200000,
  sellThrough: 72.4,
  avgMargin: 58.2,
  inventory: 3100000,
};

const forecastData = [
  { date: 'Jan', actual: 1100000, forecast: undefined, lowerBound: undefined, upperBound: undefined },
  { date: 'Feb', actual: 1350000, forecast: undefined, lowerBound: undefined, upperBound: undefined },
  { date: 'Mar', actual: 1550000, forecast: undefined, lowerBound: undefined, upperBound: undefined },
  { date: 'Apr', actual: 1750000, forecast: undefined, lowerBound: undefined, upperBound: undefined },
  { date: 'May', actual: 1900000, forecast: 1950000, lowerBound: 1850000, upperBound: 2050000 },
  { date: 'Jun', actual: undefined, forecast: 2150000, lowerBound: 1950000, upperBound: 2350000 },
  { date: 'Jul', actual: undefined, forecast: 2300000, lowerBound: 2050000, upperBound: 2550000 },
  { date: 'Aug', actual: undefined, forecast: 2400000, lowerBound: 2100000, upperBound: 2700000 },
];

const insightColors = {
  opportunity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  risk: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  trend: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AnalyticsPage() {
  const t = useTranslations('pages.analytics');

  const [selectedSeason, setSelectedSeason] = useState('ss25');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Store Performance & Price Range hooks
  const { comparisons: storeData, summary: storeSummary } = useStorePerformance({});
  const { analysis: priceAnalysis } = usePriceRange();

  // Translated demo data
  const heatmapData = useMemo(() => [
    { x: 'Bags', y: 'Women', value: 85, label: t('heatmapLabels.womensBags', { value: 85 }) },
    { x: 'Shoes', y: 'Women', value: 72, label: t('heatmapLabels.womensShoes', { value: 72 }) },
    { x: 'RTW', y: 'Women', value: 45, label: t('heatmapLabels.womensRtw', { value: 45 }) },
    { x: 'Accessories', y: 'Women', value: 30, label: t('heatmapLabels.womensAccessories', { value: 30 }) },
    { x: 'Bags', y: 'Men', value: 55, label: t('heatmapLabels.mensBags', { value: 55 }) },
    { x: 'Shoes', y: 'Men', value: 88, label: t('heatmapLabels.mensShoes', { value: 88 }) },
    { x: 'RTW', y: 'Men', value: 48, label: t('heatmapLabels.mensRtw', { value: 48 }) },
    { x: 'Accessories', y: 'Men', value: 52, label: t('heatmapLabels.mensAccessories', { value: 52 }) },
  ], [t]);

  const waterfallData = useMemo(() => [
    { name: t('waterfallLabels.beginning'), value: 5000000, isTotal: true },
    { name: t('waterfallLabels.newOrders'), value: 2500000 },
    { name: t('waterfallLabels.returns'), value: -300000 },
    { name: t('waterfallLabels.markdowns'), value: -450000 },
    { name: t('waterfallLabels.shrinkage'), value: -150000 },
    { name: t('waterfallLabels.adjustments'), value: 100000 },
    { name: t('waterfallLabels.current'), value: 0, isTotal: true },
  ], [t]);

  const radarData = useMemo(() => [
    { axis: t('radarLabels.sellThrough'), current: 72, target: 70 },
    { axis: t('radarLabels.margin'), current: 58, target: 55 },
    { axis: t('radarLabels.inventoryTurn'), current: 65, target: 70 },
    { axis: t('radarLabels.skuProductivity'), current: 80, target: 75 },
    { axis: t('radarLabels.otbUtilization'), current: 95, target: 100 },
    { axis: t('radarLabels.customerSat'), current: 88, target: 85 },
  ], [t]);

  const aiInsights = useMemo(() => [
    {
      type: 'opportunity' as const,
      title: t('demoInsights.footwearDemand.title'),
      description: t('demoInsights.footwearDemand.description'),
      impact: 'high',
      value: t('demoInsights.footwearDemand.value'),
    },
    {
      type: 'risk' as const,
      title: t('demoInsights.bagsInventoryRisk.title'),
      description: t('demoInsights.bagsInventoryRisk.description'),
      impact: 'medium',
      value: t('demoInsights.bagsInventoryRisk.value'),
    },
    {
      type: 'trend' as const,
      title: t('demoInsights.rtwTrending.title'),
      description: t('demoInsights.rtwTrending.description'),
      impact: 'medium',
      value: t('demoInsights.rtwTrending.value'),
    },
  ], [t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('season')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ss25">SS 2025</SelectItem>
              <SelectItem value="fw25">FW 2025</SelectItem>
              <SelectItem value="ss24">SS 2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('brand')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allBrands')}</SelectItem>
              <SelectItem value="nike">Nike</SelectItem>
              <SelectItem value="adidas">Adidas</SelectItem>
              <SelectItem value="puma">Puma</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('totalSales')}
          value={`$${(summaryMetrics.totalSales / 1000000).toFixed(1)}M`}
          description={t('currentSeason')}
          icon="DollarSign"
          color="green"
          trend={{ value: 12.3, label: t('vsLastSeason') }}
          sparklineData={[5, 6, 7, 7.5, 8, 8.2, 8.2]}
        />
        <StatsCard
          title={t('sellThroughRate')}
          value={`${summaryMetrics.sellThrough}%`}
          description={t('unitsSoldReceived')}
          icon="Percent"
          color="blue"
          trend={{ value: 5.2, label: t('vsTarget') }}
          sparklineData={[65, 68, 70, 71, 72, 72, 72.4]}
        />
        <StatsCard
          title={t('avgMargin')}
          value={`${summaryMetrics.avgMargin}%`}
          description={t('grossMarginPct')}
          icon="TrendingUp"
          color="purple"
          trend={{ value: -2.1, label: t('vsTarget') }}
          sparklineData={[60, 59, 58.5, 58, 58.2, 58.2, 58.2]}
        />
        <StatsCard
          title={t('inventoryValue')}
          value={`$${(summaryMetrics.inventory / 1000000).toFixed(1)}M`}
          description={t('currentInventoryCost')}
          icon="Package"
          color="orange"
          trend={{ value: -8.5, label: t('vsLastMonth') }}
          sparklineData={[3.8, 3.5, 3.3, 3.2, 3.1, 3.1, 3.1]}
        />
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/analytics/demand">
          <Card className="relative overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full">
            <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('demandForecasting')}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-blue-600">
                {t('aiPredictions')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('viewDemandForecasts')}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/performance">
          <Card className="relative overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full">
            <Target className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('performance')}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-green-600">
                {t('kpiTracking')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('viewPerformanceMetrics')}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/simulator">
          <Card className="relative overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full">
            <Calculator className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('whatIfSimulator')}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-purple-600">
                {t('scenarioPlanning')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('runSimulations')}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/insights">
          <Card className="relative overflow-hidden hover:border-primary/50 transition-colors cursor-pointer h-full">
            <Sparkles className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('aiInsights')}</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight text-orange-600">
                {t('smartRecommendations')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('viewAiInsights')}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            Store Performance
          </TabsTrigger>
          <TabsTrigger value="price" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Price Analysis
          </TabsTrigger>
          <TabsTrigger value="forecast">{t('forecast')}</TabsTrigger>
          <TabsTrigger value="performance">{t('performance')}</TabsTrigger>
          <TabsTrigger value="category">{t('categoryAnalysis')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Category Heatmap */}
            <Heatmap
              data={heatmapData}
              title={t('categoryPerformance')}
              description={t('sellThroughByCategory')}
              xLabels={['Bags', 'Shoes', 'RTW', 'Accessories']}
              yLabels={['Women', 'Men']}
              colorScale="gradient"
              formatValue={(v) => `${v}%`}
            />

            {/* KPI Gauges */}
            <Card>
              <CardHeader>
                <CardTitle>{t('kpiPerformance')}</CardTitle>
                <CardDescription>{t('keyMetrics')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <GaugeChart
                    value={72.4}
                    min={0}
                    max={100}
                    target={70}
                    label={t('gaugeLabels.sellThrough')}
                    unit="%"
                    zones={[
                      { from: 0, to: 50, color: '#ef4444' },
                      { from: 50, to: 70, color: '#f59e0b' },
                      { from: 70, to: 100, color: '#22c55e' },
                    ]}
                  />
                  <GaugeChart
                    value={58.2}
                    min={0}
                    max={100}
                    target={55}
                    label={t('gaugeLabels.grossMargin')}
                    unit="%"
                  />
                  <GaugeChart
                    value={4.2}
                    min={0}
                    max={8}
                    target={4}
                    label={t('gaugeLabels.inventoryTurn')}
                    unit="x"
                    zones={[
                      { from: 0, to: 2, color: '#ef4444' },
                      { from: 2, to: 4, color: '#f59e0b' },
                      { from: 4, to: 8, color: '#22c55e' },
                    ]}
                  />
                  <GaugeChart
                    value={95}
                    min={0}
                    max={120}
                    target={100}
                    label={t('gaugeLabels.otbUtilization')}
                    unit="%"
                    zones={[
                      { from: 0, to: 80, color: '#ef4444' },
                      { from: 80, to: 95, color: '#f59e0b' },
                      { from: 95, to: 105, color: '#22c55e' },
                      { from: 105, to: 120, color: '#f59e0b' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('aiInsights')}
                  </CardTitle>
                  <CardDescription>{t('poweredByClaude')}</CardDescription>
                </div>
                <Link href="/analytics/insights">
                  <Button variant="ghost" size="sm">
                    {t('viewAll')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {aiInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={insightColors[insight.type]}>
                        {insight.type === 'opportunity' ? t('opportunity') :
                         insight.type === 'risk' ? t('risk') : t('trend')}
                      </Badge>
                      <span className="text-sm font-semibold text-primary">
                        {insight.value}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Performance Tab */}
        <TabsContent value="store" className="space-y-6">
          {/* Store Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <StorePerformanceCard
              data={{
                id: 'rex',
                storeGroup: 'REX',
                sellThruPercent: storeSummary.rex.avgSellThru,
                qtyReceived: 500,
                qtySold: Math.round(500 * storeSummary.rex.avgSellThru),
                qtyOnHand: Math.round(500 * (1 - storeSummary.rex.avgSellThru)),
                salesValue: storeSummary.rex.totalSalesValue,
                salesUnits: storeSummary.rex.totalSalesUnits,
                trend: 'up',
              }}
              showDetails={true}
            />
            <StorePerformanceCard
              data={{
                id: 'ttp',
                storeGroup: 'TTP',
                sellThruPercent: storeSummary.ttp.avgSellThru,
                qtyReceived: 500,
                qtySold: Math.round(500 * storeSummary.ttp.avgSellThru),
                qtyOnHand: Math.round(500 * (1 - storeSummary.ttp.avgSellThru)),
                salesValue: storeSummary.ttp.totalSalesValue,
                salesUnits: storeSummary.ttp.totalSalesUnits,
                trend: 'stable',
              }}
              showDetails={true}
            />
          </div>

          {/* SKU Comparison Panels */}
          <h3 className="font-semibold text-lg">SKU Comparison (REX vs TTP)</h3>
          <div className="space-y-4">
            {storeData.slice(0, 5).map((item) => (
              <StoreComparisonPanel key={item.sku.id} data={item} />
            ))}
          </div>
        </TabsContent>

        {/* Price Analysis Tab */}
        <TabsContent value="price" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-800">
              <div className="text-sm text-slate-500">Price Bands</div>
              <div className="text-2xl font-bold">{priceAnalysis.ranges.length}</div>
            </div>
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-800">
              <div className="text-sm text-slate-500">Avg Sell-Through</div>
              <div className="text-2xl font-bold text-green-600">
                {(priceAnalysis.ranges.reduce((sum, r) => sum + r.sellThruPercent, 0) / (priceAnalysis.ranges.length || 1)).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-800">
              <div className="text-sm text-slate-500">Total Units</div>
              <div className="text-2xl font-bold">{priceAnalysis.totalUnits.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-800">
              <div className="text-sm text-slate-500">YoY Trend</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">+12.5%</span>
                <VarianceIndicator value={0.125} />
              </div>
            </div>
          </div>

          <PriceRangePanel analysis={priceAnalysis} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <ForecastChart
            data={forecastData}
            title={t('salesForecast')}
            description={t('actualVsForecast')}
            confidence={0.85}
            accuracy={{ mape: 4.2, rmse: 120000 }}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <WaterfallChart
              data={waterfallData}
              title={t('inventoryMovement')}
              description={t('beginningToCurrent')}
            />
            <RadarChart
              data={radarData}
              series={[
                { dataKey: 'current', name: 'Current', color: 'hsl(var(--primary))' },
                { dataKey: 'target', name: 'Target', color: '#94a3b8', fillOpacity: 0.1 },
              ]}
              title={t('performanceRadar')}
              description={t('currentVsTarget')}
              maxValue={100}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <BudgetChart
            data={[
              { name: 'Nike', allocated: 5000000, utilized: 3200000 },
              { name: 'Adidas', allocated: 4000000, utilized: 2100000 },
              { name: 'Puma', allocated: 3000000, utilized: 1800000 },
              { name: 'Reebok', allocated: 2000000, utilized: 900000 },
              { name: 'NB', allocated: 1000000, utilized: 500000 },
            ]}
          />
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <OTBTrendsChart
            data={[
              { month: 'Jan', planned: 1200000, actual: 1100000, forecast: 1150000 },
              { month: 'Feb', planned: 1400000, actual: 1350000, forecast: 1380000 },
              { month: 'Mar', planned: 1600000, actual: 1550000, forecast: 1580000 },
              { month: 'Apr', planned: 1800000, actual: 1750000, forecast: 1780000 },
              { month: 'May', planned: 2000000, actual: 1900000, forecast: 1950000 },
              { month: 'Jun', planned: 2200000, actual: 0, forecast: 2150000 },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
