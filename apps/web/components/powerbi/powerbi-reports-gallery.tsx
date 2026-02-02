'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Package,
  TrendingUp,
  Target,
  LineChart,
  LayoutDashboard,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { powerbiApi } from '@/lib/api-client';
import { PowerBIEmbed } from './powerbi-embed';

interface PowerBIReport {
  id: string;
  name: string;
  type: string;
  powerbiReportId: string;
  powerbiGroupId?: string;
  description?: string;
  isActive: boolean;
  thumbnail?: string;
}

interface PowerBIConfig {
  isConfigured: boolean;
  tenantId?: string;
  clientId?: string;
  availableReportTypes: string[];
}

const REPORT_TYPE_ICONS: Record<string, React.ReactNode> = {
  SALES_DASHBOARD: <BarChart3 className="h-8 w-8" />,
  INVENTORY_ANALYTICS: <Package className="h-8 w-8" />,
  OTB_OVERVIEW: <TrendingUp className="h-8 w-8" />,
  KPI_SCORECARD: <Target className="h-8 w-8" />,
  TREND_ANALYSIS: <LineChart className="h-8 w-8" />,
  CUSTOM: <LayoutDashboard className="h-8 w-8" />,
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  SALES_DASHBOARD: 'Sales Dashboard',
  INVENTORY_ANALYTICS: 'Inventory Analytics',
  OTB_OVERVIEW: 'OTB Overview',
  KPI_SCORECARD: 'KPI Scorecard',
  TREND_ANALYSIS: 'Trend Analysis',
  CUSTOM: 'Custom Report',
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  SALES_DASHBOARD: 'bg-blue-500',
  INVENTORY_ANALYTICS: 'bg-green-500',
  OTB_OVERVIEW: 'bg-purple-500',
  KPI_SCORECARD: 'bg-orange-500',
  TREND_ANALYSIS: 'bg-cyan-500',
  CUSTOM: 'bg-gray-500',
};

export function PowerBIReportsGallery() {
  const [config, setConfig] = useState<PowerBIConfig | null>(null);
  const [reports, setReports] = useState<PowerBIReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<PowerBIReport | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [configRes, reportsRes] = await Promise.all([
        powerbiApi.getConfig(),
        powerbiApi.getReports({
          type: typeFilter !== 'all' ? typeFilter : undefined,
          isActive: true,
        }),
      ]);

      if (configRes.data) setConfig(configRes.data as PowerBIConfig);
      if (reportsRes.data) setReports(reportsRes.data as PowerBIReport[]);
    } catch (error) {
      console.error('Failed to fetch Power BI data:', error);
      toast.error('Failed to load Power BI reports');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewReport = (report: PowerBIReport) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!config?.isConfigured) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Power BI Not Configured</h3>
          <p className="text-muted-foreground mb-4">
            Power BI integration requires configuration. Please contact your administrator to set up
            Power BI credentials.
          </p>
          <Badge variant="outline">Required: POWERBI_TENANT_ID, POWERBI_CLIENT_ID, POWERBI_CLIENT_SECRET</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex justify-between items-center">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            {config.availableReportTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {REPORT_TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary">
          {reports.length} report{reports.length !== 1 ? 's' : ''} available
        </Badge>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground">
              No Power BI reports have been configured yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:border-border/80 transition-shadow"
              onClick={() => handleViewReport(report)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`p-2 rounded-lg ${REPORT_TYPE_COLORS[report.type] || 'bg-gray-500'} text-white`}
                  >
                    {REPORT_TYPE_ICONS[report.type] || <LayoutDashboard className="h-8 w-8" />}
                  </div>
                  <Badge variant="outline">{REPORT_TYPE_LABELS[report.type] || report.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-1">{report.name}</CardTitle>
                {report.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {report.description}
                  </CardDescription>
                )}
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="flex-1 overflow-hidden">
              <PowerBIEmbed
                reportId={selectedReport.powerbiReportId}
                groupId={selectedReport.powerbiGroupId}
                height="calc(90vh - 120px)"
                showToolbar={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
