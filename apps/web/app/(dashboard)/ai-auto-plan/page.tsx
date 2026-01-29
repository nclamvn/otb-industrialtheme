'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Wand2,
  Play,
  Check,
  X,
  FileText,
  Calendar,
  Building2,
  Loader2,
  Download,
  RefreshCw,
  AlertCircle,
  Target,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Package,
  Archive,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface GeneratedPlan {
  id: string;
  type: string;
  name: string;
  description: string;
  status: string;
  confidence: number;
  brand: { id: string; name: string };
  season: { id: string; name: string; year: number };
  category?: { id: string; name: string };
  generatedData: {
    summary: {
      totalOTB: number;
      totalSalesPlan: number;
      totalReceiptPlan: number;
      openingStock: number;
      targetClosingStock: number;
      growthVsLY: string;
    };
    monthlyBreakdown: Array<{
      month: string;
      otbPlan: number;
      salesPlan: number;
      receiptPlan: number;
      closingStock: number;
    }>;
    categoryMix: Array<{
      category: string;
      percentage: number;
      growth: string;
    }>;
    kpiTargets: {
      sellThrough: number;
      grossMargin: number;
      inventoryTurnover: number;
      weeksOfSupply: number;
    };
    assumptions: string[];
    risks: string[];
    confidence: number;
  };
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Season {
  id: string;
  name: string;
  year: number;
}

export default function AutoOTBPlanningPage() {
  const t = useTranslations('pages.autoPlan');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const tKpi = useTranslations('kpi');
  const locale = useLocale();

  const [plans, setPlans] = useState<GeneratedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    brandId: '',
    seasonId: '',
    type: 'OTB',
    growthRate: '5',
  });

  // Load brands and seasons
  useEffect(() => {
    async function loadData() {
      try {
        const [brandsRes, seasonsRes] = await Promise.all([
          fetch('/api/v1/brands'),
          fetch('/api/v1/seasons'),
        ]);

        if (brandsRes.ok) {
          const data = await brandsRes.json();
          setBrands(data.data || []);
        }
        if (seasonsRes.ok) {
          const data = await seasonsRes.json();
          setSeasons(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    loadData();
  }, []);

  // Load existing plans
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/auto-plan');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!formData.brandId || !formData.seasonId) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/auto-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          brandId: formData.brandId,
          seasonId: formData.seasonId,
          parameters: {
            growthRate: 1 + parseFloat(formData.growthRate) / 100,
          },
        }),
      });

      if (res.ok) {
        const newPlan = await res.json();
        setPlans((prev) => [newPlan, ...prev]);
        setSelectedPlan(newPlan);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlanAction = async (planId: string, action: 'approve' | 'reject' | 'apply') => {
    try {
      const res = await fetch('/api/ai/auto-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action }),
      });

      if (res.ok) {
        const updatedPlan = await res.json();
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? updatedPlan : p))
        );
        setSelectedPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: locale === 'vi' ? 'VND' : 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-500/10 text-gray-500',
      APPROVED: 'bg-green-500/10 text-green-500',
      REJECTED: 'bg-red-500/10 text-red-500',
      APPLIED: 'bg-blue-500/10 text-blue-500',
    };
    return colors[status] || colors.DRAFT;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('title')}
            </h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plan Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('generateNewPlan')}
            </CardTitle>
            <CardDescription>
              {t('selectBrandSeason')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{tForms('selectBrand')}</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, brandId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tForms('selectBrand')} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{tForms('selectSeason')}</Label>
              <Select
                value={formData.seasonId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, seasonId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tForms('selectSeason')} />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.name} ({season.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('planType')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OTB">{t('otbPlan')}</SelectItem>
                  <SelectItem value="BUDGET">{t('budgetPlan')}</SelectItem>
                  <SelectItem value="SKU_MIX">{t('skuMixPlan')}</SelectItem>
                  <SelectItem value="SALES_FORECAST">{t('salesForecast')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {t('growthRate')}
              </Label>
              <Input
                type="number"
                value={formData.growthRate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, growthRate: e.target.value }))
                }
                min="0"
                max="50"
              />
            </div>

            <Button
              className="w-full"
              onClick={generatePlan}
              disabled={!formData.brandId || !formData.seasonId || generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {t('generatePlan')}
            </Button>
          </CardContent>
        </Card>

        {/* Plans List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {t('generatedPlans')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchPlans}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {tCommon('refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('noPlans')}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        selectedPlan?.id === plan.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{plan.type}</Badge>
                            <Badge className={getStatusColor(plan.status)}>
                              {t(`status.${plan.status.toLowerCase()}`)}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{plan.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {plan.brand.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {plan.season.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {t('confidence')}
                          </p>
                          <p className="font-semibold">
                            {Math.round(plan.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Detail */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedPlan.name}</CardTitle>
                  <CardDescription>{selectedPlan.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlan.status === 'DRAFT' && (
                    <>
                      <Button
                        onClick={() => handlePlanAction(selectedPlan.id, 'approve')}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {tCommon('approve')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePlanAction(selectedPlan.id, 'reject')}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {tCommon('reject')}
                      </Button>
                    </>
                  )}
                  {selectedPlan.status === 'APPROVED' && (
                    <Button
                      onClick={() => handlePlanAction(selectedPlan.id, 'apply')}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      {t('applyPlan')}
                    </Button>
                  )}
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {tCommon('export')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Cards */}
              <div className="grid md:grid-cols-6 gap-4">
                <Card className="relative overflow-hidden">
                  <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalOTB')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-blue-600">
                      {formatCurrency(selectedPlan.generatedData.summary.totalOTB)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <BarChart3 className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('salesPlan')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-green-600">
                      {formatCurrency(selectedPlan.generatedData.summary.totalSalesPlan)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('receiptPlan')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-purple-600">
                      {formatCurrency(selectedPlan.generatedData.summary.totalReceiptPlan)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <Archive className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('openingStock')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-orange-600">
                      {formatCurrency(selectedPlan.generatedData.summary.openingStock)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <Archive className="absolute -bottom-4 -right-4 h-32 w-32 text-cyan-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('closingStock')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-cyan-600">
                      {formatCurrency(selectedPlan.generatedData.summary.targetClosingStock)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-emerald-500/10" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{t('growthVsLY')}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold tracking-tight text-emerald-600">
                      {selectedPlan.generatedData.summary.growthVsLY}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">
                  {t('monthlyBreakdown')}
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('month')}</TableHead>
                        <TableHead className="text-right">OTB</TableHead>
                        <TableHead className="text-right">
                          {t('salesPlan')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('receiptPlan')}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('closingStock')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlan.generatedData.monthlyBreakdown.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.otbPlan)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.salesPlan)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.receiptPlan)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(month.closingStock)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* KPI Targets & Category Mix */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* KPI Targets */}
                <div>
                  <h3 className="font-semibold mb-3">
                    {t('kpiTargets')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tKpi('sellThrough')}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={selectedPlan.generatedData.kpiTargets.sellThrough}
                          className="w-24"
                        />
                        <span className="font-medium">
                          {selectedPlan.generatedData.kpiTargets.sellThrough.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tKpi('grossMargin')}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={selectedPlan.generatedData.kpiTargets.grossMargin}
                          className="w-24"
                        />
                        <span className="font-medium">
                          {selectedPlan.generatedData.kpiTargets.grossMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tKpi('inventoryTurn')}</span>
                      <span className="font-medium">
                        {selectedPlan.generatedData.kpiTargets.inventoryTurnover.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{tKpi('weeksOfSupply')}</span>
                      <span className="font-medium">
                        {selectedPlan.generatedData.kpiTargets.weeksOfSupply.toFixed(1)} {t('weeks')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Mix */}
                <div>
                  <h3 className="font-semibold mb-3">
                    {t('categoryMix')}
                  </h3>
                  <div className="space-y-3">
                    {selectedPlan.generatedData.categoryMix.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span className="text-sm">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={cat.percentage} className="w-24" />
                          <span className="font-medium w-12 text-right">
                            {cat.percentage}%
                          </span>
                          <Badge variant="outline" className="text-green-600">
                            {cat.growth}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assumptions & Risks */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {t('assumptions')}
                  </h3>
                  <ul className="space-y-2">
                    {selectedPlan.generatedData.assumptions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('risks')}
                  </h3>
                  <ul className="space-y-2">
                    {selectedPlan.generatedData.risks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
