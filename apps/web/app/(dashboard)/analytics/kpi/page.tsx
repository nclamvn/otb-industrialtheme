'use client';

import { useState } from 'react';
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
import { KPIGrid, KPIAlertConfig, KPITargetForm } from '@/components/kpi';
import { cn } from '@/lib/utils';
import { GaugeChart } from '@/components/charts/gauge-chart';
import {
  Target,
  AlertTriangle,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Download,
  Plus,
} from 'lucide-react';
import type { KPIDisplay } from '@/types/kpi';

// Local type for demo alerts
interface KPIDemoAlert {
  id: string;
  kpiCode: string;
  kpiName: string;
  type: string;
  severity: string;
  message: string;
  value: number;
  threshold?: number;
  triggeredAt: Date;
  isRead: boolean;
  isResolved: boolean;
}

// Use KPIDisplay from types
type KPIDemoDisplay = KPIDisplay;

export default function KPIDashboardPage() {
  const t = useTranslations('pages.analyticsKpi');
  const tCommon = useTranslations('common');

  // Demo KPI data
  const demoKPIs: KPIDemoDisplay[] = [
    {
      code: 'SELL_THROUGH',
      name: t('sellThroughRate'),
      description: t('sellThroughDesc'),
      formula: t('formulaSellThrough'),
      value: 68.5,
      formattedValue: '68.5%',
      unit: '%',
      previousValue: 62.3,
      changePercent: 9.95,
      trend: 'up',
      status: 'on_track',
      target: {
        value: 70,
        formattedValue: '70%',
        type: 'MINIMUM',
      },
      sparklineData: [58, 60, 62, 61, 64, 65, 67, 68, 68.5],
      periodLabel: t('periodLast30Days'),
    },
    {
      code: 'GROSS_MARGIN',
      name: t('grossMargin'),
      description: t('grossMarginDesc'),
      formula: t('formulaGrossMargin'),
      value: 52.3,
      formattedValue: '52.3%',
      unit: '%',
      previousValue: 50.1,
      changePercent: 4.39,
      trend: 'up',
      status: 'on_track',
      target: {
        value: 50,
        formattedValue: '50%',
        type: 'MINIMUM',
      },
      sparklineData: [48, 49, 50, 51, 51, 52, 52, 52.3],
      periodLabel: t('periodLast30Days'),
    },
    {
      code: 'INVENTORY_TURN',
      name: t('inventoryTurn'),
      description: t('inventoryTurnDesc'),
      formula: t('formulaInventoryTurn'),
      value: 4.2,
      formattedValue: '4.2x',
      unit: 'x',
      previousValue: 3.8,
      changePercent: 10.53,
      trend: 'up',
      status: 'on_track',
      target: {
        value: 4.0,
        formattedValue: '4.0x',
        type: 'MINIMUM',
      },
      sparklineData: [3.5, 3.6, 3.7, 3.9, 4.0, 4.1, 4.2],
      periodLabel: t('periodLastQuarter'),
    },
    {
      code: 'WEEKS_OF_SUPPLY',
      name: t('weeksOfSupply'),
      description: t('weeksOfSupplyDesc'),
      formula: t('formulaWeeksOfSupply'),
      value: 8.5,
      formattedValue: `8.5 ${t('weeksUnit')}`,
      unit: t('weeksUnit'),
      previousValue: 10.2,
      changePercent: -16.67,
      trend: 'down',
      status: 'at_risk',
      target: {
        value: 6,
        formattedValue: `6 ${t('weeksUnit')}`,
        type: 'MAXIMUM',
      },
      sparklineData: [12, 11, 10, 10.2, 9.5, 9, 8.5],
      periodLabel: t('periodCurrent'),
    },
    {
      code: 'MARKDOWN_RATE',
      name: t('markdownRate'),
      description: t('markdownRateDesc'),
      formula: t('formulaMarkdownRate'),
      value: 18.5,
      formattedValue: '18.5%',
      unit: '%',
      previousValue: 22.1,
      changePercent: -16.29,
      trend: 'down',
      status: 'on_track',
      target: {
        value: 20,
        formattedValue: '20%',
        type: 'MAXIMUM',
      },
      sparklineData: [25, 24, 23, 22, 21, 20, 19, 18.5],
      periodLabel: t('periodLast30Days'),
    },
    {
      code: 'STOCK_OUT_RATE',
      name: t('stockOutRate'),
      description: t('stockOutRateDesc'),
      formula: t('formulaStockOutRate'),
      value: 3.2,
      formattedValue: '3.2%',
      unit: '%',
      previousValue: 4.5,
      changePercent: -28.89,
      trend: 'down',
      status: 'on_track',
      target: {
        value: 5,
        formattedValue: '5%',
        type: 'MAXIMUM',
      },
      sparklineData: [6, 5.5, 5, 4.5, 4, 3.5, 3.2],
      periodLabel: t('periodCurrent'),
    },
    {
      code: 'RECEIPT_FLOW',
      name: t('receiptFlowRate'),
      description: t('receiptFlowDesc'),
      formula: t('formulaReceiptFlow'),
      value: 87.3,
      formattedValue: '87.3%',
      unit: '%',
      previousValue: 91.2,
      changePercent: -4.28,
      trend: 'down',
      status: 'at_risk',
      target: {
        value: 95,
        formattedValue: '95%',
        type: 'MINIMUM',
      },
      sparklineData: [92, 91, 90, 89, 88, 87.5, 87.3],
      periodLabel: t('periodLast30Days'),
    },
    {
      code: 'OPEN_TO_BUY',
      name: t('otbUtilization'),
      description: t('otbUtilizationDesc'),
      formula: t('formulaOtbUtilization'),
      value: 72.8,
      formattedValue: '72.8%',
      unit: '%',
      previousValue: 65.4,
      changePercent: 11.31,
      trend: 'up',
      status: 'on_track',
      target: {
        value: 85,
        formattedValue: '85%',
        type: 'RANGE',
      },
      sparklineData: [55, 58, 62, 65, 68, 70, 72.8],
      periodLabel: t('periodSeasonToDate'),
    },
  ];

  // Demo alerts
  const demoAlerts: KPIDemoAlert[] = [
    {
      id: '1',
      kpiCode: 'WEEKS_OF_SUPPLY',
      kpiName: t('weeksOfSupply'),
      type: 'THRESHOLD_BREACH',
      severity: 'WARNING',
      message: t('alertWeeksOfSupply', { value: 8.5, threshold: 6 }),
      value: 8.5,
      threshold: 6,
      triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      isResolved: false,
    },
    {
      id: '2',
      kpiCode: 'RECEIPT_FLOW',
      kpiName: t('receiptFlowRate'),
      type: 'TARGET_AT_RISK',
      severity: 'WARNING',
      message: t('alertReceiptFlow', { value: 87.3, threshold: 95 }),
      value: 87.3,
      threshold: 95,
      triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      isResolved: false,
    },
    {
      id: '3',
      kpiCode: 'SELL_THROUGH',
      kpiName: t('sellThroughRate'),
      type: 'TARGET_ACHIEVED',
      severity: 'INFO',
      message: t('alertSellThrough', { percent: 9.95 }),
      value: 68.5,
      triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      isResolved: true,
    },
  ];

  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'gauges' | 'compact'>('cards');
  const [selectedKPI, setSelectedKPI] = useState<KPIDemoDisplay | null>(null);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [showAlertConfig, setShowAlertConfig] = useState(false);

  // Calculate summary stats
  const onTrack = demoKPIs.filter((k) => k.status === 'on_track').length;
  const atRisk = demoKPIs.filter((k) => k.status === 'at_risk').length;
  const offTrack = demoKPIs.filter((k) => k.status === 'off_track').length;
  const activeAlerts = demoAlerts.filter((a) => !a.isResolved).length;

  const handleViewDetails = (_kpi: KPIDemoDisplay) => {
    // TODO: Navigate to KPI details page
  };

  const handleSetTarget = (kpi: KPIDemoDisplay) => {
    setSelectedKPI(kpi);
    setShowTargetForm(true);
  };

  const handleConfigureAlert = (kpi: KPIDemoDisplay) => {
    setSelectedKPI(kpi);
    setShowAlertConfig(true);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
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
              <SelectItem value="all">{tCommon('all')}</SelectItem>
              <SelectItem value="apparel">Apparel</SelectItem>
              <SelectItem value="footwear">Footwear</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            {t('configureKpis')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-green-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <CheckCircle className="w-24 h-24 text-green-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('onTrack')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {onTrack}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('kpisOnTrack', { count: onTrack })}</p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-amber-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-amber-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('atRisk')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {atRisk}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('kpisAtRisk', { count: atRisk })}</p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-red-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <XCircle className="w-24 h-24 text-red-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('offTrack')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {offTrack}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('kpisOffTrack', { count: offTrack })}</p>
          </div>
        </div>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-card',
            'hover:border-border/80 transition-all duration-200',
            'border-l-4 border-l-blue-500 p-4'
          )}
        >
          {/* Watermark Icon */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none">
            <Bell className="w-24 h-24 text-blue-500 opacity-[0.08]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              {t('activeAlerts')}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums pr-14">
              {activeAlerts}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t('alertsActive', { count: activeAlerts })}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="targets">{t('targets')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('alerts')}</TabsTrigger>
            <TabsTrigger value="trends">{t('trends')}</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              {t('cards')}
            </Button>
            <Button
              variant={viewMode === 'gauges' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('gauges')}
            >
              {t('gauges')}
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              {t('compact')}
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <KPIGrid
            kpis={demoKPIs}
            variant={viewMode}
            columns={4}
            onViewDetails={handleViewDetails}
            onSetTarget={handleSetTarget}
            onConfigureAlert={handleConfigureAlert}
          />
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('kpiTargets')}</CardTitle>
                  <CardDescription>
                    {t('viewManageTargets')}
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addTarget')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoKPIs.map((kpi) => (
                  <div
                    key={kpi.code}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          kpi.status === 'on_track'
                            ? 'bg-green-500'
                            : kpi.status === 'at_risk'
                            ? 'bg-yellow-500'
                            : kpi.status === 'off_track'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{kpi.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('current')}: {kpi.formattedValue}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {kpi.target ? (
                        <div className="text-right">
                          <p className="font-medium">
                            {t('target')}: {kpi.target.formattedValue}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {kpi.target.type === 'MINIMUM'
                              ? '>='
                              : kpi.target.type === 'MAXIMUM'
                              ? '<='
                              : '='}{' '}
                            {kpi.target.formattedValue}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">{t('noTargetSet')}</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetTarget(kpi)}
                      >
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('kpiAlerts')}</CardTitle>
                  <CardDescription>
                    {t('recentAlerts')}
                  </CardDescription>
                </div>
                <Button variant="outline">{t('markAllAsRead')}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      !alert.isRead ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-100 dark:bg-red-950'
                          : alert.severity === 'WARNING'
                          ? 'bg-yellow-100 dark:bg-yellow-950'
                          : 'bg-blue-100 dark:bg-blue-950'
                      }`}
                    >
                      {alert.severity === 'CRITICAL' ? (
                        <XCircle
                          className={`h-5 w-5 ${
                            alert.severity === 'CRITICAL'
                              ? 'text-red-600'
                              : ''
                          }`}
                        />
                      ) : alert.severity === 'WARNING' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.kpiName}</span>
                        <Badge
                          variant={
                            alert.severity === 'CRITICAL'
                              ? 'destructive'
                              : alert.severity === 'WARNING'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            alert.severity === 'WARNING'
                              ? 'bg-yellow-500'
                              : ''
                          }
                        >
                          {alert.severity === 'CRITICAL' ? t('critical') :
                           alert.severity === 'WARNING' ? t('warning') : t('info')}
                        </Badge>
                        {alert.isResolved && (
                          <Badge variant="outline" className="text-green-600">
                            {t('resolved')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.triggeredAt.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {tCommon('view')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {demoKPIs.slice(0, 4).map((kpi) => (
              <Card key={kpi.code}>
                <CardHeader>
                  <CardTitle className="text-base">{kpi.name}</CardTitle>
                  <CardDescription>{kpi.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <GaugeChart
                    value={kpi.value}
                    min={0}
                    max={
                      kpi.target
                        ? kpi.target.value * 1.5
                        : kpi.value * 1.5
                    }
                    target={kpi.target?.value}
                    zones={[
                      {
                        from: 0,
                        to: (kpi.target?.value || kpi.value) * 0.6,
                        color: '#ef4444',
                      },
                      {
                        from: (kpi.target?.value || kpi.value) * 0.6,
                        to: (kpi.target?.value || kpi.value) * 0.85,
                        color: '#f59e0b',
                      },
                      {
                        from: (kpi.target?.value || kpi.value) * 0.85,
                        to: (kpi.target?.value || kpi.value) * 1.5,
                        color: '#22c55e',
                      },
                    ]}
                    label={kpi.name}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Target Form Dialog */}
      {selectedKPI && (
        <KPITargetForm
          kpi={selectedKPI}
          open={showTargetForm}
          onOpenChange={setShowTargetForm}
          onSave={(_data) => {
            // TODO: Save target to backend
            setShowTargetForm(false);
          }}
        />
      )}

      {/* Alert Config Dialog */}
      {selectedKPI && (
        <KPIAlertConfig
          kpi={selectedKPI}
          open={showAlertConfig}
          onOpenChange={setShowAlertConfig}
          onSave={(_data) => {
            // TODO: Save alert config to backend
            setShowAlertConfig(false);
          }}
        />
      )}
    </div>
  );
}
