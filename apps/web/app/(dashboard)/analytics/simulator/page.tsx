'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadarChart } from '@/components/charts/radar-chart';
import { WaterfallChart } from '@/components/charts/waterfall-chart';
import {
  Calculator,
  Save,
  RotateCcw,
  Download,
  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react';

interface Parameter {
  code: string;
  labelKey: string;
  value: number;
  baseValue: number;
  min: number;
  max: number;
  step: number;
  unit: 'percent' | 'currency' | 'number' | 'weeks';
  descriptionKey: string;
  icon: React.ReactNode;
}

interface SimulationResult {
  revenue: { base: number; projected: number; change: number };
  grossMargin: { base: number; projected: number; change: number };
  sellThrough: { base: number; projected: number; change: number };
  inventoryTurn: { base: number; projected: number; change: number };
  weeksOfSupply: { base: number; projected: number; change: number };
  stockOutRate: { base: number; projected: number; change: number };
  score: number;
  confidence: number;
}

const defaultParameters: Parameter[] = [
  {
    code: 'priceAdjustment',
    labelKey: 'priceAdjustment',
    value: 0,
    baseValue: 0,
    min: -20,
    max: 20,
    step: 1,
    unit: 'percent',
    descriptionKey: 'priceAdjustmentDesc',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    code: 'buyQuantity',
    labelKey: 'buyQuantity',
    value: 0,
    baseValue: 0,
    min: -30,
    max: 50,
    step: 5,
    unit: 'percent',
    descriptionKey: 'buyQuantityDesc',
    icon: <Package className="h-4 w-4" />,
  },
  {
    code: 'markdownTiming',
    labelKey: 'markdownTiming',
    value: 0,
    baseValue: 0,
    min: -4,
    max: 4,
    step: 1,
    unit: 'weeks',
    descriptionKey: 'markdownTimingDesc',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    code: 'inventoryLevel',
    labelKey: 'targetInventory',
    value: 0,
    baseValue: 0,
    min: -30,
    max: 30,
    step: 5,
    unit: 'percent',
    descriptionKey: 'targetInventoryDesc',
    icon: <Package className="h-4 w-4" />,
  },
];

// Baseline metrics
const baseline = {
  revenue: 1500000,
  grossMargin: 52.3,
  sellThrough: 68.5,
  inventoryTurn: 4.2,
  weeksOfSupply: 8.5,
  stockOutRate: 3.2,
};

function simulateChanges(parameters: Parameter[]): SimulationResult {
  const priceAdj = parameters.find(p => p.code === 'priceAdjustment')?.value || 0;
  const buyAdj = parameters.find(p => p.code === 'buyQuantity')?.value || 0;
  const mdTiming = parameters.find(p => p.code === 'markdownTiming')?.value || 0;
  const invAdj = parameters.find(p => p.code === 'inventoryLevel')?.value || 0;

  // Revenue impact
  const revenueFromPrice = priceAdj * 0.8; // Price elasticity
  const revenueFromBuy = buyAdj * 0.6; // More inventory = more sales
  const projectedRevenue = baseline.revenue * (1 + (revenueFromPrice + revenueFromBuy) / 100);

  // Margin impact
  const marginFromPrice = priceAdj * 0.9;
  const marginFromMd = mdTiming * -2; // Earlier markdown = lower margin
  const projectedMargin = baseline.grossMargin + marginFromPrice + marginFromMd;

  // Sell-through impact
  const stFromPrice = priceAdj * -0.15;
  const stFromMd = mdTiming * -3;
  const projectedST = Math.min(100, Math.max(0, baseline.sellThrough + stFromPrice + stFromMd));

  // Inventory turn impact
  const turnFromBuy = buyAdj * -0.03;
  const turnFromMd = mdTiming * -0.15;
  const projectedTurn = Math.max(1, baseline.inventoryTurn + turnFromBuy + turnFromMd);

  // Weeks of supply impact
  const wosFromInv = invAdj * 0.08;
  const wosFromBuy = buyAdj * 0.05;
  const projectedWOS = Math.max(2, baseline.weeksOfSupply + wosFromInv + wosFromBuy);

  // Stock-out rate impact
  const sorFromInv = invAdj * -0.05;
  const sorFromBuy = buyAdj * -0.04;
  const projectedSOR = Math.max(0, Math.min(20, baseline.stockOutRate + sorFromInv + sorFromBuy));

  // Calculate score
  const revenueScore = ((projectedRevenue - baseline.revenue) / baseline.revenue) * 30;
  const marginScore = (projectedMargin - baseline.grossMargin) * 2;
  const stScore = (projectedST - baseline.sellThrough) * 0.5;
  const sorScore = (baseline.stockOutRate - projectedSOR) * 3;
  const score = Math.max(0, Math.min(100, 50 + revenueScore + marginScore + stScore + sorScore));

  // Calculate confidence
  const totalChange = Math.abs(priceAdj) + Math.abs(buyAdj) + Math.abs(mdTiming * 5) + Math.abs(invAdj);
  const confidence = Math.max(60, 95 - totalChange * 0.5);

  return {
    revenue: {
      base: baseline.revenue,
      projected: projectedRevenue,
      change: ((projectedRevenue - baseline.revenue) / baseline.revenue) * 100,
    },
    grossMargin: {
      base: baseline.grossMargin,
      projected: projectedMargin,
      change: projectedMargin - baseline.grossMargin,
    },
    sellThrough: {
      base: baseline.sellThrough,
      projected: projectedST,
      change: projectedST - baseline.sellThrough,
    },
    inventoryTurn: {
      base: baseline.inventoryTurn,
      projected: projectedTurn,
      change: projectedTurn - baseline.inventoryTurn,
    },
    weeksOfSupply: {
      base: baseline.weeksOfSupply,
      projected: projectedWOS,
      change: projectedWOS - baseline.weeksOfSupply,
    },
    stockOutRate: {
      base: baseline.stockOutRate,
      projected: projectedSOR,
      change: projectedSOR - baseline.stockOutRate,
    },
    score,
    confidence,
  };
}

export default function SimulatorPage() {
  const t = useTranslations('pages.analyticsSimulator');
  const tCommon = useTranslations('common');

  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [parameters, setParameters] = useState<Parameter[]>(defaultParameters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [_scenarioName, _setScenarioName] = useState('');

  const result = useMemo(() => simulateChanges(parameters), [parameters]);

  const updateParameter = useCallback((code: string, value: number) => {
    setParameters(prev =>
      prev.map(p => p.code === code ? { ...p, value } : p)
    );
  }, []);

  const resetParameters = useCallback(() => {
    setParameters(defaultParameters);
  }, []);

  const hasChanges = parameters.some(p => p.value !== p.baseValue);

  // Radar chart data
  const radarData = [
    { axis: t('revenue'), baseline: 70, projected: 70 + result.revenue.change * 0.5 },
    { axis: t('grossMargin'), baseline: 70, projected: 70 + result.grossMargin.change },
    { axis: t('sellThrough'), baseline: 70, projected: 70 + result.sellThrough.change },
    { axis: t('inventoryTurn'), baseline: 70, projected: 70 + result.inventoryTurn.change * 10 },
    { axis: 'Service Level', baseline: 70, projected: 70 - result.stockOutRate.change * 5 },
  ];

  // Waterfall data
  const waterfallData = [
    { name: t('baseline'), value: baseline.revenue, isTotal: true },
    { name: t('priceEffect'), value: baseline.revenue * (result.revenue.change * 0.6 / 100) },
    { name: t('volumeEffect'), value: baseline.revenue * (result.revenue.change * 0.4 / 100) },
    { name: t('projected'), value: 0, isTotal: true },
  ];

  const getScoreColor = () => {
    if (result.score >= 70) return 'text-green-600';
    if (result.score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const _getChangeColor = (change: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    if (Math.abs(change) < 0.5) return 'text-muted-foreground';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8" />
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
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetParameters} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('reset')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {t('saveScenario')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Parameters Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('scenarioParameters')}
            </CardTitle>
            <CardDescription>
              {t('adjustVariables')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {parameters.map((param) => (
              <div key={param.code} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    {param.icon}
                    {t(param.labelKey)}
                  </Label>
                  <span className={`text-sm font-medium ${
                    param.value !== param.baseValue
                      ? param.value > param.baseValue ? 'text-green-600' : 'text-red-600'
                      : 'text-muted-foreground'
                  }`}>
                    {param.value > 0 ? '+' : ''}{param.value}
                    {param.unit === 'percent' && '%'}
                    {param.unit === 'weeks' && ' wks'}
                  </span>
                </div>
                <Slider
                  value={[param.value]}
                  onValueChange={([v]) => updateParameter(param.code, v)}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                />
                <p className="text-xs text-muted-foreground">{t(param.descriptionKey)}</p>
              </div>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <Label>{t('showAdvanced')}</Label>
              <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>{t('categoryMixShift')}</Label>
                  <Slider defaultValue={[0]} min={-20} max={20} step={5} />
                </div>
                <div className="space-y-2">
                  <Label>{t('promotionalIntensity')}</Label>
                  <Slider defaultValue={[0]} min={-30} max={30} step={5} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('simulationResults')}</CardTitle>
                <CardDescription>
                  {t('projectedOutcomes')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{t('scenarioScore')}</p>
                  <p className={`text-3xl font-bold ${getScoreColor()}`}>
                    {result.score.toFixed(0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{tCommon('confidence')}</p>
                  <p className="text-xl font-semibold">{result.confidence.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="metrics" className="space-y-4">
              <TabsList>
                <TabsTrigger value="metrics">{t('keyMetrics')}</TabsTrigger>
                <TabsTrigger value="comparison">{t('visualComparison')}</TabsTrigger>
                <TabsTrigger value="waterfall">{t('impactAnalysis')}</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Revenue */}
                  <Card className="relative overflow-hidden">
                    <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('revenue')}</span>
                        <Badge variant={result.revenue.change > 0 ? 'default' : 'secondary'}>
                          {result.revenue.change > 0 ? '+' : ''}{result.revenue.change.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-green-600">
                        ${(result.revenue.projected / 1000000).toFixed(2)}M
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} ${(result.revenue.base / 1000000).toFixed(2)}M
                      </p>
                    </CardContent>
                  </Card>

                  {/* Gross Margin */}
                  <Card className="relative overflow-hidden">
                    <TrendingDown className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('grossMargin')}</span>
                        <Badge variant={result.grossMargin.change > 0 ? 'default' : 'secondary'}>
                          {result.grossMargin.change > 0 ? '+' : ''}{result.grossMargin.change.toFixed(1)}pp
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-blue-600">
                        {result.grossMargin.projected.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} {result.grossMargin.base.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  {/* Sell-Through */}
                  <Card className="relative overflow-hidden">
                    <Zap className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('sellThrough')}</span>
                        <Badge variant={result.sellThrough.change > 0 ? 'default' : 'secondary'}>
                          {result.sellThrough.change > 0 ? '+' : ''}{result.sellThrough.change.toFixed(1)}pp
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-purple-600">
                        {result.sellThrough.projected.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} {result.sellThrough.base.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  {/* Inventory Turn */}
                  <Card className="relative overflow-hidden">
                    <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('inventoryTurn')}</span>
                        <Badge variant={result.inventoryTurn.change > 0 ? 'default' : 'secondary'}>
                          {result.inventoryTurn.change > 0 ? '+' : ''}{result.inventoryTurn.change.toFixed(2)}x
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-orange-600">
                        {result.inventoryTurn.projected.toFixed(1)}x
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} {result.inventoryTurn.base.toFixed(1)}x
                      </p>
                    </CardContent>
                  </Card>

                  {/* Weeks of Supply */}
                  <Card className="relative overflow-hidden">
                    <Clock className="absolute -bottom-4 -right-4 h-32 w-32 text-cyan-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('weeksOfSupply')}</span>
                        <Badge variant={result.weeksOfSupply.change < 0 ? 'default' : 'secondary'}>
                          {result.weeksOfSupply.change > 0 ? '+' : ''}{result.weeksOfSupply.change.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-cyan-600">
                        {result.weeksOfSupply.projected.toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} {result.weeksOfSupply.base.toFixed(1)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Stock-Out Rate */}
                  <Card className="relative overflow-hidden">
                    <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-red-500/10" />
                    <CardContent className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">{t('stockOutRate')}</span>
                        <Badge variant={result.stockOutRate.change < 0 ? 'default' : 'secondary'}>
                          {result.stockOutRate.change > 0 ? '+' : ''}{result.stockOutRate.change.toFixed(1)}pp
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-red-600">
                        {result.stockOutRate.projected.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('from')} {result.stockOutRate.base.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="comparison">
                <RadarChart
                  data={radarData}
                  series={[
                    { dataKey: 'baseline', name: t('baseline'), color: '#94a3b8' },
                    { dataKey: 'projected', name: t('projected'), color: '#3b82f6' },
                  ]}
                  maxValue={100}
                />
              </TabsContent>

              <TabsContent value="waterfall">
                <WaterfallChart
                  data={waterfallData}
                  formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {t('recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasChanges ? (
              <>
                {result.revenue.change > 5 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {t('strongRevenueGrowth')}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {t('parameterChangesDrive', { percent: result.revenue.change.toFixed(1) })}
                      </p>
                    </div>
                  </div>
                )}
                {result.grossMargin.change < -2 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {t('marginCompressionRisk')}
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        {t('considerAdjusting')}
                      </p>
                    </div>
                  </div>
                )}
                {result.stockOutRate.change < -1 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        {t('improvedServiceLevels')}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {t('stockOutWillDecrease', { percent: Math.abs(result.stockOutRate.change).toFixed(1) })}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('adjustParametersForRecommendations')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('riskAssessment')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasChanges ? (
              <>
                {(parameters.find(p => p.code === 'priceAdjustment')?.value ?? 0) > 10 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-200">
                        {t('demandElasticityRisk')}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        {t('priceIncreaseAbove')}
                      </p>
                    </div>
                  </div>
                )}
                {(parameters.find(p => p.code === 'buyQuantity')?.value ?? 0) > 20 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <Package className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">
                        {t('excessInventoryRisk')}
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        {t('largeBuyIncreases')}
                      </p>
                    </div>
                  </div>
                )}
                {result.weeksOfSupply.projected > 12 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">
                        {t('highWeeksOfSupply')}
                      </p>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        {t('considerReducingInventory')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t('adjustParametersForRisk')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
