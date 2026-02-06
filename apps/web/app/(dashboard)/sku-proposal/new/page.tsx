'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';

interface ApprovedOTBPlan {
  id: string;
  name: string;
  version: number;
  budget: {
    id: string;
    totalBudget: number;
    season: { id: string; code: string; name: string };
    brand: { id: string; name: string };
    location: { id: string; name: string };
  };
}

export default function NewSKUProposalPage() {
  const router = useRouter();
  const t = useTranslations('pages.sku');
  const tCommon = useTranslations('common');
  const tBudget = useTranslations('budget');
  const [otbPlans, setOTBPlans] = useState<ApprovedOTBPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOTBPlanId, setSelectedOTBPlanId] = useState<string>('');
  const [proposalName, setProposalName] = useState('');

  useEffect(() => {
    async function fetchOTBPlans() {
      try {
        const response = await fetch('/api/v1/otb-plans?status=APPROVED');
        const data = await response.json();

        if (data.success) {
          setOTBPlans(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch OTB plans:', error);
        toast.error(t('loadPlansError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOTBPlans();
  }, [t]);

  const selectedPlan = otbPlans.find((p) => p.id === selectedOTBPlanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOTBPlanId) {
      toast.error(t('selectPlanError'));
      return;
    }

    if (!proposalName.trim()) {
      toast.error(t('enterNameError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/sku-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otbPlanId: selectedOTBPlanId,
          name: proposalName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('createSuccess'));
        router.push(`/sku-proposal/${result.data.id}?edit=true`);
      } else {
        toast.error(result.error || t('createError'));
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('createTitle')}
          description={t('createDescription')}
          showBackButton
          backHref="/sku-proposal"
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
        title={t('createTitle')}
        description={t('createDescriptionFull')}
        showBackButton
        backHref="/sku-proposal"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('proposalDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otbPlan">{t('selectOtbPlan')}</Label>
                <Select value={selectedOTBPlanId} onValueChange={setSelectedOTBPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectOtbPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {otbPlans.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t('noApprovedPlans')}
                      </SelectItem>
                    ) : (
                      otbPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.budget.season.code} -{' '}
                          {plan.budget.brand.name})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('proposalName')}</Label>
                <Input
                  id="name"
                  value={proposalName}
                  onChange={(e) => setProposalName(e.target.value)}
                  placeholder={t('proposalNamePlaceholder')}
                />
              </div>
            </div>

            {selectedPlan && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{t('selectedPlanDetails')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{tBudget('season')}</p>
                    <p className="font-medium">{selectedPlan.budget.season.code}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('brand')}</p>
                    <p className="font-medium">{selectedPlan.budget.brand.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('location')}</p>
                    <p className="font-medium">{selectedPlan.budget.location.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('totalAllocated')}</p>
                    <p className="font-medium text-green-600">
                      ${Number(selectedPlan.budget.totalBudget).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sku-proposal')}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedOTBPlanId || !proposalName.trim()}
          >
            {isSubmitting ? t('creating') : t('createProposal')}
          </Button>
        </div>
      </form>
    </div>
  );
}
