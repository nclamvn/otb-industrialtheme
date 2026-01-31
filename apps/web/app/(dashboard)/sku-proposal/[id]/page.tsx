'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  FileCheck,
  Upload,
  Wand2,
  Ruler,
  DollarSign,
  Building2,
} from 'lucide-react';
import {
  ChoiceAllocationCard,
  SizeAllocationTable,
  useSizeAllocation,
} from '@/components/size-allocation';
import { CostingBreakdownCard, calculateCosting } from '@/components/costing';
import { CarryForwardBadge } from '@/components/carry-forward';
import { VarianceIndicator } from '@/components/shared/VarianceIndicator';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { ExcelUpload, UploadResult } from '@/components/sku/excel-upload';
import { SKUAutoGenerator, GeneratedSKU } from '@/components/sku-proposal';
import { SKU_STATUS_LABELS, GENDER_LABELS, Category } from '@/types';

interface SKUItem {
  id: string;
  styleCode: string;
  styleName: string;
  colorCode?: string;
  colorName?: string;
  categoryId?: string;
  category?: Category;
  gender?: string;
  retailPrice?: number;
  costPrice?: number;
  sizeRun?: string;
  quantity?: number;
  validationStatus: string;
  validationErrors?: string[];
  validationWarnings?: string[];
  aiEnriched?: boolean;
}

interface SKUProposalWithRelations {
  id: string;
  name: string;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  otbPlan: {
    id: string;
    name: string;
    budget: {
      id: string;
      totalBudget: number;
      season: { id: string; code: string; name: string };
      brand: { id: string; name: string };
      location: { id: string; name: string };
    };
  };
  createdBy: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string };
  approvedAt?: string;
  rejectedBy?: { id: string; name: string; email: string };
  rejectedAt?: string;
  items: SKUItem[];
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

interface Summary {
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  pendingCount: number;
}

