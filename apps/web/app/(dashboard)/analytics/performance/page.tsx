'use client';

import { PageHeader } from '@/components/shared/page-header';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function PerformanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analysis"
        description="Track and analyze performance metrics"
      />
      <ComingSoon
        title="Performance Analysis"
        description="Comprehensive performance dashboards coming soon"
      />
    </div>
  );
}
