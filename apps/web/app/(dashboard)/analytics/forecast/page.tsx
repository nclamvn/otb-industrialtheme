'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Slider } from '@/components/ui/slider';
import { ForecastChart } from '@/components/charts/forecast-chart';
import { WaterfallChart } from '@/components/charts/waterfall-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import {
  TrendingUp,
  Brain,
  Target,
  AlertTriangle,
  Lightbulb,
  Download,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

// Generate demo data
interface HistoricalDataPoint {
  date: string;
  actual: number;
}

function generateHistoricalData(months: number = 12) {
  const data: HistoricalDataPoint[] = [];
  let baseValue = 85000;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i));
    const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    // Add trend and seasonality
    const trend = 1 + (i * 0.02);
    const seasonality = 1 + 0.12 * Math.sin((i * Math.PI) / 6);
    const noise = 1 + (Math.random() - 0.5) * 0.08;

    baseValue = 85000 * trend * seasonality * noise;
    data.push({
      date: month,
      actual: Math.round(baseValue),
    });
  }

  return data;
}

interface ForecastDataPoint {
  date: string;
  forecast: number;
  lowerBound: number;
  upperBound: number;
}

function generateForecastData(historical: { date: string; actual: number }[], periods: number = 6) {
  const lastActual = historical[historical.length - 1].actual;
  const avgGrowth = 0.025; // 2.5% growth
  const forecast: ForecastDataPoint[] = [];

  for (let i = 0; i < periods; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i + 1);
    const month = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    const trend = 1 + avgGrowth * (i + 1);
    const seasonality = 1 + 0.1 * Math.sin(((historical.length + i) * Math.PI) / 6);
    const baseValue = lastActual * trend * seasonality;

    // Confidence interval widens with horizon
    const uncertainty = 0.05 + (i * 0.02);

    forecast.push({
      date: month,
      forecast: Math.round(baseValue),
      lowerBound: Math.round(baseValue * (1 - uncertainty)),
      upperBound: Math.round(baseValue * (1 + uncertainty)),
    });
  }

  return forecast;
}

