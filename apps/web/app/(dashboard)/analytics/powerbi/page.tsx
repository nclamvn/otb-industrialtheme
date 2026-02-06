'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PowerBIReportsGallery } from '@/components/powerbi';

export default function PowerBIPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Power BI Analytics"
        description="Interactive reports and dashboards powered by Microsoft Power BI"
      />

      <PowerBIReportsGallery />
    </div>
  );
}
