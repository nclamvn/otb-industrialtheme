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
import { BudgetAllocation, Season, Brand } from '@/types';

interface ApprovedBudget extends Omit<BudgetAllocation, 'season' | 'brand' | 'location'> {
  season: Season;
  brand: Brand;
  location: { id: string; name: string };
}

export default function NewOTBPlanPage() {
  const router = useRouter();
  const t = useTranslations('pages.otbAnalysis');
  const tCommon = useTranslations('common');
  const tBudget = useTranslations('budget');
  const [budgets, setBudgets] = useState<ApprovedBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [planName, setPlanName] = useState('');
  const [versionType, setVersionType] = useState<'INITIAL' | 'REVISED' | 'FINAL'>('INITIAL');

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const response = await fetch('/api/v1/budgets?status=APPROVED');
        const data = await response.json();

        if (data.success) {
          setBudgets(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch budgets:', error);
        toast.error(t('loadBudgetsError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchBudgets();
  }, []);

  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBudgetId) {
      toast.error(t('selectBudgetError'));
      return;
    }

    if (!planName.trim()) {
      toast.error(t('enterPlanNameError'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/otb-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: selectedBudgetId,
          name: planName,
          versionType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('createSuccess'));
        router.push(`/otb-analysis/${result.data.id}?edit=true`);
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
          backHref="/otb-analysis"
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
        backHref="/otb-analysis"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('planDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">{t('approvedBudget')}</Label>
                <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectBudgetPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t('noBudgetsAvailable')}
                      </SelectItem>
                    ) : (
                      budgets.map((budget) => (
                        <SelectItem key={budget.id} value={budget.id}>
                          {budget.season.code} - {budget.brand.name} - {budget.location.name} ($
                          {Number(budget.totalBudget).toLocaleString()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('planName')}</Label>
                <Input
                  id="name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder={t('planNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="versionType">{t('versionType')}</Label>
                <Select
                  value={versionType}
                  onValueChange={(v) => setVersionType(v as typeof versionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIAL">{t('initial')}</SelectItem>
                    <SelectItem value="REVISED">{t('revised')}</SelectItem>
                    <SelectItem value="FINAL">{t('final')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBudget && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{t('selectedBudgetDetails')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{tBudget('season')}</p>
                    <p className="font-medium">
                      {selectedBudget.season.code} - {selectedBudget.season.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('brand')}</p>
                    <p className="font-medium">{selectedBudget.brand.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('location')}</p>
                    <p className="font-medium">{selectedBudget.location.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{tBudget('totalAllocated')}</p>
                    <p className="font-medium text-green-600">
                      ${Number(selectedBudget.totalBudget).toLocaleString()}
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
            onClick={() => router.push('/otb-analysis')}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedBudgetId || !planName.trim()}>
            {isSubmitting ? t('creating') : t('createPlan')}
          </Button>
        </div>
      </form>
    </div>
  );
}
