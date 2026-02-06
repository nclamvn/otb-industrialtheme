'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import type { OptimizationResult, MarkdownAction } from '@/types/clearance';

const ACTION_KEYS: Record<MarkdownAction, string> = {
  NO_ACTION: 'noAction',
  INCLUDE_PHASE_1: 'phase1',
  INCLUDE_PHASE_2: 'phase2',
  INCLUDE_PHASE_3: 'phase3',
  IMMEDIATE_CLEAR: 'immediate',
  REMOVE_FROM_FLOOR: 'remove',
};

const ACTION_CONFIG: Record<MarkdownAction, { color: string; icon: typeof CheckCircle }> = {
  NO_ACTION: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  INCLUDE_PHASE_1: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp },
  INCLUDE_PHASE_2: { color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
  INCLUDE_PHASE_3: { color: 'bg-orange-100 text-orange-800', icon: TrendingUp },
  IMMEDIATE_CLEAR: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  REMOVE_FROM_FLOOR: { color: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface Props {
  planId: string;
  result: OptimizationResult;
}

export function OptimizationResults({ planId, result }: Props) {
  const t = useTranslations('clearance.optimization');

  const getActionLabel = (action: MarkdownAction) => t(`actions.${ACTION_KEYS[action]}`);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('skusAnalyzed')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{result.totalSKUs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('expectedRevenue')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(result.summary.totalExpectedRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('avgConfidence')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatPercent(result.summary.avgConfidence * 100)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('immediateAction')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{result.summary.byAction.IMMEDIATE_CLEAR || 0}</div></CardContent>
        </Card>
      </div>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-yellow-500" />{t('distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(result.summary.byAction).map(([action, count]) => {
              const config = ACTION_CONFIG[action as MarkdownAction];
              return (
                <Badge key={action} className={`${config.color} px-3 py-1`}>
                  {getActionLabel(action as MarkdownAction)}: {count}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('skuRecommendations')}</CardTitle>
          <CardDescription>{t('topByRevenue')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.sku')}</TableHead>
                <TableHead className="text-right">{t('table.stock')}</TableHead>
                <TableHead className="text-right">{t('table.woc')}</TableHead>
                <TableHead className="text-right">{t('table.sellThrough')}</TableHead>
                <TableHead>{t('table.action')}</TableHead>
                <TableHead className="text-right">{t('table.markdown')}</TableHead>
                <TableHead className="text-right">{t('table.predRevenue')}</TableHead>
                <TableHead className="text-right">{t('table.confidence')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.recommendations.slice(0, 20).map((sku) => {
                const config = ACTION_CONFIG[sku.recommendedAction];
                const Icon = config.icon;
                return (
                  <TableRow key={sku.skuId}>
                    <TableCell className="font-mono">{sku.skuCode || sku.skuId.slice(0, 8)}</TableCell>
                    <TableCell className="text-right">{sku.currentStock}</TableCell>
                    <TableCell className="text-right">{sku.currentWoC.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{sku.currentSellThrough.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge className={config.color}><Icon className="h-3 w-3 mr-1" />{getActionLabel(sku.recommendedAction)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{sku.recommendedMarkdownPct ? `${sku.recommendedMarkdownPct}%` : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sku.predictedRevenue || 0)}</TableCell>
                    <TableCell className="text-right">{((sku.confidenceScore || 0) * 100).toFixed(0)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
