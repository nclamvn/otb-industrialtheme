'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, DollarSign, Package, Target, Loader2 } from 'lucide-react';
import type { MarkdownSKUPlan, SimulationResult } from '@/types/clearance';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
}

// Demo simulation generator
function generateDemoSimulation(markdownPct: number, skuCount: number): SimulationResult {
  const baseRevenue = 500000000;
  const revenueMultiplier = 1 + (markdownPct / 100) * 0.8; // Higher discount = more revenue from sell-through
  const baseUnits = 1500;
  const unitsMultiplier = 1 + (markdownPct / 100) * 1.2;
  const baseSellThrough = 45;
  const sellThroughBoost = markdownPct * 0.6;

  return {
    scenario: {
      markdownPct,
      skuIds: Array.from({ length: skuCount }, (_, i) => `sku-${i + 1}`),
    },
    results: {
      totalRevenue: Math.round(baseRevenue * revenueMultiplier),
      totalUnits: Math.round(baseUnits * unitsMultiplier),
      avgSellThrough: Math.min(95, Math.round(baseSellThrough + sellThroughBoost)),
      skuCount,
    },
  };
}

interface Props {
  planId: string;
  skus: MarkdownSKUPlan[];
}

export function SimulationTool({ planId, skus }: Props) {
  const t = useTranslations('clearance.simulation');
  const [markdownPct, setMarkdownPct] = useState(20);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const skuIds = skus.filter(s => s.recommendedAction !== 'NO_ACTION').map(s => s.skuId);

  const handleRunSimulation = async () => {
    setIsRunning(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const simulationResult = generateDemoSimulation(markdownPct, skuIds.length);
    setResult(simulationResult);
    setIsRunning(false);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">{t('discountLevel')}</label>
              <Badge variant="outline" className="text-lg font-bold">{markdownPct}%</Badge>
            </div>
            <Slider value={[markdownPct]} onValueChange={([v]) => setMarkdownPct(v)} min={0} max={70} step={5} />
          </div>
          <div className="text-sm text-muted-foreground">{t('testingSKUs', { count: skuIds.length })}</div>
          <Button className="w-full" onClick={handleRunSimulation} disabled={isRunning}>
            {isRunning ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('running')}</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />{t('runSimulation')}</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('results')}</CardTitle>
          <CardDescription>{t('predictedOutcome')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="text-center py-12 text-muted-foreground">{t('runToSee')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <DollarSign className="h-5 w-5" />{t('revenue')}
                </div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(result.results.totalRevenue)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Package className="h-5 w-5" />{t('quantity')}
                </div>
                <div className="text-2xl font-bold text-blue-700">{result.results.totalUnits.toLocaleString()}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 col-span-2">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Target className="h-5 w-5" />{t('avgSellThru')}
                </div>
                <div className="text-2xl font-bold text-purple-700">{result.results.avgSellThrough}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
