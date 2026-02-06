import { ClearanceDashboard } from '@/components/clearance/ClearanceDashboard';

interface Props {
  searchParams: { brandId?: string; seasonId?: string };
}

export default function ClearancePage({ searchParams }: Props) {
  const brandId = searchParams.brandId || 'default-brand-id';
  const seasonId = searchParams.seasonId || 'default-season-id';

  return (
    <div className="container mx-auto py-6">
      <ClearanceDashboard brandId={brandId} seasonId={seasonId} />
    </div>
  );
}
