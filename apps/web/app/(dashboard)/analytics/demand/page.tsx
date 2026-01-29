'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Target,
  ShoppingCart,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data generators
interface DemandTrendData {
  month: string;
  actual: number | null;
  forecast: number;
  lowerBound: number;
  upperBound: number;
}

function generateDemandTrends(months: number = 12) {
  const data: DemandTrendData[] = [];
  const baseValue = 1500;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i));
    const month = date.toLocaleDateString('en-US', { month: 'short' });

    const trend = 1 + (i * 0.015);
    const seasonality = 1 + 0.15 * Math.sin((i * Math.PI) / 6);
    const noise = 1 + (Math.random() - 0.5) * 0.1;

    const actual = Math.round(baseValue * trend * seasonality * noise);
    const forecast = Math.round(actual * (1 + (Math.random() - 0.3) * 0.1));

    data.push({
      month,
      actual,
      forecast,
      lowerBound: Math.round(forecast * 0.9),
      upperBound: Math.round(forecast * 1.1),
    });
  }

  // Add future months
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    const month = date.toLocaleDateString('en-US', { month: 'short' });

    const lastActual = data[data.length - 1].actual || baseValue;
    const forecast = Math.round(lastActual * (1 + 0.03 * (i + 1)));

    data.push({
      month,
      actual: null,
      forecast,
      lowerBound: Math.round(forecast * 0.85),
      upperBound: Math.round(forecast * 1.15),
    });
  }

  return data;
}

function generateCategoryDemand() {
  return [
    { name: 'Footwear', current: 4500, predicted: 5200, growth: 15.5, stockLevel: 78 },
    { name: 'Apparel', current: 3200, predicted: 3400, growth: 6.3, stockLevel: 92 },
    { name: 'Accessories', current: 1800, predicted: 2100, growth: 16.7, stockLevel: 65 },
    { name: 'Bags', current: 1200, predicted: 1150, growth: -4.2, stockLevel: 110 },
    { name: 'Watches', current: 800, predicted: 950, growth: 18.8, stockLevel: 45 },
  ];
}

function generateSeasonalPatterns() {
  return [
    { month: 'Jan', y2023: 1200, y2024: 1350, y2025: 1480 },
    { month: 'Feb', y2023: 1100, y2024: 1280, y2025: 1420 },
    { month: 'Mar', y2023: 1400, y2024: 1520, y2025: 1650 },
    { month: 'Apr', y2023: 1600, y2024: 1750, y2025: 1900 },
    { month: 'May', y2023: 1800, y2024: 1950, y2025: 2100 },
    { month: 'Jun', y2023: 2000, y2024: 2200, y2025: 2400 },
    { month: 'Jul', y2023: 1900, y2024: 2100, y2025: 2300 },
    { month: 'Aug', y2023: 1700, y2024: 1900, y2025: 2050 },
    { month: 'Sep', y2023: 1500, y2024: 1650, y2025: 1800 },
    { month: 'Oct', y2023: 1600, y2024: 1780, y2025: 1950 },
    { month: 'Nov', y2023: 2200, y2024: 2450, y2025: 2700 },
    { month: 'Dec', y2023: 2500, y2024: 2800, y2025: 3100 },
  ];
}

function generateStockRecommendations() {
  return [
    {
      id: '1',
      sku: 'NK-RUN-001',
      name: 'Nike Air Max 90',
      category: 'Footwear',
      currentStock: 45,
      predictedDemand: 120,
      recommendedOrder: 85,
      priority: 'critical',
      reason: 'High demand predicted, stock will deplete in 5 days',
    },
    {
      id: '2',
      sku: 'AD-APP-023',
      name: 'Adidas Track Jacket',
      category: 'Apparel',
      currentStock: 200,
      predictedDemand: 80,
      recommendedOrder: 0,
      priority: 'warning',
      reason: 'Overstock detected, consider markdown or transfer',
    },
    {
      id: '3',
      sku: 'PM-ACC-045',
      name: 'Puma Sports Cap',
      category: 'Accessories',
      currentStock: 30,
      predictedDemand: 65,
      recommendedOrder: 45,
      priority: 'medium',
      reason: 'Moderate demand increase expected',
    },
    {
      id: '4',
      sku: 'NK-FTW-089',
      name: 'Nike React Infinity',
      category: 'Footwear',
      currentStock: 15,
      predictedDemand: 90,
      recommendedOrder: 100,
      priority: 'critical',
      reason: 'Stockout risk in 2 days based on trend',
    },
  ];
}

