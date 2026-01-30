'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, ShoppingCart, Loader2, Layers } from 'lucide-react';
import { MOCStatusGrid } from './MOCStatusGrid';
import { ReplenishmentAlertList } from './ReplenishmentAlertList';
import type { ReplenishmentDashboardData, MOCData, ReplenishmentAlert } from '@/types/replenishment';

interface Props {
  brandId: string;
}

// Demo data generators
function generateDemoMOCData(): MOCData[] {
  return [
    {
      categoryId: 'cat-1',
      categoryName: 'Giày chạy bộ',
      currentStock: 450,
      monthlyRate: 180,
      currentMOC: 2.5,
      targetMOC: 3.0,
      minMOC: 2.0,
      maxMOC: 4.0,
      status: 'WARNING',
    },
    {
      categoryId: 'cat-2',
      categoryName: 'Giày lifestyle',
      currentStock: 820,
      monthlyRate: 200,
      currentMOC: 4.1,
      targetMOC: 3.5,
      minMOC: 2.5,
      maxMOC: 4.0,
      status: 'OVERSTOCK',
    },
    {
      categoryId: 'cat-3',
      categoryName: 'Áo thun',
      currentStock: 320,
      monthlyRate: 280,
      currentMOC: 1.1,
      targetMOC: 2.5,
      minMOC: 1.5,
      maxMOC: 3.5,
      status: 'CRITICAL',
    },
    {
      categoryId: 'cat-4',
      categoryName: 'Quần thể thao',
      currentStock: 580,
      monthlyRate: 160,
      currentMOC: 3.6,
      targetMOC: 3.0,
      minMOC: 2.0,
      maxMOC: 4.0,
      status: 'HEALTHY',
    },
    {
      categoryId: 'cat-5',
      categoryName: 'Phụ kiện',
      currentStock: 420,
      monthlyRate: 140,
      currentMOC: 3.0,
      targetMOC: 3.0,
      minMOC: 2.0,
      maxMOC: 4.0,
      status: 'HEALTHY',
    },
  ];
}

function generateDemoAlerts(): ReplenishmentAlert[] {
  return [
    {
      id: 'alert-1',
      brandId: 'brand-1',
      categoryId: 'cat-3',
      categoryName: 'Áo thun',
      alertType: 'BELOW_MIN_MOC',
      severity: 'CRITICAL',
      currentMOC: 1.1,
      targetMOC: 2.5,
      currentStock: 320,
      monthlyRate: 280,
      suggestedOrderQty: 392,
      suggestedOrderValue: 156800000,
      isAcknowledged: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      categoryName: 'Giày chạy bộ',
      alertType: 'APPROACHING_MIN',
      severity: 'WARNING',
      currentMOC: 2.5,
      targetMOC: 3.0,
      currentStock: 450,
      monthlyRate: 180,
      suggestedOrderQty: 90,
      suggestedOrderValue: 135000000,
      isAcknowledged: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-3',
      brandId: 'brand-1',
      categoryId: 'cat-2',
      categoryName: 'Giày lifestyle',
      alertType: 'ABOVE_MAX_MOC',
      severity: 'INFO',
      currentMOC: 4.1,
      targetMOC: 3.5,
      currentStock: 820,
      monthlyRate: 200,
      suggestedOrderQty: 0,
      suggestedOrderValue: 0,
      isAcknowledged: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function generateDemoDashboard(): ReplenishmentDashboardData {
  const mocData = generateDemoMOCData();
  const alerts = generateDemoAlerts();

  return {
    summary: {
      totalCategories: mocData.length,
      criticalCount: mocData.filter(m => m.status === 'CRITICAL').length,
      warningCount: mocData.filter(m => m.status === 'WARNING').length,
      healthyCount: mocData.filter(m => m.status === 'HEALTHY').length,
    },
    mocByCategory: mocData,
    alerts,
    pendingOrders: [],
  };
}

export function ReplenishmentDashboard({ brandId }: Props) {
  const t = useTranslations('replenishment');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<ReplenishmentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Load demo data on mount
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setDashboard(generateDemoDashboard());
      setIsLoading(false);
    };
    loadDashboard();
  }, [brandId]);

  const handleCheckNeeds = async () => {
    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Refresh data with potentially new alerts
    setDashboard(generateDemoDashboard());
    setIsChecking(false);
  };

  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Clear selected alerts after creating order
    setSelectedAlerts([]);
    setIsCreatingOrder(false);
  };

  const handleAcknowledge = (alertId: string) => {
    if (dashboard) {
      setDashboard({
        ...dashboard,
        alerts: dashboard.alerts.map(alert =>
          alert.id === alertId ? { ...alert, isAcknowledged: true } : alert
        ),
      });
    }
  };

  const summary = dashboard?.summary || { totalCategories: 0, criticalCount: 0, warningCount: 0, healthyCount: 0 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckNeeds} disabled={isChecking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? t('checking') : t('checkDemand')}
          </Button>
          {selectedAlerts.length > 0 && (
            <Button onClick={handleCreateOrder} disabled={isCreatingOrder}>
              {isCreatingOrder ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('creating')}</>
              ) : (
                <><ShoppingCart className="h-4 w-4 mr-2" />{t('createOrder')} ({selectedAlerts.length})</>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Categories Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-blue-500 p-4'
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('categories')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {summary.totalCategories}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Critical Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-red-500 p-4'
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('critical')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {summary.criticalCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Warning Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-yellow-500 p-4'
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('warning')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {summary.warningCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Healthy/Normal Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'border-l-4 border-l-green-500 p-4'
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {t('normal')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1 tabular-nums">
                {summary.healthyCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="moc">
        <TabsList>
          <TabsTrigger value="moc">{t('mocStatus')}</TabsTrigger>
          <TabsTrigger value="alerts">
            {t('alerts')}{dashboard?.alerts?.length ? <Badge variant="destructive" className="ml-2">{dashboard.alerts.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="moc" className="mt-4">
          <MOCStatusGrid data={dashboard?.mocByCategory || []} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <ReplenishmentAlertList
            alerts={dashboard?.alerts || []}
            selectedAlerts={selectedAlerts}
            onSelectChange={setSelectedAlerts}
            onAcknowledge={handleAcknowledge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
