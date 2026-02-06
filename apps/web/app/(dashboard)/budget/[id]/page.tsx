'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Send,
  CheckCircle,
  XCircle,
  Pencil,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  MessageSquare,
  DollarSign,
  Activity,
  ClipboardList,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { BudgetForm } from '@/components/budget/budget-form';
import { BudgetVarianceCompact } from '@/components/budget/budget-variance';
import { BudgetFormData } from '@/lib/validations/budget';
import { Season, Brand, SalesLocation, BUDGET_STATUS_LABELS } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface BudgetWithRelations {
  id: string;
  seasonId: string;
  brandId: string;
  locationId: string;
  totalBudget: number;
  seasonalBudget?: number;
  replenishmentBudget?: number;
  currency: string;
  status: string;
  version: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  season: Season;
  brand: Brand;
  location: { id: string; name: string; code: string };
  createdBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  approvedAt?: string;
  rejectedBy?: { id: string; name: string; email: string };
  rejectedAt?: string;
  rejectionReason?: string;
  workflow?: {
    id: string;
    status: string;
    currentStep: number;
    steps: Array<{
      id: string;
      stepNumber: number;
      name: string;
      status: string;
      actionBy?: { id: string; name: string };
      actionAt?: string;
      comment?: string;
    }>;
  };
}

interface ComparisonData {
  id: string;
  totalBudget: number;
  season: { code: string; name: string };
}

