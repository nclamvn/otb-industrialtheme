'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { SKUAnalysisDashboard } from '@/components/sku-analysis';

export default function SKUAnalysisPage() {
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [seasons, setSeasons] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    // Fetch filter options
    Promise.all([
      fetch('/api/v1/brands').then((r) => r.json()),
      fetch('/api/v1/categories').then((r) => r.json()),
      fetch('/api/v1/seasons').then((r) => r.json()),
    ]).then(([brandsRes, categoriesRes, seasonsRes]) => {
      if (brandsRes.success) setBrands(brandsRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (seasonsRes.success) setSeasons(seasonsRes.data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SKU Performance Analysis"
        description="Identify best and worst performing SKUs to optimize your product portfolio"
      />

      <SKUAnalysisDashboard
        brands={brands}
        categories={categories}
        seasons={seasons}
      />
    </div>
  );
}
