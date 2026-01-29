'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  ArrowLeft,
  AlertTriangle,
  Check,
  Eye,
  Filter,
  Bell,
  BellOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WSSIAlert {
  id: string;
  alertType: string;
  severity: string;
  thresholdValue: number;
  actualValue: number;
  title: string;
  message: string;
  recommendation: string | null;
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: { id: string; name: string; email: string } | null;
  resolutionNotes: string | null;
  createdAt: string;
  wssiRecord: {
    id: string;
    year: number;
    weekNumber: number;
    brand: { id: string; name: string; code: string };
    category: { id: string; name: string; code: string } | null;
  };
}

export default function WSSIAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<WSSIAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'acknowledged'>('active');

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Acknowledge dialog
  const [selectedAlert, setSelectedAlert] = useState<WSSIAlert | null>(null);
  const [ackNotes, setAckNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.append('acknowledged', activeTab === 'acknowledged' ? 'true' : 'false');
      params.append('page', page.toString());
      params.append('limit', '20');
      if (severityFilter !== 'all') params.append('severity', severityFilter);

      const response = await fetch(`/api/v1/wssi/alerts?${params.toString()}`);
      const data = await response.json();

      if (data.success !== false) {
        setAlerts(data.data || []);
        setTotal(data.meta?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, severityFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/wssi/alerts/${selectedAlert.id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: ackNotes }),
      });

      const result = await response.json();

      if (result.id) {
        toast.success('Alert acknowledged successfully');
        setSelectedAlert(null);
        setAckNotes('');
        fetchAlerts();
      } else {
        toast.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
      toast.error('Failed to acknowledge alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const getAlertTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      LOW_STOCK: 'Low Stock',
      HIGH_STOCK: 'High Stock',
      SALES_BELOW_PLAN: 'Sales Below Plan',
      SALES_ABOVE_PLAN: 'Sales Above Plan',
      INTAKE_DELAYED: 'Intake Delayed',
      STOCKOUT_RISK: 'Stockout Risk',
      MARKDOWN_NEEDED: 'Markdown Needed',
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const columns: ColumnDef<WSSIAlert>[] = [
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      accessorKey: 'alertType',
      header: 'Type',
      cell: ({ row }) => getAlertTypeBadge(row.original.alertType),
    },
    {
      accessorKey: 'title',
      header: 'Alert',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {row.original.message}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'wssiRecord',
      header: 'WSSI Record',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            W{row.original.wssiRecord.weekNumber}, {row.original.wssiRecord.year}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.wssiRecord.brand.name}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'actualValue',
      header: 'Value',
      cell: ({ row }) => (
        <div className="text-right">
          <p className="font-medium">{row.original.actualValue.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">
            Threshold: {row.original.thresholdValue.toFixed(1)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const alert = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/wssi/${alert.wssiRecord.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!alert.isAcknowledged && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlert(alert)}
              >
                <Check className="mr-1 h-4 w-4" />
                Ack
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Stats
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WSSI Alerts"
        description="Monitor and manage inventory alerts across all WSSI records"
      >
        <Button variant="outline" onClick={() => router.push('/wssi')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to WSSI
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <Bell className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">{total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'active' ? 'Active alerts' : 'Acknowledged alerts'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-red-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-red-600">{criticalCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-orange-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-orange-600">{highCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Review soon</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <BellOff className="absolute -bottom-4 -right-4 h-32 w-32 text-gray-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Other</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-gray-600">
              {alerts.length - criticalCount - highCount}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Medium & low priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'acknowledged')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Bell className="h-4 w-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="acknowledged" className="gap-2">
              <Check className="h-4 w-4" />
              Acknowledged
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchAlerts}>
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>

        <TabsContent value="active" className="mt-4">
          <DataTable
            columns={columns}
            data={alerts}
            searchKey="title"
            searchPlaceholder="Search alerts..."
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="acknowledged" className="mt-4">
          <DataTable
            columns={columns}
            data={alerts}
            searchKey="title"
            searchPlaceholder="Search alerts..."
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Acknowledge Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              {selectedAlert?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm">{selectedAlert?.message}</p>
              {selectedAlert?.recommendation && (
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Recommendation:</strong> {selectedAlert.recommendation}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="What action was taken or why is this being acknowledged..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={isSubmitting}>
              {isSubmitting ? 'Acknowledging...' : 'Acknowledge Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
