'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MOCData, MOCStatus } from '@/types/replenishment';

const STATUS_CONFIG: Record<MOCStatus, { label: string; color: string; badgeColor: string; borderColor: string }> = {
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-500',
    badgeColor: 'bg-red-500/10 text-red-500 border-red-500/30',
    borderColor: 'border-l-red-500'
  },
  WARNING: {
    label: 'Warning',
    color: 'text-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    borderColor: 'border-l-amber-500'
  },
  HEALTHY: {
    label: 'Healthy',
    color: 'text-green-500',
    badgeColor: 'bg-green-500/10 text-green-500 border-green-500/30',
    borderColor: 'border-l-green-500'
  },
  OVERSTOCK: {
    label: 'Overstock',
    color: 'text-purple-500',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    borderColor: 'border-l-purple-500'
  },
  UNKNOWN: {
    label: 'Unknown',
    color: 'text-muted-foreground',
    badgeColor: 'bg-muted text-muted-foreground border-border',
    borderColor: 'border-l-muted-foreground'
  },
};

interface Props {
  data: MOCData[];
}

export function MOCStatusGrid({ data }: Props) {
  if (data.length === 0) return <div className="text-center py-8 text-muted-foreground">No MOC data</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item) => {
        const config = STATUS_CONFIG[item.status];
        const pct = Math.min(100, (item.currentMOC / item.maxMOC) * 100);
        return (
          <Card key={item.categoryId} className={cn('border-l-4', config.borderColor)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base text-foreground">{item.categoryName}</CardTitle>
                <Badge className={cn('border', config.badgeColor)}>{config.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={cn('text-4xl font-bold tabular-nums', config.color)}>{item.currentMOC.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Months of Cover</div>
              </div>
              <Progress value={pct} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: {item.minMOC}</span>
                <span>Target: {item.targetMOC}</span>
                <span>Max: {item.maxMOC}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Stock:</span> <span className="text-foreground font-medium">{item.currentStock.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Monthly:</span> <span className="text-foreground font-medium">{item.monthlyRate.toLocaleString()}</span></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
