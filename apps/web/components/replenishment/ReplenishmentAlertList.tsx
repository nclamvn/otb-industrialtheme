'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, AlertCircle, Info, Check, Loader2 } from 'lucide-react';
import type { ReplenishmentAlert, AlertSeverity, ReplenishmentAlertType } from '@/types/replenishment';
import { format } from 'date-fns';

const SEVERITY_KEYS: Record<AlertSeverity, string> = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
};

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; icon: typeof AlertTriangle }> = {
  CRITICAL: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  WARNING: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  INFO: { color: 'bg-blue-100 text-blue-800', icon: Info },
};

const ALERT_TYPE_KEYS: Record<ReplenishmentAlertType, string> = {
  BELOW_MIN_MOC: 'belowMinMoc',
  APPROACHING_MIN: 'approachingMin',
  ABOVE_MAX_MOC: 'aboveMaxMoc',
  STOCKOUT_RISK: 'stockoutRisk',
  LEAD_TIME_RISK: 'leadTimeRisk',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
}

interface Props {
  alerts: ReplenishmentAlert[];
  selectedAlerts: string[];
  onSelectChange: (selected: string[]) => void;
  onAcknowledge?: (id: string) => void;
}

export function ReplenishmentAlertList({ alerts, selectedAlerts, onSelectChange, onAcknowledge }: Props) {
  const t = useTranslations('replenishment');
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const handleAcknowledge = async (id: string) => {
    setAcknowledging(id);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    onAcknowledge?.(id);
    setAcknowledging(null);
  };

  const toggleSelect = (id: string) => {
    if (selectedAlerts.includes(id)) {
      onSelectChange(selectedAlerts.filter(a => a !== id));
    } else {
      onSelectChange([...selectedAlerts, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      onSelectChange([]);
    } else {
      onSelectChange(alerts.map(a => a.id));
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
          {t('noAlerts')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('activeAlerts')}</CardTitle>
        <CardDescription>{t('alertsNeedAttention', { count: alerts.length })}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAlerts.length === alerts.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>{t('table.category')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.severity')}</TableHead>
              <TableHead className="text-right">{t('table.currentMoc')}</TableHead>
              <TableHead className="text-right">{t('table.targetMoc')}</TableHead>
              <TableHead className="text-right">{t('table.suggestedQty')}</TableHead>
              <TableHead className="text-right">{t('table.value')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead className="w-20">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => {
              const severityConfig = SEVERITY_CONFIG[alert.severity];
              const Icon = severityConfig.icon;
              return (
                <TableRow key={alert.id} className={alert.isAcknowledged ? 'opacity-50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAlerts.includes(alert.id)}
                      onCheckedChange={() => toggleSelect(alert.id)}
                      disabled={alert.isAcknowledged}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{alert.categoryName || 'N/A'}</TableCell>
                  <TableCell>{t(`alertTypes.${ALERT_TYPE_KEYS[alert.alertType]}`)}</TableCell>
                  <TableCell>
                    <Badge className={severityConfig.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {t(`severity.${SEVERITY_KEYS[alert.severity]}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{alert.currentMOC.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">{alert.targetMOC.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">{alert.suggestedOrderQty.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatCurrency(alert.suggestedOrderValue)}</TableCell>
                  <TableCell>{format(new Date(alert.createdAt), 'dd/MM, HH:mm')}</TableCell>
                  <TableCell>
                    {!alert.isAcknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledging === alert.id}
                      >
                        {acknowledging === alert.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
