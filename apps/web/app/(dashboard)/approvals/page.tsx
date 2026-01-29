'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Clock,
  CheckCircle,
  DollarSign,
  BarChart3,
  FileSpreadsheet,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { WORKFLOW_STATUS_LABELS } from '@/types';

interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  status: string;
  actionBy?: { id: string; name: string };
  actionAt?: string;
}

interface ApprovalWorkflow {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  dueDate?: string;
  initiatedBy: { id: string; name: string; email: string };
  steps: WorkflowStep[];
  currentStepDetails?: WorkflowStep;
  entityDetails: {
    id: string;
    name?: string;
    totalBudget?: number;
    season?: { code: string; name: string };
    brand?: { name: string };
    location?: { name: string };
    budget?: {
      season: { code: string; name: string };
      brand: { name: string };
      location: { name: string };
      totalBudget: number;
    };
    otbPlan?: {
      name: string;
      budget: {
        season: { code: string; name: string };
        brand: { name: string };
        location: { name: string };
      };
    };
  };
}

interface Summary {
  budget: number;
  otb: number;
  sku: number;
  total: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const t = useTranslations('pages.approvals');
  const locale = useLocale();

  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [summary, setSummary] = useState<Summary>({ budget: 0, otb: 0, sku: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all' && activeTab !== 'completed') {
        params.append('type', activeTab);
      }
      if (activeTab === 'completed') {
        params.append('status', 'completed');
      }

      const response = await fetch(`/api/v1/approvals?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(t('failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_APPROVAL':
        return <DollarSign className="h-4 w-4" />;
      case 'OTB_APPROVAL':
        return <BarChart3 className="h-4 w-4" />;
      case 'SKU_APPROVAL':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BUDGET_APPROVAL: 'bg-blue-100 text-blue-800',
      OTB_APPROVAL: 'bg-purple-100 text-purple-800',
      SKU_APPROVAL: 'bg-green-100 text-green-800',
    };

    const labelKeys: Record<string, string> = {
      BUDGET_APPROVAL: 'budget',
      OTB_APPROVAL: 'otbPlans',
      SKU_APPROVAL: 'skuProposals',
    };

    return (
      <Badge variant="secondary" className={colors[type]}>
        {labelKeys[type] ? t(labelKeys[type]) : type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="secondary" className={colors[status]}>
        {WORKFLOW_STATUS_LABELS[status as keyof typeof WORKFLOW_STATUS_LABELS] || status}
      </Badge>
    );
  };

  const getEntityName = (workflow: ApprovalWorkflow): string => {
    if (workflow.entityType === 'BUDGET' && workflow.entityDetails) {
      return `${workflow.entityDetails.season?.code} - ${workflow.entityDetails.brand?.name}`;
    }
    if (workflow.entityType === 'OTB_PLAN' && workflow.entityDetails) {
      return (
        workflow.entityDetails.name ||
        `${workflow.entityDetails.budget?.season?.code} - ${workflow.entityDetails.budget?.brand?.name}`
      );
    }
    if (workflow.entityType === 'SKU_PROPOSAL' && workflow.entityDetails) {
      return (
        workflow.entityDetails.name ||
        `${workflow.entityDetails.otbPlan?.budget?.season?.code} - ${workflow.entityDetails.otbPlan?.budget?.brand?.name}`
      );
    }
    return t('unknown');
  };

  const getEntityUrl = (workflow: ApprovalWorkflow): string => {
    switch (workflow.entityType) {
      case 'BUDGET':
        return `/budget/${workflow.entityId}`;
      case 'OTB_PLAN':
        return `/otb-analysis/${workflow.entityId}`;
      case 'SKU_PROPOSAL':
        return `/sku-proposal/${workflow.entityId}`;
      default:
        return '#';
    }
  };

  const filteredWorkflows =
    activeTab === 'all' || activeTab === 'completed'
      ? workflows
      : workflows.filter((w) =>
          activeTab === 'budget'
            ? w.type === 'BUDGET_APPROVAL'
            : activeTab === 'otb'
              ? w.type === 'OTB_APPROVAL'
              : w.type === 'SKU_APPROVAL'
        );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <Clock className="absolute -bottom-4 -right-4 h-32 w-32 text-yellow-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalPending')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-yellow-600">{summary.total}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('awaitingAction')}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('budget')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">{summary.budget}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('budgetApprovals')}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <BarChart3 className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('otbPlans')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">{summary.otb}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('otbApprovals')}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <FileSpreadsheet className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('skuProposals')}</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">{summary.sku}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('skuApprovals')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">{t('all')} ({summary.total})</TabsTrigger>
          <TabsTrigger value="budget">{t('budget')} ({summary.budget})</TabsTrigger>
          <TabsTrigger value="otb">OTB ({summary.otb})</TabsTrigger>
          <TabsTrigger value="sku">SKU ({summary.sku})</TabsTrigger>
          <TabsTrigger value="completed">{t('completed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noPending')}</p>
              <p className="text-sm mt-1">{t('allCaughtUp')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(getEntityUrl(workflow))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTypeIcon(workflow.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{getEntityName(workflow)}</h3>
                            {getTypeBadge(workflow.type)}
                            {getStatusBadge(workflow.status)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {workflow.initiatedBy.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(workflow.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                            </span>
                            {workflow.currentStepDetails && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t('step')} {workflow.currentStep}/{workflow.totalSteps}:{' '}
                                {workflow.currentStepDetails.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
