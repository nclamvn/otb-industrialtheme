'use client';

import { GaugeChart } from '@/components/charts/gauge-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KPIGaugeData } from '@/types/kpi';

interface KPIGaugeProps {
  data: KPIGaugeData;
  showCard?: boolean;
}

export function KPIGauge({ data, showCard = true }: KPIGaugeProps) {
  const getStatusColor = () => {
    switch (data.status) {
      case 'on_track':
        return 'bg-green-500/10 text-green-500';
      case 'at_risk':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'off_track':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (data.status) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'off_track':
        return 'Off Track';
      default:
        return 'No Target';
    }
  };

  const content = (
    <GaugeChart
      value={data.value}
      min={data.min}
      max={data.max}
      target={data.target}
      zones={data.zones}
      label={data.label}
      size="md"
    />
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
          <Badge variant="secondary" className={cn('text-xs', getStatusColor())}>
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{content}</CardContent>
    </Card>
  );
}
