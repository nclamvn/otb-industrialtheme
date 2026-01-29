'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Play,
  Package,
  FileCheck,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface AutoApprovalStats {
  totalProcessed: number;
  autoApproved: number;
  skipped: number;
  errors: number;
  byType: {
    budget: number;
    otb: number;
    sku: number;
  };
}

interface ReorderSuggestion {
  id: string;
  skuCode: string;
  productName: string;
  category: string;
  brand: string;
  currentStock: number;
  avgDailyDemand: number;
  daysOfStock: number;
  reorderQuantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: number;
  reason: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  priority: number;
  isDefault?: boolean;
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [approvalStats, setApprovalStats] = useState<AutoApprovalStats | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [reorderSummary, setReorderSummary] = useState<Record<string, number>>({});
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, reordersRes, rulesRes] = await Promise.all([
        fetch('/api/automation/run'),
        fetch('/api/automation/reorders'),
        fetch('/api/automation/rules'),
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setApprovalStats(status.approvalStats);
        setLastRun(status.timestamp);
      }

      if (reordersRes.ok) {
        const reorders = await reordersRes.json();
        setReorderSuggestions(reorders.suggestions || []);
        setReorderSummary(reorders.summary || {});
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData.rules || []);
      }
    } catch (error) {
      console.error('Error fetching automation data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunAutomation = async (type: 'approval' | 'reorder' | 'all') => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, dryRun: false }),
      });

      if (response.ok) {
        const result = await response.json();
        setRunResult(result);
        // Refresh data after run
        await fetchData();
      } else {
        const error = await response.json();
        setRunResult({ error: error.error || 'Failed to run automation' });
      }
    } catch (error) {
      console.error('Error running automation:', error);
      setRunResult({ error: 'Network error' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleProcessReorder = async (suggestionId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/automation/reorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, action }),
      });

      if (response.ok) {
        // Refresh reorder data
        const reordersRes = await fetch('/api/automation/reorders');
        if (reordersRes.ok) {
          const reorders = await reordersRes.json();
          setReorderSuggestions(reorders.suggestions || []);
          setReorderSummary(reorders.summary || {});
        }
      }
    } catch (error) {
      console.error('Error processing reorder:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRuleTypeIcon = (type: string) => {
    if (type.includes('APPROVE')) return <FileCheck className="h-4 w-4" />;
    if (type.includes('REORDER')) return <Package className="h-4 w-4" />;
    if (type.includes('ESCALATE')) return <TrendingUp className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Center</h1>
          <p className="text-muted-foreground">
            Manage automated workflows, approvals, and reorder suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleRunAutomation('all')} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run All
          </Button>
        </div>
      </div>

      {/* Run Result Alert */}
      {runResult && (
        <Alert variant={runResult.error ? 'destructive' : 'default'}>
          <Zap className="h-4 w-4" />
          <AlertTitle>Automation {runResult.error ? 'Failed' : 'Completed'}</AlertTitle>
          <AlertDescription>
            {runResult.error ? (
              String(runResult.error)
            ) : (
              <div className="text-sm">
                {runResult.approvalResults ? (
                  <span>
                    Approvals: {(runResult.approvalResults as Record<string, number>).approved || 0} approved,{' '}
                    {(runResult.approvalResults as Record<string, number>).skipped || 0} skipped.{' '}
                  </span>
                ) : null}
                {runResult.reorderResults ? (
                  <span>
                    Reorders: {(runResult.reorderResults as Record<string, number>).suggestionsCreated || 0} suggestions created.
                  </span>
                ) : null}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CheckCircle className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Approved</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">{approvalStats?.autoApproved || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              of {approvalStats?.totalProcessed || 0} processed
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reorders</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-orange-600">{reorderSummary.total || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {reorderSummary.critical || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <Settings className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">
              {rules.filter(r => r.enabled).length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              of {rules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reorder Value</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">
              {formatCurrency(reorderSummary.totalValue || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {reorderSummary.totalUnits || 0} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reorders">
            Reorder Suggestions
            {reorderSummary.critical > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reorderSummary.critical}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Auto-Approval Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Auto-Approval Summary
                </CardTitle>
                <CardDescription>
                  Workflow approvals processed by the automation system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-blue-50">
                    <div className="text-2xl font-bold text-blue-700">
                      {approvalStats?.byType.budget || 0}
                    </div>
                    <div className="text-sm text-blue-600">Budget</div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50">
                    <div className="text-2xl font-bold text-green-700">
                      {approvalStats?.byType.otb || 0}
                    </div>
                    <div className="text-sm text-green-600">OTB</div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="text-2xl font-bold text-purple-700">
                      {approvalStats?.byType.sku || 0}
                    </div>
                    <div className="text-sm text-purple-600">SKU</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRunAutomation('approval')}
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Auto-Approval
                </Button>
              </CardContent>
            </Card>

            {/* Auto-Reorder Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Auto-Reorder Summary
                </CardTitle>
                <CardDescription>
                  Inventory items flagged for reorder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-red-50">
                    <div className="text-xl font-bold text-red-700">
                      {reorderSummary.critical || 0}
                    </div>
                    <div className="text-xs text-red-600">Critical</div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <div className="text-xl font-bold text-orange-700">
                      {reorderSummary.high || 0}
                    </div>
                    <div className="text-xs text-orange-600">High</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50">
                    <div className="text-xl font-bold text-yellow-700">
                      {reorderSummary.medium || 0}
                    </div>
                    <div className="text-xs text-yellow-600">Medium</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <div className="text-xl font-bold text-green-700">
                      {reorderSummary.low || 0}
                    </div>
                    <div className="text-xs text-green-600">Low</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRunAutomation('reorder')}
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Auto-Reorder
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Last Run Info */}
          {lastRun && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last checked: {new Date(lastRun).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {approvalStats?.errors === 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        All systems operational
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        {approvalStats?.errors} errors detected
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reorders Tab */}
        <TabsContent value="reorders">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Suggestions</CardTitle>
              <CardDescription>
                Items that need to be reordered based on stock levels and demand
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reorderSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending reorder suggestions
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                      <TableHead className="text-right">Reorder Qty</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderSuggestions.slice(0, 20).map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="font-mono text-sm">
                          {suggestion.skuCode}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {suggestion.productName}
                        </TableCell>
                        <TableCell>{suggestion.brand}</TableCell>
                        <TableCell className="text-right">
                          {suggestion.currentStock}
                        </TableCell>
                        <TableCell className="text-right">
                          {suggestion.daysOfStock.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {suggestion.reorderQuantity}
                        </TableCell>
                        <TableCell>
                          <Badge className={getUrgencyColor(suggestion.urgency)}>
                            {suggestion.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(suggestion.estimatedCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-green-600"
                              onClick={() => handleProcessReorder(suggestion.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600"
                              onClick={() => handleProcessReorder(suggestion.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Configure rules for automatic approvals and reorders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Switch checked={rule.enabled} disabled />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getRuleTypeIcon(rule.type)}
                          {rule.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isDefault ? 'secondary' : 'default'}>
                          {rule.isDefault ? 'Default' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {rule.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
