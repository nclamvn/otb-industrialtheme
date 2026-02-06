'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Trophy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lightbulb,
  BarChart3,
  DollarSign,
  Package,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { skuAnalysisApi } from '@/lib/api-client';
import { SKUPerformanceTable, SKUPerformance } from './sku-performance-table';
import { SKURecommendations, SKURecommendation } from './sku-recommendations';

interface SKUSummary {
  totalSKUs: number;
  totalRevenue: number;
  totalUnitsSold: number;
  avgSellThrough: number;
  avgGrossMargin: number;
  top10RevenueContribution: number;
  bottom10RevenueContribution: number;
  bestPerformersSKUCount: number;
  worstPerformersSKUCount: number;
}

interface SKUAnalysisDashboardProps {
  brands?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  seasons?: { id: string; name: string }[];
}

export function SKUAnalysisDashboard({
  brands = [],
  categories = [],
  seasons = [],
}: SKUAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [bestPerformers, setBestPerformers] = useState<SKUPerformance[]>([]);
  const [worstPerformers, setWorstPerformers] = useState<SKUPerformance[]>([]);
  const [risingStars, setRisingStars] = useState<SKUPerformance[]>([]);
  const [declining, setDeclining] = useState<SKUPerformance[]>([]);
  const [summary, setSummary] = useState<SKUSummary | null>(null);
  const [recommendations, setRecommendations] = useState<SKURecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [periodDays, setPeriodDays] = useState<string>('30');
  const [metric, setMetric] = useState<string>('REVENUE');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        brandId: brandFilter !== 'all' ? brandFilter : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        seasonId: seasonFilter !== 'all' ? seasonFilter : undefined,
        periodDays: parseInt(periodDays),
        metric,
        limit: 10,
      };

      const [bestRes, worstRes, risingRes, decliningRes, summaryRes, recsRes] = await Promise.all([
        skuAnalysisApi.getBestPerformers(params),
        skuAnalysisApi.getWorstPerformers(params),
        skuAnalysisApi.getRisingStars(params),
        skuAnalysisApi.getDeclining(params),
        skuAnalysisApi.getSummary(params),
        skuAnalysisApi.getRecommendations(params),
      ]);

      if (bestRes.data) setBestPerformers(bestRes.data as SKUPerformance[]);
      if (worstRes.data) setWorstPerformers(worstRes.data as SKUPerformance[]);
      if (risingRes.data) setRisingStars(risingRes.data as SKUPerformance[]);
      if (decliningRes.data) setDeclining(decliningRes.data as SKUPerformance[]);
      if (summaryRes.data) setSummary(summaryRes.data as SKUSummary);
      if (recsRes.data) setRecommendations(recsRes.data as SKURecommendation[]);
    } catch (error) {
      console.error('Failed to fetch SKU analysis data:', error);
      toast.error('Failed to load SKU analysis');
    } finally {
      setIsLoading(false);
    }
  }, [brandFilter, categoryFilter, seasonFilter, periodDays, metric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  if (isLoading && !summary) {
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
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {brands.length > 0 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
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

        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={periodDays} onValueChange={setPeriodDays}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rank by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REVENUE">Revenue</SelectItem>
            <SelectItem value="UNITS_SOLD">Units Sold</SelectItem>
            <SelectItem value="GROSS_MARGIN">Gross Margin</SelectItem>
            <SelectItem value="SELL_THROUGH">Sell-Through</SelectItem>
            <SelectItem value="GMROI">GMROI</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSKUs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{summary.bestPerformersSKUCount}</span> best,{' '}
                <span className="text-red-600">{summary.worstPerformersSKUCount}</span> worst
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Top 10% = {summary.top10RevenueContribution.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Sell-Through</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgSellThrough.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalUnitsSold.toLocaleString()} units sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgGrossMargin.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Gross margin percentage</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="best" className="gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Best Performers
          </TabsTrigger>
          <TabsTrigger value="worst" className="gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Worst Performers
          </TabsTrigger>
          <TabsTrigger value="rising" className="gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Rising Stars
          </TabsTrigger>
          <TabsTrigger value="declining" className="gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            Declining
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4 text-purple-500" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top 5 Best Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SKUPerformanceTable data={bestPerformers.slice(0, 5)} variant="best" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Top 5 Worst Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SKUPerformanceTable data={worstPerformers.slice(0, 5)} variant="worst" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-500" />
                Top Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SKURecommendations recommendations={recommendations.slice(0, 5)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Best Performing SKUs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SKUPerformanceTable data={bestPerformers} variant="best" isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worst">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Worst Performing SKUs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SKUPerformanceTable data={worstPerformers} variant="worst" isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rising">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Rising Stars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SKUPerformanceTable data={risingStars} variant="rising" isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="declining">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Declining Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SKUPerformanceTable data={declining} variant="declining" isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <SKURecommendations recommendations={recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