export default function SKUProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [proposal, setProposal] = useState<SKUProposalWithRelations | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    itemsCreated?: number;
    warnings?: string[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/sku-proposals/${id}`);
      const data = await response.json();

      if (data.success) {
        setProposal(data.data);
        setSummary(data.summary);
      } else {
        toast.error('SKU proposal not found');
        router.push('/sku-proposal');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load SKU proposal');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/sku-proposals/${id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({
          success: true,
          itemsCreated: result.data.itemsCreated,
          warnings: result.data.warnings,
        });
        toast.success(result.message);
        fetchData();
      } else {
        setUploadResult({ success: false });
        toast.error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ success: false });
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/v1/sku-proposals/${id}/validate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to validate SKUs');
      }
    } catch (error) {
      console.error('Validate error:', error);
      toast.error('An error occurred');
    } finally {
      setIsValidating(false);
    }
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const response = await fetch(`/api/v1/sku-proposals/${id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to enrich SKUs');
      }
    } catch (error) {
      console.error('Enrich error:', error);
      toast.error('An error occurred');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/sku-proposals/${id}/submit`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('SKU proposal submitted for approval');
        setProposal(result.data);
        router.replace(`/sku-proposal/${id}`);
      } else {
        toast.error(result.error || 'Failed to submit SKU proposal');
      }
    } catch (error) {
      console.error('Submit error:', error);
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
      const response = await fetch(`/api/v1/sku-proposals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('SKU proposal rejected');
        setProposal(result.data);
        setIsRejectOpen(false);
        setRejectReason('');
      } else {
        toast.error(result.error || 'Failed to reject SKU proposal');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ORDERED: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {SKU_STATUS_LABELS[status as keyof typeof SKU_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const getValidationBadge = (status: string) => {
    const colors: Record<string, string> = {
      VALID: 'bg-green-100 text-green-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      PENDING: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {status}
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
          title="SKU Proposal"
          description="Loading..."
          showBackButton
          backHref="/sku-proposal"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const isEditable = isEditMode && ['DRAFT', 'REJECTED'].includes(proposal.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposal.name}
        description={`${proposal.otbPlan.budget.season.code} - ${proposal.otbPlan.budget.brand.name}`}
        showBackButton
        backHref="/sku-proposal"
      >
        <div className="flex items-center gap-2">
          {isEditable && (
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          )}
          {['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status) && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsRejectOpen(true)}
                disabled={isSaving}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button disabled={isSaving}>
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
                <CardTitle>Proposal Overview</CardTitle>
                {getStatusBadge(proposal.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total SKUs</p>
                  <p className="text-lg font-bold">{summary?.totalItems || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Qty</p>
                  <p className="text-lg font-bold">
                    {(summary?.totalQuantity || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold">
                    ${(summary?.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid</p>
                  <p className="text-lg font-bold text-green-600">
                    {summary?.validCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-lg font-bold text-red-600">
                    {summary?.errorCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Info */}
          {proposal.status === 'REJECTED' && proposal.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Rejection Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <User className="h-4 w-4" />
                    <span>Rejected by: {proposal.rejectedBy?.name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-red-800">
                    <MessageSquare className="h-4 w-4 mt-0.5" />
                    <span>{proposal.rejectionReason}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue={isEditable && proposal.items.length === 0 ? 'auto-generate' : 'items'}>
            <TabsList>
              {isEditable && (
                <>
                  <TabsTrigger value="auto-generate" className="gap-2">
                    <Wand2 className="h-4 w-4" />
                    Auto-Generate
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Excel
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="items" className="gap-2">
                <FileCheck className="h-4 w-4" />
                SKU Items ({proposal.items.length})
              </TabsTrigger>
              <TabsTrigger value="sizing" className="gap-2">
                <Ruler className="h-4 w-4" />
                Size Allocation
              </TabsTrigger>
              <TabsTrigger value="costing" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Costing
              </TabsTrigger>
            </TabsList>

            {isEditable && (
              <>
                <TabsContent value="auto-generate" className="mt-4">
                  <SKUAutoGenerator
                    proposalId={id}
                    budgetInfo={{
                      allocated: Number(proposal.otbPlan.budget.totalBudget) * 0.8,
                      remaining: Number(proposal.otbPlan.budget.totalBudget) * 0.2,
                    }}
                    onSKUsGenerated={(skus: GeneratedSKU[]) => {
                      console.log('Generated SKUs:', skus);
                      fetchData();
                    }}
                  />
                </TabsContent>
                <TabsContent value="upload" className="mt-4 space-y-4">
                  <ExcelUpload onUpload={handleUpload} isUploading={isUploading} />
                  {uploadResult && (
                    <UploadResult
                      success={uploadResult.success}
                      itemsCreated={uploadResult.itemsCreated}
                      warnings={uploadResult.warnings}
                      onClose={() => setUploadResult(null)}
                    />
                  )}
                </TabsContent>
              </>
            )}

            <TabsContent value="items" className="mt-4 space-y-4">
              {isEditable && proposal.items.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleValidate}
                    disabled={isValidating}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    {isValidating ? 'Validating...' : 'Validate All'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEnrich}
                    disabled={isEnriching}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isEnriching ? 'Enriching...' : 'AI Enrich'}
                  </Button>
                </div>
              )}

              {proposal.items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SKU items yet</p>
                  <p className="text-sm mt-1">Upload an Excel file to get started</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Style Code</TableHead>
                        <TableHead>Style Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="text-right">Retail</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>AI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proposal.items.slice(0, 50).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.styleCode}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.styleName}
                          </TableCell>
                          <TableCell>{item.category?.name || '-'}</TableCell>
                          <TableCell>
                            {item.gender
                              ? GENDER_LABELS[item.gender as keyof typeof GENDER_LABELS]
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.retailPrice
                              ? `$${Number(item.retailPrice).toFixed(2)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            {getValidationBadge(item.validationStatus)}
                          </TableCell>
                          <TableCell>
                            {item.aiEnriched && (
                              <Sparkles className="h-4 w-4 text-purple-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {proposal.items.length > 50 && (
                    <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50">
                      Showing 50 of {proposal.items.length} items
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Size Allocation Tab */}
            <TabsContent value="sizing" className="mt-4 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <ChoiceAllocationCard
                  summary={{
                    choice: 'A',
                    totalUnits: 350,
                    totalValue: 52500000,
                    percentage: 45,
                    skuCount: 25,
                  }}
                />
                <ChoiceAllocationCard
                  summary={{
                    choice: 'B',
                    totalUnits: 252,
                    totalValue: 37800000,
                    percentage: 32,
                    skuCount: 18,
                  }}
                />
                <ChoiceAllocationCard
                  summary={{
                    choice: 'C',
                    totalUnits: 168,
                    totalValue: 25200000,
                    percentage: 23,
                    skuCount: 12,
                  }}
                />
              </div>
              <SizeAllocationTable
                data={{
                  id: 'alloc-1',
                  skuId: 'sample-sku',
                  skuCode: 'REX-M-TOP-001',
                  productName: 'Basic Cotton T-Shirt',
                  category: 'Tops',
                  gender: 'Male',
                  totalA: 14,
                  totalB: 14,
                  totalC: 14,
                  grandTotal: 42,
                  sizes: [
                    { size: 'XS', qtyA: 2, qtyB: 0, qtyC: 0, total: 2, percentage: 4.8 },
                    { size: 'S', qtyA: 3, qtyB: 3, qtyC: 0, total: 6, percentage: 14.3 },
                    { size: 'M', qtyA: 4, qtyB: 5, qtyC: 6, total: 15, percentage: 35.7 },
                    { size: 'L', qtyA: 3, qtyB: 4, qtyC: 5, total: 12, percentage: 28.6 },
                    { size: 'XL', qtyA: 2, qtyB: 2, qtyC: 3, total: 7, percentage: 16.7 },
                  ],
                  status: 'draft',
                  isLocked: false,
                }}
                editable={isEditable}
              />
            </TabsContent>

            {/* Costing Tab */}
            <TabsContent value="costing" className="mt-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CostingBreakdownCard
                  costing={calculateCosting({
                    skuId: 'SAMPLE-001',
                    unitCost: 150,
                    category: 'WOMENS',
                    srp: 87900000,
                    exchangeRate: 24000,
                  })}
                  showDetails={true}
                />
                <div className="space-y-4">
                  <h3 className="font-semibold">Product Info</h3>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <CarryForwardBadge
                        data={{
                          isCarryForward: false,
                        }}
                        showDetails={false}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">YoY Variance</span>
                      <VarianceIndicator value={0.12} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Theme</span>
                      <span className="font-medium">August (08)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Composition</span>
                      <span className="font-medium">100% Cotton</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Status */}
          {proposal.workflow && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposal.workflow.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3">
                      <div className="mt-0.5">{getStepStatusIcon(step.status)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{step.name}</p>
                        {step.actionBy && (
                          <p className="text-xs text-muted-foreground">
                            {step.actionBy.name}
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
                      {proposal.createdBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(proposal.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(proposal.updatedAt).toLocaleString()}
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
            <DialogTitle>Reject SKU Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this SKU proposal.
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
              {isSaving ? 'Rejecting...' : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
