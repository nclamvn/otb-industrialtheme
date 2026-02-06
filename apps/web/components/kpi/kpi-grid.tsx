'use client';

import { KPICard } from './kpi-card';
import { KPIGauge } from './kpi-gauge';
import type { KPIDisplay, KPIGaugeData } from '@/types/kpi';

interface KPIGridProps {
  kpis: KPIDisplay[];
  variant?: 'cards' | 'gauges' | 'compact';
  columns?: 2 | 3 | 4;
  onViewDetails?: (kpi: KPIDisplay) => void;
  onSetTarget?: (kpi: KPIDisplay) => void;
  onConfigureAlert?: (kpi: KPIDisplay) => void;
}

export function KPIGrid({
  kpis,
  variant = 'cards',
  columns = 4,
  onViewDetails,
  onSetTarget,
  onConfigureAlert,
}: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  if (variant === 'gauges') {
    const gaugeData: KPIGaugeData[] = kpis.map((kpi) => ({
      label: kpi.name,
      value: kpi.value,
      min: 0,
      max: kpi.target ? kpi.target.value * 1.5 : kpi.value * 1.5,
      target: kpi.target?.value ?? undefined,
      status: kpi.status,
      zones: [
        { from: 0, to: (kpi.target?.value || kpi.value) * 0.6, color: '#ef4444' },
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
      ],
      formatValue: () => kpi.formattedValue,
    }));

    return (
      <div className={`grid gap-4 ${gridCols[columns]}`}>
        {gaugeData.map((gauge, index) => (
          <KPIGauge key={index} data={gauge} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns]}`}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.code}
          kpi={kpi}
          compact={variant === 'compact'}
          onViewDetails={onViewDetails}
          onSetTarget={onSetTarget}
          onConfigureAlert={onConfigureAlert}
        />
      ))}
    </div>
  );
}
