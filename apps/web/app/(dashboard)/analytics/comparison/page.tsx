'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadarChart } from '@/components/charts/radar-chart';
import { Heatmap } from '@/components/charts/heatmap';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  GitCompare,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Building,
  Layers,
  MapPin,
} from 'lucide-react';

export default function ComparisonPage() {
  const t = useTranslations('pages.analyticsComparison');
  const [comparisonType, setComparisonType] = useState('season');
  const [primarySelection, setPrimarySelection] = useState('SS25');
  const [secondarySelection, setSecondarySelection] = useState('FW24');

  // Demo data for comparisons
  const seasonComparisonData = useMemo(() => [
    { metric: t('metrics.revenue'), SS25: 1500000, FW24: 1350000, SS24: 1250000 },
    { metric: t('metrics.unitsSold'), SS25: 45000, FW24: 42000, SS24: 38000 },
    { metric: t('metrics.avgPrice'), SS25: 33.33, FW24: 32.14, SS24: 32.89 },
    { metric: t('metrics.marginPercent'), SS25: 52.3, FW24: 50.1, SS24: 48.5 },
    { metric: t('metrics.sellThroughPercent'), SS25: 68.5, FW24: 65.2, SS24: 62.8 },
    { metric: t('metrics.markdownPercent'), SS25: 18.5, FW24: 22.1, SS24: 25.3 },
  ], [t]);

  const brandComparisonData = useMemo(() => [
    { brand: t('brands.brandA'), revenue: 450000, margin: 54.2, sellThrough: 72.5, inventory: 125000 },
    { brand: t('brands.brandB'), revenue: 380000, margin: 51.8, sellThrough: 68.3, inventory: 98000 },
    { brand: t('brands.brandC'), revenue: 320000, margin: 49.5, sellThrough: 65.1, inventory: 87000 },
    { brand: t('brands.brandD'), revenue: 280000, margin: 53.1, sellThrough: 70.2, inventory: 72000 },
    { brand: t('brands.brandE'), revenue: 70000, margin: 47.8, sellThrough: 58.9, inventory: 43000 },
  ], [t]);

  const categoryComparisonData = useMemo(() => [
    { category: t('categories.tops'), SS25: 520000, FW24: 480000, growth: 8.3 },
    { category: t('categories.bottoms'), SS25: 380000, FW24: 350000, growth: 8.6 },
    { category: t('categories.dresses'), SS25: 290000, FW24: 240000, growth: 20.8 },
    { category: t('categories.outerwear'), SS25: 180000, FW24: 190000, growth: -5.3 },
    { category: t('categories.accessories'), SS25: 130000, FW24: 90000, growth: 44.4 },
  ], [t]);

  const locationComparisonData = useMemo(() => [
    { location: t('locations.northeast'), revenue: 420000, margin: 53.5, trend: 'up' as const },
    { location: t('locations.southeast'), revenue: 380000, margin: 51.2, trend: 'up' as const },
    { location: t('locations.midwest'), revenue: 290000, margin: 50.8, trend: 'neutral' as const },
    { location: t('locations.southwest'), revenue: 250000, margin: 52.1, trend: 'up' as const },
    { location: t('locations.west'), revenue: 160000, margin: 48.9, trend: 'down' as const },
  ], [t]);

  const radarData = useMemo(() => [
    { axis: t('metrics.revenue'), current: 85, previous: 72, benchmark: 75 },
    { axis: t('metrics.margin'), current: 78, previous: 70, benchmark: 72 },
    { axis: t('metrics.sellThrough'), current: 82, previous: 75, benchmark: 78 },
    { axis: t('metrics.inventoryTurn'), current: 70, previous: 65, benchmark: 70 },
    { axis: t('metrics.customerSat'), current: 88, previous: 85, benchmark: 80 },
  ], [t]);

  const heatmapData = useMemo(() => [
    // Brands vs Metrics
    { x: t('brands.brandA'), y: t('metrics.revenue'), value: 92 },
    { x: t('brands.brandA'), y: t('metrics.margin'), value: 88 },
    { x: t('brands.brandA'), y: t('metrics.sellThrough'), value: 85 },
    { x: t('brands.brandA'), y: t('metrics.growth'), value: 78 },
    { x: t('brands.brandB'), y: t('metrics.revenue'), value: 78 },
    { x: t('brands.brandB'), y: t('metrics.margin'), value: 82 },
    { x: t('brands.brandB'), y: t('metrics.sellThrough'), value: 75 },
    { x: t('brands.brandB'), y: t('metrics.growth'), value: 65 },
    { x: t('brands.brandC'), y: t('metrics.revenue'), value: 65 },
    { x: t('brands.brandC'), y: t('metrics.margin'), value: 70 },
    { x: t('brands.brandC'), y: t('metrics.sellThrough'), value: 68 },
    { x: t('brands.brandC'), y: t('metrics.growth'), value: 72 },
    { x: t('brands.brandD'), y: t('metrics.revenue'), value: 55 },
    { x: t('brands.brandD'), y: t('metrics.margin'), value: 85 },
    { x: t('brands.brandD'), y: t('metrics.sellThrough'), value: 80 },
    { x: t('brands.brandD'), y: t('metrics.growth'), value: 60 },
  ], [t]);

  const heatmapXLabels = useMemo(() => [
    t('brands.brandA'), t('brands.brandB'), t('brands.brandC'), t('brands.brandD')
  ], [t]);

  const heatmapYLabels = useMemo(() => [
    t('metrics.revenue'), t('metrics.margin'), t('metrics.sellThrough'), t('metrics.growth')
  ], [t]);

  const getComparisonSelections = () => {
    switch (comparisonType) {
      case 'season':
        return ['SS25', 'FW24', 'SS24', 'FW23'];
      case 'brand':
        return [t('brands.brandA'), t('brands.brandB'), t('brands.brandC'), t('brands.brandD'), t('brands.brandE')];
      case 'category':
        return [t('categories.all'), t('categories.tops'), t('categories.bottoms'), t('categories.dresses'), t('categories.outerwear'), t('categories.accessories')];
      case 'location':
        return [t('locations.all'), t('locations.northeast'), t('locations.southeast'), t('locations.midwest'), t('locations.southwest'), t('locations.west')];
      default:
        return [];
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('exportReport')}
          </Button>
        </div>
      </div>

      {/* Comparison Type Selector */}
      <Card className="overflow-hidden">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">{t('compareBy')}</span>
            <Tabs value={comparisonType} onValueChange={setComparisonType}>
              <TabsList>
                <TabsTrigger value="season" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('season')}
                </TabsTrigger>
                <TabsTrigger value="brand" className="gap-2">
                  <Building className="h-4 w-4" />
                  {t('brand')}
                </TabsTrigger>
                <TabsTrigger value="category" className="gap-2">
                  <Layers className="h-4 w-4" />
                  {t('category')}
                </TabsTrigger>
                <TabsTrigger value="location" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('location')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 ml-auto">
              <Select value={primarySelection} onValueChange={setPrimarySelection}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getComparisonSelections().map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Select value={secondarySelection} onValueChange={setSecondarySelection}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getComparisonSelections().filter(i => i !== primarySelection).map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('revenueChange')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">$1.5M</div>
            <p className="text-sm text-muted-foreground mt-1">{t('vs')} $1.35M <Badge className="bg-green-500 ml-2">+11.1%</Badge></p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('marginImprovement')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">52.3%</div>
            <p className="text-sm text-muted-foreground mt-1">{t('vs')} 50.1% <Badge className="bg-green-500 ml-2">+2.2pp</Badge></p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('unitsGrowth')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">45K</div>
            <p className="text-sm text-muted-foreground mt-1">{t('vs')} 42K <Badge className="bg-green-500 ml-2">+7.1%</Badge></p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <TrendingDown className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('markdownReduction')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-orange-600">18.5%</div>
            <p className="text-sm text-muted-foreground mt-1">{t('vs')} 22.1% <Badge className="bg-green-500 ml-2">-3.6pp</Badge></p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metrics Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('keyMetricsComparison')}</CardTitle>
            <CardDescription>
              {t('sideBySideComparison', { primary: primarySelection, secondary: secondarySelection })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper height={350}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={seasonComparisonData.slice(0, 4)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="metric" type="category" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="SS25" fill="#3b82f6" name={primarySelection} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="FW24" fill="#94a3b8" name={secondarySelection} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </CardContent>
        </Card>

        {/* Radar Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>{t('performanceRadar')}</CardTitle>
            <CardDescription>
              {t('multiDimensionalComparison')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={radarData}
              series={[
                { dataKey: 'current', name: primarySelection, color: '#3b82f6' },
                { dataKey: 'previous', name: secondarySelection, color: '#94a3b8' },
                { dataKey: 'benchmark', name: t('industryBenchmark'), color: '#f59e0b', fillOpacity: 0.1 },
              ]}
              maxValue={100}
            />
          </CardContent>
        </Card>
      </div>

      {/* Brand Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t('brandPerformanceMatrix')}</CardTitle>
          <CardDescription>
            {t('compareBrandsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">{t('brand')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('metrics.revenue')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('metrics.marginPercent')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('metrics.sellThroughPercent')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('tableHeaders.inventory')}</th>
                  <th className="text-center py-3 px-4 font-medium">{t('tableHeaders.performance')}</th>
                </tr>
              </thead>
              <tbody>
                {brandComparisonData.map((brand, index) => (
                  <tr key={brand.brand} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="font-medium">{brand.brand}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">
                      ${(brand.revenue / 1000).toFixed(0)}K
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={brand.margin >= 52 ? 'text-green-600' : brand.margin >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {brand.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={brand.sellThrough >= 70 ? 'text-green-600' : brand.sellThrough >= 65 ? 'text-yellow-600' : 'text-red-600'}>
                        {brand.sellThrough.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      ${(brand.inventory / 1000).toFixed(0)}K
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex justify-center">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (brand.margin + brand.sellThrough) / 2 >= 60 ? 'bg-green-500' :
                              (brand.margin + brand.sellThrough) / 2 >= 55 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${((brand.margin + brand.sellThrough) / 2)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Category Growth Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('categoryGrowth')}</CardTitle>
            <CardDescription>
              {t('yoyPerformance')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryComparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip
                    formatter={(value) => [`$${(Number(value || 0) / 1000).toFixed(0)}K`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="SS25" fill="#3b82f6" name="SS25" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="FW24" fill="#94a3b8" name="FW24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('growthRateByCategory')}</CardTitle>
            <CardDescription>
              {t('percentageChange')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryComparisonData.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className={`text-sm font-medium ${cat.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cat.growth > 0 ? '+' : ''}{cat.growth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.growth > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{
                        width: `${Math.min(Math.abs(cat.growth) * 2, 100)}%`,
                        marginLeft: cat.growth < 0 ? 'auto' : '0',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>{t('performanceHeatmap')}</CardTitle>
          <CardDescription>
            {t('heatmapDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap
            data={heatmapData}
            xLabels={heatmapXLabels}
            yLabels={heatmapYLabels}
            colorScale="gradient"
          />
        </CardContent>
      </Card>

      {/* Location Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t('regionalPerformance')}</CardTitle>
          <CardDescription>
            {t('regionalDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {locationComparisonData.map((loc) => (
              <div key={loc.location} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{loc.location}</span>
                  {loc.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {loc.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {loc.trend === 'neutral' && <span className="h-4 w-4 text-muted-foreground">—</span>}
                </div>
                <p className="text-xl font-bold">${(loc.revenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">
                  {t('metrics.margin')}: <span className={loc.margin >= 52 ? 'text-green-600' : 'text-muted-foreground'}>{loc.margin.toFixed(1)}%</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
