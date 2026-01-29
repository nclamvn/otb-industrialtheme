'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  Package,
  BarChart3,
  AlertTriangle,
  Check,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface WSSIRecordDetail {
  id: string;
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  division: { id: string; name: string; code: string };
  brand: { id: string; name: string; code: string };
  category: { id: string; name: string; code: string } | null;
  subcategory: { id: string; name: string; code: string } | null;
  season: { id: string; name: string; code: string };
  location: { id: string; name: string; code: string } | null;
  openingStockValue: number;
  closingStockValue: number;
  openingStockUnits: number;
  closingStockUnits: number;
  salesPlanValue: number;
  salesPlanUnits: number;
  salesActualValue: number;
  salesActualUnits: number;
  intakePlanValue: number;
  intakePlanUnits: number;
  intakeActualValue: number;
  intakeActualUnits: number;
  markdownPlanValue: number | null;
  markdownActualValue: number | null;
  weeksOfCover: number;
  salesVariancePct: number;
  intakeVariancePct: number;
  sellThroughPct: number;
  forecastType: string;
  reforecastedAt: string | null;
  reforecastReason: string | null;
  reforecastedBy: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string } | null;
  createdAt: string;
  alerts: Array<{
    id: string;
    alertType: string;
    severity: string;
    title: string;
    message: string;
    recommendation: string | null;
    isAcknowledged: boolean;
    acknowledgedAt: string | null;
    acknowledgedBy: { id: string; name: string; email: string } | null;
    resolutionNotes: string | null;
    createdAt: string;
  }>;
}