export default function DemandAnalyticsPage() {
  const _t = useTranslations('common');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [_selectedCategory, _setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const demandTrends = useMemo(() => generateDemandTrends(12), []);
  const categoryDemand = useMemo(() => generateCategoryDemand(), []);
  const seasonalPatterns = useMemo(() => generateSeasonalPatterns(), []);
  const stockRecommendations = useMemo(() => generateStockRecommendations(), []);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalCurrent = categoryDemand.reduce((sum, c) => sum + c.current, 0);
    const totalPredicted = categoryDemand.reduce((sum, c) => sum + c.predicted, 0);
    const avgGrowth = ((totalPredicted - totalCurrent) / totalCurrent) * 100;
    const criticalItems = stockRecommendations.filter(r => r.priority === 'critical').length;

    return {
      totalDemand: totalCurrent,
      predictedDemand: totalPredicted,
      avgGrowth,
      criticalItems,
      accuracy: 94.2,
    };
  }, [categoryDemand, stockRecommendations]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Demand Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered demand forecasting and stock optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="nike">Nike</SelectItem>
              <SelectItem value="adidas">Adidas</SelectItem>
              <SelectItem value="puma">Puma</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Current Demand"
          value={metrics.totalDemand.toLocaleString()}
          description="Units this period"
          icon="Package"
          color="blue"
        />
        <StatsCard
          title="Predicted Demand"
          value={metrics.predictedDemand.toLocaleString()}
          description="Next period forecast"
          icon="TrendingUp"
          color="green"
          trend={{ value: metrics.avgGrowth, label: 'growth' }}
        />
        <StatsCard
          title="Forecast Accuracy"
          value={`${metrics.accuracy}%`}
          description="MAPE: 5.8%"
          icon="Target"
          color="purple"
        />
        <StatsCard
          title="Action Required"
          value={metrics.criticalItems}
          description="Critical stock items"
          icon="AlertTriangle"
          color="orange"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Demand Trends</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Stock Recommendations</TabsTrigger>
        </TabsList>

        {/* Demand Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Demand Forecast with Confidence Interval
              </CardTitle>
              <CardDescription>
                Historical demand and AI-generated forecast with 95% confidence bounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWrapper height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={demandTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      stackId="1"
                      stroke="none"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.1}
                      name="Upper Bound"
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      stackId="2"
                      stroke="none"
                      fill="hsl(var(--background))"
                      name="Lower Bound"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                      name="Forecast"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demand by Category</CardTitle>
                <CardDescription>Current vs Predicted demand comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWrapper height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryDemand} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" />
                      <Bar dataKey="predicted" fill="hsl(var(--chart-2))" name="Predicted" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Growth rate and stock coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryDemand.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={category.growth > 0 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {category.growth > 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(category.growth).toFixed(1)}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Stock: {category.stockLevel}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(category.stockLevel, 100)}
                        className={cn(
                          'h-2',
                          category.stockLevel < 50 && '[&>div]:bg-red-500',
                          category.stockLevel > 100 && '[&>div]:bg-amber-500'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Seasonal Patterns Tab */}
        <TabsContent value="seasonal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Year-over-Year Seasonal Comparison
              </CardTitle>
              <CardDescription>
                Demand patterns across different years to identify seasonality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartWrapper height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seasonalPatterns}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="y2023"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="2023"
                    />
                    <Line
                      type="monotone"
                      dataKey="y2024"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="2024"
                    />
                    <Line
                      type="monotone"
                      dataKey="y2025"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="2025 (Forecast)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>

              {/* Seasonal Insights */}
              <div className="grid gap-4 md:grid-cols-3 mt-6">
                <Card className="relative overflow-hidden">
                  <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Peak Season</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-green-600">Nov - Dec</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      +45% above average demand
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <TrendingDown className="absolute -bottom-4 -right-4 h-32 w-32 text-amber-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low Season</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-amber-600">Jan - Feb</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      -20% below average demand
                    </p>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <Target className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">YoY Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-blue-600">+12.5%</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Consistent growth trend
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Stock Optimization Recommendations
              </CardTitle>
              <CardDescription>
                Automated recommendations based on demand forecasting and current inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockRecommendations.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 rounded-lg border',
                      item.priority === 'critical' && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.sku}
                          </Badge>
                          <Badge className={priorityColors[item.priority as keyof typeof priorityColors]}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.category}
                        </p>
                        <p className="text-sm">
                          <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-500" />
                          {item.reason}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current</p>
                            <p className="font-bold">{item.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Predicted</p>
                            <p className="font-bold text-blue-600">{item.predictedDemand}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Order</p>
                            <p className={cn(
                              'font-bold',
                              item.recommendedOrder > 0 ? 'text-green-600' : 'text-amber-600'
                            )}>
                              {item.recommendedOrder > 0 ? `+${item.recommendedOrder}` : item.recommendedOrder}
                            </p>
                          </div>
                        </div>
                        {item.recommendedOrder > 0 && (
                          <Button size="sm" className="mt-2">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Create Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