export default function ForecastPage() {
  const t = useTranslations('pages.analyticsForecast');
  const tCommon = useTranslations('common');

  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [forecastType, setForecastType] = useState('demand');
  const [forecastHorizon, setForecastHorizon] = useState(6);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate data
  const historical = useMemo(() => generateHistoricalData(12), []);
  const forecast = useMemo(() => generateForecastData(historical, forecastHorizon), [historical, forecastHorizon]);

  // Combine data for chart
  const chartData = useMemo(() => [
    ...historical,
    ...forecast,
  ], [historical, forecast]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const lastActual = historical[historical.length - 1].actual;
    const lastForecast = forecast[forecast.length - 1].forecast;
    const totalGrowth = ((lastForecast - lastActual) / lastActual) * 100;
    const monthlyGrowth = totalGrowth / forecastHorizon;

    return {
      currentValue: lastActual,
      forecastEnd: lastForecast,
      totalGrowth,
      monthlyGrowth,
      confidence: confidenceLevel,
      mape: 4.2,
      rmse: 3850,
    };
  }, [historical, forecast, forecastHorizon, confidenceLevel]);

  // Waterfall data showing forecast changes
  const waterfallData = [
    { name: t('currentValue'), value: metrics.currentValue, isTotal: true },
    { name: t('historicalTrend'), value: metrics.currentValue * 0.08 },
    { name: t('seasonality'), value: metrics.currentValue * 0.05 },
    { name: t('marketConditions'), value: metrics.currentValue * 0.03 },
    { name: 'Uncertainty', value: -metrics.currentValue * 0.02 },
    { name: t('forecastEnd'), value: 0, isTotal: true },
  ];

  const handleGenerateForecast = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SS25">SS25</SelectItem>
              <SelectItem value="FW24">FW24</SelectItem>
              <SelectItem value="SS24">SS24</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCategories')}</SelectItem>
              <SelectItem value="apparel">{t('apparel')}</SelectItem>
              <SelectItem value="footwear">{t('footwear')}</SelectItem>
              <SelectItem value="accessories">{t('accessories')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button onClick={handleGenerateForecast} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {t('generateForecast')}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title={t('currentValue')}
          value={`$${(metrics.currentValue / 1000).toFixed(0)}K`}
          description={t('lastMonthActual')}
          icon="Target"
        />
        <StatsCard
          title={t('forecastEnd')}
          value={`$${(metrics.forecastEnd / 1000).toFixed(0)}K`}
          description={t('inMonths', { count: forecastHorizon })}
          icon="TrendingUp"
          trend={{ value: metrics.totalGrowth, label: metrics.totalGrowth > 0 ? t('growth') : 'decline' }}
        />
        <StatsCard
          title={t('modelAccuracy')}
          value={`${(100 - metrics.mape).toFixed(1)}%`}
          description={`${t('mape')}: ${metrics.mape}%`}
          icon="Activity"
        />
        <StatsCard
          title={t('confidenceLevel')}
          value={`${confidenceLevel}%`}
          description={t('predictionInterval')}
          icon="Percent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('demandForecast')}</CardTitle>
                <CardDescription>
                  {t('historicalAndPrediction', { count: forecastHorizon })}
                </CardDescription>
              </div>
              <Select value={forecastType} onValueChange={setForecastType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demand">{t('demand')}</SelectItem>
                  <SelectItem value="sales">{t('sales')}</SelectItem>
                  <SelectItem value="revenue">{t('revenue')}</SelectItem>
                  <SelectItem value="inventory">{t('inventory')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ForecastChart
              data={chartData}
              confidence={confidenceLevel / 100}
              accuracy={{ mape: metrics.mape, rmse: metrics.rmse }}
            />
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>{t('forecastSettings')}</CardTitle>
            <CardDescription>{t('configureParameters')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{t('forecastHorizon')}</label>
                <span className="text-sm text-muted-foreground">{forecastHorizon} {t('months')}</span>
              </div>
              <Slider
                value={[forecastHorizon]}
                onValueChange={([v]) => setForecastHorizon(v)}
                min={3}
                max={12}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">{t('confidenceLevel')}</label>
                <span className="text-sm text-muted-foreground">{confidenceLevel}%</span>
              </div>
              <Slider
                value={[confidenceLevel]}
                onValueChange={([v]) => setConfidenceLevel(v)}
                min={80}
                max={99}
                step={1}
              />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium text-sm">{t('modelInformation')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('method')}</span>
                  <span>{t('ensembleMethod')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('trainingData')}</span>
                  <span>12 {t('months')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('lastUpdated')}</span>
                  <span>{t('todayAt', { time: '10:30 AM' })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                {t('keyFactors')}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">{t('strongUpwardTrend', { rate: '2.5' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">{t('seasonalPatternDetected')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">{t('lowVolatility', { rate: '8' })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="decomposition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decomposition">{t('forecastDecomposition')}</TabsTrigger>
          <TabsTrigger value="trends">{t('trendAnalysis')}</TabsTrigger>
          <TabsTrigger value="anomalies">{t('anomalyDetection')}</TabsTrigger>
          <TabsTrigger value="scenarios">{t('scenarioComparison')}</TabsTrigger>
        </TabsList>

        <TabsContent value="decomposition" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('forecastComponents')}</CardTitle>
                <CardDescription>
                  {t('factorsContributing')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WaterfallChart
                  data={waterfallData}
                  formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('factorImpactAnalysis')}</CardTitle>
                <CardDescription>
                  {t('howFactorsAffect')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: t('historicalTrend'), impact: 42, direction: 'up' },
                  { name: t('seasonality'), impact: 28, direction: 'up' },
                  { name: t('marketConditions'), impact: 18, direction: 'up' },
                  { name: t('recentMomentum'), impact: 12, direction: 'neutral' },
                ].map((factor) => (
                  <div key={factor.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {factor.direction === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {factor.direction === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                        {factor.direction === 'neutral' && <Minus className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-medium">{factor.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{factor.impact}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          factor.direction === 'up'
                            ? 'bg-green-500'
                            : factor.direction === 'down'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${factor.impact}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('trendAnalysis')}</CardTitle>
              <CardDescription>
                {t('longTermPatterns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="relative overflow-hidden">
                  <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
                  <CardContent className="relative p-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('upwardTrend')}</p>
                    <p className="text-3xl font-bold tracking-tight text-green-600">+2.5%</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('monthlyGrowthRate')}</p>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <Target className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
                  <CardContent className="relative p-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('trendStrength')}</p>
                    <p className="text-3xl font-bold tracking-tight text-blue-600">87%</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('rSquaredCorrelation')}</p>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <RefreshCw className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
                  <CardContent className="relative p-4">
                    <p className="text-sm font-medium text-muted-foreground">{t('seasonality')}</p>
                    <p className="text-3xl font-bold tracking-tight text-purple-600">6 {t('months')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('cyclePeriod')}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('detectedAnomalies')}</CardTitle>
                  <CardDescription>
                    {t('unusualPatterns')}
                  </CardDescription>
                </div>
                <Badge variant="secondary">2 {t('anomaliesFound')}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    period: 'Aug 24',
                    value: 98500,
                    expected: 89000,
                    deviation: '+10.7%',
                    severity: 'medium',
                    type: 'spike',
                    explanation: t('anomalyExplanation1'),
                  },
                  {
                    period: 'Mar 24',
                    value: 72000,
                    expected: 81000,
                    deviation: '-11.1%',
                    severity: 'medium',
                    type: 'dip',
                    explanation: t('anomalyExplanation2'),
                  },
                ].map((anomaly, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className={`p-2 rounded-full ${
                      anomaly.type === 'spike' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        anomaly.type === 'spike' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{anomaly.period}</span>
                        <Badge variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                          {anomaly.severity === 'high' ? t('high') : anomaly.severity === 'medium' ? t('medium') : t('low')}
                        </Badge>
                        <Badge variant="outline">
                          {anomaly.type === 'spike' ? t('spike') : t('dip')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('actual')}: ${(anomaly.value / 1000).toFixed(0)}K | {t('expected')}: ${(anomaly.expected / 1000).toFixed(0)}K | {t('deviation')}: {anomaly.deviation}
                      </p>
                      <p className="text-sm mt-2">{anomaly.explanation}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('scenarioComparison')}</CardTitle>
                  <CardDescription>
                    {t('compareDifferentScenarios')}
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addScenario')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: t('conservative'), growth: '+12%', value: 95000, color: 'blue', Icon: Target },
                  { name: t('baseCase'), growth: '+18%', value: 102000, color: 'green', Icon: TrendingUp },
                  { name: t('optimistic'), growth: '+25%', value: 110000, color: 'purple', Icon: ArrowUpRight },
                ].map((scenario) => (
                  <Card key={scenario.name} className="relative overflow-hidden">
                    <scenario.Icon className={`absolute -bottom-4 -right-4 h-32 w-32 text-${scenario.color}-500/10`} />
                    <CardContent className="relative p-4">
                      <p className="text-sm font-medium text-muted-foreground">{scenario.name}</p>
                      <p className={`text-3xl font-bold tracking-tight text-${scenario.color}-600`}>${(scenario.value / 1000).toFixed(0)}K</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('growth')}: <span className="text-green-600">{scenario.growth}</span>
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Plus icon component (if not exported from lucide-react)
function Plus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