export default function WSSIDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReforecastMode = searchParams.get('reforecast') === 'true';

  const [record, setRecord] = useState<WSSIRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Reforecast form state
  const [reforecastOpen, setReforecastOpen] = useState(isReforecastMode);
  const [reforecastReason, setReforecastReason] = useState('');
  const [newSalesPlan, setNewSalesPlan] = useState('');
  const [newIntakePlan, setNewIntakePlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert acknowledgment
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [ackNotes, setAckNotes] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [params.id]);

  const fetchRecord = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/wssi/${params.id}`);
      const data = await response.json();

      if (data.success !== false) {
        setRecord(data);
        setNewSalesPlan(data.salesPlanValue?.toString() || '');
        setNewIntakePlan(data.intakePlanValue?.toString() || '');
      } else {
        toast.error('Failed to load WSSI record');
      }
    } catch (error) {
      console.error('Error fetching WSSI record:', error);
      toast.error('Failed to load WSSI record');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReforecast = async () => {
    if (!record || !reforecastReason.trim()) {
      toast.error('Please provide a reason for reforecast');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/wssi/bulk-reforecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reforecastReason,
          records: [{
            wssiRecordId: record.id,
            salesPlanValue: parseFloat(newSalesPlan) || undefined,
            intakePlanValue: parseFloat(newIntakePlan) || undefined,
          }],
        }),
      });

      const result = await response.json();

      if (result.updated) {
        toast.success('Reforecast saved successfully');
        setReforecastOpen(false);
        fetchRecord();
      } else {
        toast.error(result.error || 'Failed to save reforecast');
      }
    } catch (error) {
      console.error('Reforecast error:', error);
      toast.error('Failed to save reforecast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/wssi/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: ackNotes }),
      });

      const result = await response.json();

      if (result.id) {
        toast.success('Alert acknowledged');
        setSelectedAlert(null);
        setAckNotes('');
        fetchRecord();
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance >= 10) return 'text-green-600';
    if (variance <= -10) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">WSSI record not found</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const activeAlerts = record.alerts.filter(a => !a.isAcknowledged);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`WSSI Week ${record.weekNumber}, ${record.year}`}
        description={`${record.brand.name} - ${record.season.code}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => setReforecastOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reforecast
          </Button>
        </div>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <BarChart3 className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales Performance</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-3xl font-bold tracking-tight ${getVarianceColor(Number(record.salesVariancePct))}`}>
              {Number(record.salesVariancePct) > 0 ? '+' : ''}{Number(record.salesVariancePct).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Actual: ${Number(record.salesActualValue).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-purple-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weeks of Cover</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-purple-600">
              {Number(record.weeksOfCover).toFixed(1)} wks
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Closing Stock: ${Number(record.closingStockValue).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sell-Through Rate</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-green-600">
              {Number(record.sellThroughPct).toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Units Sold: {record.salesActualUnits.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <Bell className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className={`text-3xl font-bold tracking-tight ${activeAlerts.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {activeAlerts.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeAlerts.length > 0 ? 'Needs attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Details</TabsTrigger>
          <TabsTrigger value="stock">Stock & Intake</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{activeAlerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Division</span>
                  <span className="font-medium">{record.division.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand</span>
                  <span className="font-medium">{record.brand.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{record.category?.name || 'All'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Season</span>
                  <span className="font-medium">{record.season.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{record.location?.name || 'All Locations'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Week</span>
                  <span className="font-medium">W{record.weekNumber}, {record.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Week Start</span>
                  <span className="font-medium">{new Date(record.weekStartDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Week End</span>
                  <span className="font-medium">{new Date(record.weekEndDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Forecast Type</span>
                  <Badge className={record.forecastType === 'REFORECAST' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                    {record.forecastType}
                  </Badge>
                </div>
                {record.reforecastedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Reforecasted</span>
                    <span className="font-medium">{new Date(record.reforecastedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">Value</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">${Number(record.salesPlanValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual</span>
                    <span className="font-medium">${Number(record.salesActualValue).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={`font-medium ${getVarianceColor(Number(record.salesVariancePct))}`}>
                      {Number(record.salesVariancePct) > 0 ? '+' : ''}{Number(record.salesVariancePct).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Units</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{record.salesPlanUnits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual</span>
                    <span className="font-medium">{record.salesActualUnits.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difference</span>
                    <span className="font-medium">
                      {(record.salesActualUnits - record.salesPlanUnits).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opening Stock Value</span>
                    <span className="font-medium">${Number(record.openingStockValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opening Stock Units</span>
                    <span className="font-medium">{record.openingStockUnits.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closing Stock Value</span>
                    <span className="font-medium">${Number(record.closingStockValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closing Stock Units</span>
                    <span className="font-medium">{record.closingStockUnits.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Intake</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intake Plan Value</span>
                    <span className="font-medium">${Number(record.intakePlanValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intake Actual Value</span>
                    <span className="font-medium">${Number(record.intakeActualValue).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={`font-medium ${getVarianceColor(Number(record.intakeVariancePct))}`}>
                      {Number(record.intakeVariancePct) > 0 ? '+' : ''}{Number(record.intakeVariancePct).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {record.alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">No Alerts</h3>
                <p className="text-muted-foreground">This WSSI record has no alerts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {record.alerts.map((alert) => (
                <Card key={alert.id} className={alert.isAcknowledged ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'CRITICAL' ? 'text-red-500' :
                          alert.severity === 'HIGH' ? 'text-orange-500' :
                          alert.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <CardTitle className="text-base">{alert.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        {alert.isAcknowledged && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <Check className="mr-1 h-3 w-3" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{alert.message}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {alert.recommendation && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm font-medium">Recommendation</p>
                        <p className="text-sm text-muted-foreground">{alert.recommendation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      {!alert.isAcknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAlert(alert.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Acknowledge
                        </Button>
                      )}
                      {alert.isAcknowledged && alert.acknowledgedBy && (
                        <span>
                          Acknowledged by {alert.acknowledgedBy.name} on{' '}
                          {new Date(alert.acknowledgedAt!).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {alert.resolutionNotes && (
                      <div className="text-sm">
                        <span className="font-medium">Notes: </span>
                        <span className="text-muted-foreground">{alert.resolutionNotes}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reforecast Dialog */}
      <Dialog open={reforecastOpen} onOpenChange={setReforecastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reforecast WSSI</DialogTitle>
            <DialogDescription>
              Adjust the plan values for Week {record.weekNumber}, {record.year}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salesPlan">New Sales Plan Value</Label>
              <Input
                id="salesPlan"
                type="number"
                value={newSalesPlan}
                onChange={(e) => setNewSalesPlan(e.target.value)}
                placeholder="Enter new sales plan value"
              />
              <p className="text-xs text-muted-foreground">
                Current: ${Number(record.salesPlanValue).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intakePlan">New Intake Plan Value</Label>
              <Input
                id="intakePlan"
                type="number"
                value={newIntakePlan}
                onChange={(e) => setNewIntakePlan(e.target.value)}
                placeholder="Enter new intake plan value"
              />
              <p className="text-xs text-muted-foreground">
                Current: ${Number(record.intakePlanValue).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reforecast *</Label>
              <Textarea
                id="reason"
                value={reforecastReason}
                onChange={(e) => setReforecastReason(e.target.value)}
                placeholder="Explain why this reforecast is needed..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReforecastOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReforecast} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Reforecast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acknowledge Alert Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Mark this alert as acknowledged and add resolution notes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ackNotes">Resolution Notes (Optional)</Label>
              <Textarea
                id="ackNotes"
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="What action was taken or why is this alert being acknowledged..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button onClick={() => selectedAlert && handleAcknowledgeAlert(selectedAlert)}>
              Acknowledge Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