export default function BudgetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [budget, setBudget] = useState<BudgetWithRelations | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<SalesLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [budgetRes, seasonsRes, brandsRes, locationsRes] = await Promise.all([
          fetch(`/api/v1/budgets/${id}`),
          fetch('/api/v1/seasons'),
          fetch('/api/v1/brands'),
          fetch('/api/v1/locations'),
        ]);

        const budgetData = await budgetRes.json();
        const seasonsData = await seasonsRes.json();
        const brandsData = await brandsRes.json();
        const locationsData = await locationsRes.json();

        if (budgetData.success) {
          setBudget(budgetData.data);
          setComparison(budgetData.comparison);
        } else {
          toast.error('Budget not found');
          router.push('/budget');
        }
        if (seasonsData.success) setSeasons(seasonsData.data);
        if (brandsData.success) setBrands(brandsData.data);
        if (locationsData.success) setLocations(locationsData.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load budget');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleUpdate = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/budgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Budget updated successfully');
        setBudget(result.data);
        router.replace(`/budget/${id}`);
      } else {
        toast.error(result.error || 'Failed to update budget');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/budgets/${id}/submit`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Budget submitted for approval');
        setBudget(result.data);
      } else {
        toast.error(result.error || 'Failed to submit budget');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/budgets/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setBudget(result.data);
      } else {
        toast.error(result.error || 'Failed to approve budget');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/budgets/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Budget rejected');
        setBudget(result.data);
        setIsRejectOpen(false);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Failed to reject budget');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      REVISED: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {BUDGET_STATUS_LABELS[status as keyof typeof BUDGET_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Budget Details"
          description="Loading..."
          showBackButton
          backHref="/budget"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return null;
  }

  // Edit mode
  if (isEditMode && ['DRAFT', 'REJECTED'].includes(budget.status)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Budget"
          description={`${budget.season.code} - ${budget.brand.name} - ${budget.location.name}`}
          showBackButton
          backHref={`/budget/${id}`}
        />

        <BudgetForm
          initialData={{
            id: budget.id,
            seasonId: budget.seasonId,
            brandId: budget.brandId,
            locationId: budget.locationId,
            totalBudget: Number(budget.totalBudget),
            seasonalBudget: budget.seasonalBudget ? Number(budget.seasonalBudget) : undefined,
            replenishmentBudget: budget.replenishmentBudget
              ? Number(budget.replenishmentBudget)
              : undefined,
            currency: budget.currency,
            comments: budget.comments,
          }}
          seasons={seasons}
          brands={brands}
          locations={locations}
          onSubmit={handleUpdate}
          onCancel={() => router.replace(`/budget/${id}`)}
          isLoading={isSubmitting}
          comparison={comparison}
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Details"
        description={`${budget.season.code} - ${budget.brand.name} - ${budget.location.name}`}
        showBackButton
        backHref="/budget"
      >
        <div className="flex gap-2">
          {['DRAFT', 'REJECTED'].includes(budget.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/budget/${id}?edit=true`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </>
          )}
          {['SUBMITTED', 'UNDER_REVIEW'].includes(budget.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejectOpen(true)}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="relative overflow-hidden">
            <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-emerald-500/10" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Budget Information</CardTitle>
                {getStatusBadge(budget.status)}
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Season</p>
                  <p className="font-medium">{budget.season.code}</p>
                  <p className="text-sm text-muted-foreground">{budget.season.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{budget.brand.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{budget.location.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">v{budget.version}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">
                    ${Number(budget.totalBudget).toLocaleString()}
                  </p>
                </div>
                {budget.seasonalBudget && (
                  <div>
                    <p className="text-sm text-muted-foreground">Seasonal</p>
                    <p className="font-medium">
                      ${Number(budget.seasonalBudget).toLocaleString()}
                    </p>
                  </div>
                )}
                {budget.replenishmentBudget && (
                  <div>
                    <p className="text-sm text-muted-foreground">Replenishment</p>
                    <p className="font-medium">
                      ${Number(budget.replenishmentBudget).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{budget.currency}</p>
                </div>
              </div>

              {comparison && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comparison with {comparison.season.code}
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Previous</p>
                        <p className="font-medium">
                          ${Number(comparison.totalBudget).toLocaleString()}
                        </p>
                      </div>
                      <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="font-medium">
                          ${Number(budget.totalBudget).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Change</p>
                        {(() => {
                          const variance =
                            ((Number(budget.totalBudget) - Number(comparison.totalBudget)) /
                              Number(comparison.totalBudget)) *
                            100;
                          return (
                            <p
                              className={`font-medium ${
                                variance > 0
                                  ? 'text-green-600'
                                  : variance < 0
                                    ? 'text-red-600'
                                    : ''
                              }`}
                            >
                              {variance > 0 ? '+' : ''}
                              {variance.toFixed(1)}%
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {budget.comments && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Comments</p>
                    <p className="text-sm">{budget.comments}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Budget Analytics */}
          <Card className="relative overflow-hidden">
            <BarChart3 className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Analytics</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="allocation">Allocation</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Seasonal vs Replenishment */}
                    <Card className="relative overflow-hidden">
                      <PieChart className="absolute -bottom-4 -right-4 h-32 w-32 text-indigo-500/10" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Budget Split</CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Seasonal</span>
                              <span>
                                {budget.seasonalBudget && budget.totalBudget
                                  ? ((Number(budget.seasonalBudget) / Number(budget.totalBudget)) * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            <Progress
                              value={
                                budget.seasonalBudget && budget.totalBudget
                                  ? (Number(budget.seasonalBudget) / Number(budget.totalBudget)) * 100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Replenishment</span>
                              <span>
                                {budget.replenishmentBudget && budget.totalBudget
                                  ? ((Number(budget.replenishmentBudget) / Number(budget.totalBudget)) * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            <Progress
                              value={
                                budget.replenishmentBudget && budget.totalBudget
                                  ? (Number(budget.replenishmentBudget) / Number(budget.totalBudget)) * 100
                                  : 0
                              }
                              className="h-2 [&>div]:bg-amber-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Progress */}
                    <Card className="relative overflow-hidden">
                      <ClipboardList className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approval Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Progress
                              value={
                                budget.status === 'APPROVED' ? 100 :
                                budget.status === 'UNDER_REVIEW' ? 66 :
                                budget.status === 'SUBMITTED' ? 33 : 0
                              }
                              className="h-3"
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {budget.status === 'APPROVED' ? '100%' :
                             budget.status === 'UNDER_REVIEW' ? '66%' :
                             budget.status === 'SUBMITTED' ? '33%' : '0%'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Draft</span>
                          <span>Submitted</span>
                          <span>Review</span>
                          <span>Approved</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Comparison Quick View */}
                    {comparison && (
                      <BudgetVarianceCompact
                        budgeted={Number(comparison.totalBudget)}
                        actual={Number(budget.totalBudget)}
                        label={`vs ${comparison.season.code}`}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="allocation">
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Category breakdown coming soon</p>
                    <p className="text-sm">Allocate budget to categories and subcategories</p>
                  </div>
                </TabsContent>

                <TabsContent value="performance">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Performance tracking coming soon</p>
                    <p className="text-sm">Track actual spend vs budget over time</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Rejection Info */}
          {budget.status === 'REJECTED' && budget.rejectionReason && (
            <Card className="relative overflow-hidden border-red-200 bg-red-50">
              <XCircle className="absolute -bottom-4 -right-4 h-32 w-32 text-red-500/10" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Rejection Details</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <User className="h-4 w-4" />
                    <span>Rejected by: {budget.rejectedBy?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {budget.rejectedAt
                        ? new Date(budget.rejectedAt).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-red-800">
                    <MessageSquare className="h-4 w-4 mt-0.5" />
                    <span>{budget.rejectionReason}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Status */}
          {budget.workflow && (
            <Card className="relative overflow-hidden">
              <GitBranch className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {budget.workflow.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5">{getStepStatusIcon(step.status)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{step.name}</p>
                        {step.actionBy && (
                          <p className="text-xs text-muted-foreground">
                            {step.actionBy.name}
                          </p>
                        )}
                        {step.actionAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(step.actionAt).toLocaleString()}
                          </p>
                        )}
                        {step.comment && (
                          <p className="text-xs mt-1 text-muted-foreground italic">
                            &quot;{step.comment}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          <Card className="relative overflow-hidden">
            <Activity className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-xs text-muted-foreground">
                      {budget.createdBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(budget.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {budget.approvedBy && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Approved by</p>
                      <p className="text-xs text-muted-foreground">
                        {budget.approvedBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {budget.approvedAt
                          ? new Date(budget.approvedAt).toLocaleString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(budget.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Budget</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this budget allocation.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectOpen(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Budget'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
