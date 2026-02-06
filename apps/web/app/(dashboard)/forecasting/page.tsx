import { ForecastingDashboard } from '@/components/forecasting/ForecastingDashboard';

interface Props {
  searchParams: { brandId?: string; seasonId?: string };
}

export default function ForecastingPage({ searchParams }: Props) {
  const brandId = searchParams.brandId || 'default-brand-id';
  const seasonId = searchParams.seasonId || 'default-season-id';

  return (
    <div className="container mx-auto py-6">
      <ForecastingDashboard brandId={brandId} seasonId={seasonId} />
    </div>
  );
}
