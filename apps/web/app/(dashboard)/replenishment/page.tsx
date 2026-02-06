import { ReplenishmentDashboard } from '@/components/replenishment/ReplenishmentDashboard';

interface Props {
  searchParams: { brandId?: string };
}

export default function ReplenishmentPage({ searchParams }: Props) {
  const brandId = searchParams.brandId || 'default-brand-id';

  return (
    <div className="container mx-auto py-6">
      <ReplenishmentDashboard brandId={brandId} />
    </div>
  );
}
