'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { kpiApi } from '@/lib/api-client';
import { KPIBenchmarkCard } from './kpi-benchmark-card';

interface FashionKPIs {
  gmroi: { value: number; status: string };
  sellThroughRate: { value: number; status: string };
  weeksOfCover: { value: number; status: string };
  grossMarginPct: { value: number; status: string };
  markdownPct: { value: number; status: string };
  planAccuracy: { value: number; status: string };
  stockTurnover: { value: number; status: string };
  inventoryToSalesRatio: { value: number; status: string };
}

interface KPIBenchmarks {
  GMROI: { excellent: number; good: number; acceptable: number; poor: number };
  SELL_THROUGH: { excellent: number; good: number; acceptable: number; poor: number };
  WEEKS_OF_COVER: { min: number; target: number; max: number; critical_low: number; critical_high: number };
  GROSS_MARGIN: { excellent: number; good: number; acceptable: number; poor: number };
  MARKDOWN: { excellent: number; good: number; acceptable: number; poor: number };
  PLAN_ACCURACY: { excellent: number; good: number; acceptable: number; poor: number };
}

interface FashionKPIDashboardProps {
  brands?: { id: string; name: string }[];
  seasons?: { id: string; name: string }[];
  divisions?: { id: string; name: string }[];
}

export function FashionKPIDashboard({
  brands = [],
  seasons = [],
  divisions = [],
}: FashionKPIDashboardProps) {
  const [kpis, setKpis] = useState<FashionKPIs | null>(null);
  const [benchmarks, setBenchmarks] = useState<KPIBenchmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [trendData, setTrendData] = useState<{ week: string; gmroi: number; sellThrough: number; woc: number }[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, benchmarksRes] = await Promise.all([
        kpiApi.getDashboard({
          divisionId: selectedDivision !== 'all' ? selectedDivision : undefined,
          seasonId: selectedSeason !== 'all' ? selectedSeason : undefined,
        }),
        kpiApi.getBenchmarks(),
      ]);

      if (dashboardRes.data) {
        setKpis(dashboardRes.data as FashionKPIs);
      }
      if (benchmarksRes.data) {
        setBenchmarks(benchmarksRes.data as KPIBenchmarks);
      }

      // Generate mock trend data for now
      setTrendData([
        { week: 'W1', gmroi: 2.1, sellThrough: 58, woc: 6.2 },
        { week: 'W2', gmroi: 2.3, sellThrough: 62, woc: 5.8 },
        { week: 'W3', gmroi: 2.2, sellThrough: 65, woc: 5.5 },
        { week: 'W4', gmroi: 2.5, sellThrough: 68, woc: 5.2 },
        { week: 'W5', gmroi: 2.4, sellThrough: 70, woc: 5.0 },
        { week: 'W6', gmroi: 2.6, sellThrough: 72, woc: 4.8 },
        { week: 'W7', gmroi: 2.7, sellThrough: 74, woc: 4.6 },
        { week: 'W8', gmroi: 2.8, sellThrough: 76, woc: 4.5 },
      ]);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
      toast.error('Failed to load KPI data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrand, selectedSeason, selectedDivision]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusFromValue = (
    value: number,
    benchmark: { excellent: number; good: number; acceptable: number; poor: number },
    isLowerBetter = false
  ): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' => {
    if (isLowerBetter) {
      if (value <= benchmark.excellent) return 'excellent';
      if (value <= benchmark.good) return 'good';
      if (value <= benchmark.acceptable) return 'acceptable';
      if (value <= benchmark.poor) return 'poor';
      return 'critical';
    }
    if (value >= benchmark.excellent) return 'excellent';
    if (value >= benchmark.good) return 'good';
    if (value >= benchmark.acceptable) return 'acceptable';
    if (value >= benchmark.poor) return 'poor';
    return 'critical';
  };

  // Summary stats
  const excellentCount = kpis
    ? Object.values(kpis).filter((k) => k.status === 'excellent').length
    : 0;
  const goodCount = kpis
    ? Object.values(kpis).filter((k) => k.status === 'good').length
    : 0;
  const atRiskCount = kpis
    ? Object.values(kpis).filter((k) => k.status === 'acceptable' || k.status === 'poor').length
    : 0;
  const criticalCount = kpis
    ? Object.values(kpis).filter((k) => k.status === 'critical').length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {divisions.length > 0 && (
          <Select value={selectedDivision} onValueChange={setSelectedDivision}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {brands.length > 0 && (
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {seasons.length > 0 && (
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Excellent</p>
                <p className="text-3xl font-bold text-green-600">{excellentCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Good</p>
                <p className="text-3xl font-bold text-blue-600">{goodCount}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">At Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{atRiskCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Critical</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="benchmarks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarks" className="space-y-4">
          {/* KPI Benchmark Cards */}
          {kpis && benchmarks && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KPIBenchmarkCard
                name="GMROI"
                code="GMROI"
                value={kpis.gmroi.value}
                formattedValue={kpis.gmroi.value.toFixed(2)}
                unit="x"
                benchmark={benchmarks.GMROI}
                status={getStatusFromValue(kpis.gmroi.value, benchmarks.GMROI)}
                trend={kpis.gmroi.value > 2 ? 'up' : 'down'}
                description="Gross Margin Return on Investment - measures profitability relative to inventory investment"
              />

              <KPIBenchmarkCard
                name="Sell-Through Rate"
                code="STR"
                value={kpis.sellThroughRate.value}
                formattedValue={`${kpis.sellThroughRate.value.toFixed(1)}%`}
                benchmark={benchmarks.SELL_THROUGH}
                status={getStatusFromValue(kpis.sellThroughRate.value, benchmarks.SELL_THROUGH)}
                trend={kpis.sellThroughRate.value > 70 ? 'up' : 'neutral'}
                description="Percentage of inventory sold vs received in a period"
              />

              <KPIBenchmarkCard
                name="Weeks of Cover"
                code="WOC"
                value={kpis.weeksOfCover.value}
                formattedValue={kpis.weeksOfCover.value.toFixed(1)}
                unit="weeks"
                benchmark={{
                  excellent: benchmarks.WEEKS_OF_COVER.target,
                  good: benchmarks.WEEKS_OF_COVER.max,
                  acceptable: benchmarks.WEEKS_OF_COVER.critical_high - 2,
                  poor: benchmarks.WEEKS_OF_COVER.critical_high,
                }}
                status={
                  kpis.weeksOfCover.value >= benchmarks.WEEKS_OF_COVER.min &&
                  kpis.weeksOfCover.value <= benchmarks.WEEKS_OF_COVER.max
                    ? 'excellent'
                    : kpis.weeksOfCover.value < benchmarks.WEEKS_OF_COVER.critical_low ||
                      kpis.weeksOfCover.value > benchmarks.WEEKS_OF_COVER.critical_high
                    ? 'critical'
                    : 'acceptable'
                }
                description="Number of weeks current stock will last at current sales rate"
              />

              <KPIBenchmarkCard
                name="Gross Margin"
                code="GM%"
                value={kpis.grossMarginPct.value}
                formattedValue={`${kpis.grossMarginPct.value.toFixed(1)}%`}
                benchmark={benchmarks.GROSS_MARGIN}
                status={getStatusFromValue(kpis.grossMarginPct.value, benchmarks.GROSS_MARGIN)}
                trend={kpis.grossMarginPct.value > 50 ? 'up' : 'down'}
                description="Percentage of revenue retained after COGS"
              />

              <KPIBenchmarkCard
                name="Markdown %"
                code="MD%"
                value={kpis.markdownPct.value}
                formattedValue={`${kpis.markdownPct.value.toFixed(1)}%`}
                benchmark={benchmarks.MARKDOWN}
                status={getStatusFromValue(kpis.markdownPct.value, benchmarks.MARKDOWN, true)}
                trend={kpis.markdownPct.value < 15 ? 'up' : 'down'}
                isLowerBetter={true}
                description="Percentage of sales sold at reduced price"
              />

              <KPIBenchmarkCard
                name="Plan Accuracy"
                code="PA%"
                value={kpis.planAccuracy.value}
                formattedValue={`${kpis.planAccuracy.value.toFixed(1)}%`}
                benchmark={benchmarks.PLAN_ACCURACY}
                status={getStatusFromValue(kpis.planAccuracy.value, benchmarks.PLAN_ACCURACY)}
                trend={kpis.planAccuracy.value > 85 ? 'up' : 'neutral'}
                description="Accuracy of sales vs planned figures"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GMROI & Sell-Through Trend</CardTitle>
                <CardDescription>Last 8 weeks performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="gmroi"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="GMROI"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sellThrough"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Sell-Through %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weeks of Cover Trend</CardTitle>
                <CardDescription>Stock health over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="woc"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.3}
                      name="Weeks of Cover"
                    />
                    {/* Target zone indicator */}
                    <Line
                      type="monotone"
                      dataKey={() => 6}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      name="Target Max"
                    />
                    <Line
                      type="monotone"
                      dataKey={() => 4}
                      stroke="#22c55e"
                      strokeDasharray="5 5"
                      name="Target Min"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {kpis && (
            <Card>
              <CardHeader>
                <CardTitle>KPI Details</CardTitle>
                <CardDescription>Detailed breakdown of all fashion KPIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'GMROI', value: kpis.gmroi.value, unit: 'x', status: kpis.gmroi.status },
                    { name: 'Sell-Through Rate', value: kpis.sellThroughRate.value, unit: '%', status: kpis.sellThroughRate.status },
                    { name: 'Weeks of Cover', value: kpis.weeksOfCover.value, unit: 'weeks', status: kpis.weeksOfCover.status },
                    { name: 'Gross Margin', value: kpis.grossMarginPct.value, unit: '%', status: kpis.grossMarginPct.status },
                    { name: 'Markdown %', value: kpis.markdownPct.value, unit: '%', status: kpis.markdownPct.status },
                    { name: 'Plan Accuracy', value: kpis.planAccuracy.value, unit: '%', status: kpis.planAccuracy.status },
                    { name: 'Stock Turnover', value: kpis.stockTurnover.value, unit: 'x', status: kpis.stockTurnover.status },
                    { name: 'Inventory to Sales', value: kpis.inventoryToSalesRatio.value, unit: 'x', status: kpis.inventoryToSalesRatio.status },
                  ].map((kpi) => (
                    <div
                      key={kpi.name}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            kpi.status === 'excellent'
                              ? 'bg-green-500'
                              : kpi.status === 'good'
                              ? 'bg-blue-500'
                              : kpi.status === 'acceptable'
                              ? 'bg-yellow-500'
                              : kpi.status === 'poor'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className="font-medium">{kpi.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold">
                          {kpi.value.toFixed(kpi.unit === 'x' ? 2 : 1)}
                          {kpi.unit !== 'x' && kpi.unit !== 'weeks' ? kpi.unit : ''} {kpi.unit === 'x' && 'x'} {kpi.unit === 'weeks' && 'weeks'}
                        </span>
                        <Badge
                          variant={
                            kpi.status === 'excellent' || kpi.status === 'good'
                              ? 'default'
                              : kpi.status === 'acceptable'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {kpi.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
