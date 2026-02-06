'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Save,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { OTBHierarchyTable, OTBCalculator, OTBSummary } from '@/components/otb';
import { OTB_STATUS_LABELS, OTB_VERSION_LABELS, Category } from '@/types';

interface LineItem {
  id?: string;
  categoryId: string;
  gender: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS';
  plannedUnits: number;
  plannedAmount: number;
  averageRetailPrice: number;
  averageCostPrice: number;
  marginPercent: number;
  sellThruTarget: number;
  weeksOfSupply?: number;
  comments?: string;
  category?: Category;
}

interface OTBPlanWithRelations {
  id: string;
  name: string;
  version: number;
  versionType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  budget: {
    id: string;
    totalBudget: number;
    season: { id: string; code: string; name: string };
    brand: { id: string; name: string };
    location: { id: string; name: string };
  };
  createdBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  approvedAt?: string;
  rejectedBy?: { id: string; name: string; email: string };
  rejectedAt?: string;
  lineItems: LineItem[];
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

export default function OTBPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [plan, setPlan] = useState<OTBPlanWithRelations | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Editable line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planRes, categoriesRes] = await Promise.all([
          fetch(`/api/v1/otb-plans/${id}`),
          fetch('/api/v1/categories'),
        ]);

        const planData = await planRes.json();
        const categoriesData = await categoriesRes.json();

        if (planData.success) {
          setPlan(planData.data);
          setLineItems(
            planData.data.lineItems.map((item: LineItem) => ({
              id: item.id,
              categoryId: item.categoryId,
              gender: item.gender,
              plannedUnits: item.plannedUnits,
              plannedAmount: Number(item.plannedAmount),
              averageRetailPrice: Number(item.averageRetailPrice),
              averageCostPrice: Number(item.averageCostPrice),
              marginPercent: Number(item.marginPercent),
              sellThruTarget: Number(item.sellThruTarget),
              weeksOfSupply: item.weeksOfSupply,
              comments: item.comments,
            }))
          );
        } else {
          toast.error('OTB plan not found');
          router.push('/otb-analysis');
        }

        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load OTB plan');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleLineItemsChange = (updatedItems: LineItem[]) => {
    setLineItems(updatedItems);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTB plan saved successfully');
        setPlan(result.data);
        setHasChanges(false);
      } else {
        toast.error(result.error || 'Failed to save OTB plan');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (hasChanges) {
      toast.error('Please save your changes before submitting');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${id}/submit`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTB plan submitted for approval');
        setPlan(result.data);
        router.replace(`/otb-analysis/${id}`);
      } else {
        toast.error(result.error || 'Failed to submit OTB plan');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setPlan(result.data);
      } else {
        toast.error(result.error || 'Failed to approve OTB plan');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTB plan rejected');
        setPlan(result.data);
        setIsRejectOpen(false);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Failed to reject OTB plan');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch(`/api/v1/otb-plans/${id}/ai-proposal`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        // Transform AI proposal to line items
        const aiLineItems: LineItem[] = result.data.proposal.map(
          (item: {
            categoryName: string;
            gender: string;
            plannedUnits: number;
            plannedAmount: number;
            averageRetailPrice: number;
            averageCostPrice: number;
            marginPercent: number;
            sellThruTarget: number;
            weeksOfSupply?: number;
          }) => {
            const category = categories.find(
              (c) => c.name.toLowerCase() === item.categoryName.toLowerCase()
            );
            return {
              categoryId: category?.id || categories[0]?.id || '',
              gender: item.gender as LineItem['gender'],
              plannedUnits: item.plannedUnits,
              plannedAmount: item.plannedAmount,
              averageRetailPrice: item.averageRetailPrice,
              averageCostPrice: item.averageCostPrice,
              marginPercent: item.marginPercent,
              sellThruTarget: item.sellThruTarget,
              weeksOfSupply: item.weeksOfSupply,
            };
          }
        );

        setLineItems(aiLineItems);
        setHasChanges(true);
        toast.success('AI proposal generated! Review and save the changes.');
      } else {
        toast.error(result.error || 'Failed to generate AI proposal');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('An error occurred while generating AI proposal');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      LOCKED: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {OTB_STATUS_LABELS[status as keyof typeof OTB_STATUS_LABELS] || status}
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
          title="OTB Plan"
          description="Loading..."
          showBackButton
          backHref="/otb-analysis"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const isEditable = isEditMode && ['DRAFT', 'REJECTED'].includes(plan.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={plan.name}
        description={`${plan.budget.season.code} - ${plan.budget.brand.name} - ${plan.budget.location.name}`}
        showBackButton
        backHref="/otb-analysis"
      >
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </Button>
            </>
          )}
          {['SUBMITTED', 'UNDER_REVIEW'].includes(plan.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejectOpen(true)}
                disabled={isSaving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isSaving}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Plan Overview
                  <Badge variant="outline">
                    {OTB_VERSION_LABELS[plan.versionType as keyof typeof OTB_VERSION_LABELS]}
                  </Badge>
                  v{plan.version}
                </CardTitle>
                {getStatusBadge(plan.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-bold">
                    ${Number(plan.budget.totalBudget).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Season</p>
                  <p className="font-medium">{plan.budget.season.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{plan.budget.brand.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{plan.budget.location.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Line Items</p>
                  <p className="font-medium">{lineItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Info */}
          {plan.status === 'REJECTED' && plan.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Rejection Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <User className="h-4 w-4" />
                    <span>Rejected by: {plan.rejectedBy?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {plan.rejectedAt
                        ? new Date(plan.rejectedAt).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-red-800">
                    <MessageSquare className="h-4 w-4 mt-0.5" />
                    <span>{plan.rejectionReason}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for different views */}
          <Tabs defaultValue="hierarchy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hierarchy" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                OTB Calculator
              </TabsTrigger>
              <TabsTrigger value="sizing" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Sizing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hierarchy" className="mt-4">
              <OTBHierarchyTable
                lineItems={lineItems}
                categories={categories}
                totalBudget={Number(plan.budget.totalBudget)}
                isEditable={isEditable}
                onLineItemsChange={handleLineItemsChange}
                onGenerateAI={handleGenerateAI}
                isGeneratingAI={isGeneratingAI}
              />
            </TabsContent>

            <TabsContent value="calculator" className="mt-4">
              <OTBCalculator
                totalBudget={Number(plan.budget.totalBudget)}
                initialInputs={{
                  plannedSales: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.6,
                  plannedMarkdowns: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.1,
                  plannedEOMInventory: Number(plan.budget.totalBudget) * 0.35,
                  bomInventory: Number(plan.budget.totalBudget) * 0.3,
                  onOrder: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.15,
                }}
                readOnly={!isEditable}
                onSave={(inputs, otbValue) => {
                  console.log('OTB Saved:', { inputs, otbValue });
                  toast.success(`OTB calculation saved: ${otbValue.toLocaleString()}`);
                }}
              />
            </TabsContent>

            <TabsContent value="sizing" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sizing analysis will be available after saving line items.</p>
                    <p className="text-sm mt-2">
                      Use AI to generate optimal size curves based on historical data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* OTB Summary Widget */}
          <OTBSummary
            data={{
              totalBudget: Number(plan.budget.totalBudget),
              plannedSales: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.6,
              plannedMarkdowns: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.1,
              plannedEOMInventory: Number(plan.budget.totalBudget) * 0.35,
              bomInventory: Number(plan.budget.totalBudget) * 0.3,
              onOrder: lineItems.reduce((sum, item) => sum + item.plannedAmount, 0) * 0.15,
            }}
            period={plan.budget.season.code}
          />

          {/* Workflow Status */}
          {plan.workflow && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plan.workflow.steps.map((step) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.createdBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {plan.approvedBy && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Approved by</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.approvedBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan.approvedAt
                          ? new Date(plan.approvedAt).toLocaleString()
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
                      {new Date(plan.updatedAt).toLocaleString()}
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
            <DialogTitle>Reject OTB Plan</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this OTB plan.
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
              disabled={isSaving || !rejectReason.trim()}
            >
              {isSaving ? 'Rejecting...' : 'Reject Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
