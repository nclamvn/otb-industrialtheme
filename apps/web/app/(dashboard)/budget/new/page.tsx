'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { BudgetForm } from '@/components/budget/budget-form';
import { BudgetFormData } from '@/lib/validations/budget';
import { Season, Brand, SalesLocation } from '@/types';

export default function NewBudgetPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<SalesLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [seasonsRes, brandsRes, locationsRes] = await Promise.all([
          fetch('/api/v1/seasons'),
          fetch('/api/v1/brands'),
          fetch('/api/v1/locations'),
        ]);

        const seasonsData = await seasonsRes.json();
        const brandsData = await brandsRes.json();
        const locationsData = await locationsRes.json();

        if (seasonsData.success) setSeasons(seasonsData.data);
        if (brandsData.success) setBrands(brandsData.data);
        if (locationsData.success) setLocations(locationsData.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Budget created successfully');
        router.push('/budget');
      } else {
        toast.error(result.error || 'Failed to create budget');
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/budget');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Create Budget"
          description="Create a new budget allocation"
          showBackButton
          backHref="/budget"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Budget"
        description="Create a new budget allocation for a season"
        showBackButton
        backHref="/budget"
      />

      <BudgetForm
        seasons={seasons}
        brands={brands}
        locations={locations}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </div>
  );
}
