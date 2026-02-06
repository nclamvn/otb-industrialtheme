'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Calendar,
  BarChart3,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

// Report types
const reportTypes = [
  {
    id: 'budget-summary',
    nameKey: 'budgetSummary',
    descKey: 'budgetSummaryDesc',
    icon: DollarSign,
    formats: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'otb-analysis',
    nameKey: 'otbAnalysis',
    descKey: 'otbAnalysisDesc',
    icon: BarChart3,
    formats: ['pdf', 'excel'],
  },
  {
    id: 'sku-performance',
    nameKey: 'skuPerformance',
    descKey: 'skuPerformanceDesc',
    icon: Package,
    formats: ['excel', 'csv'],
  },
  {
    id: 'approval-status',
    nameKey: 'approvalStatus',
    descKey: 'approvalStatusDesc',
    icon: CheckCircle2,
    formats: ['pdf', 'excel'],
  },
  {
    id: 'user-activity',
    nameKey: 'userActivity',
    descKey: 'userActivityDesc',
    icon: Users,
    formats: ['excel', 'csv'],
  },
];

// Demo recent exports
const recentExports = [
  {
    id: '1',
    name: 'Budget Summary - SS25',
    type: 'budget-summary',
    format: 'pdf',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    fileSize: '245 KB',
  },
  {
    id: '2',
    name: 'OTB Analysis - Nike',
    type: 'otb-analysis',
    format: 'excel',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    fileSize: '1.2 MB',
  },
  {
    id: '3',
    name: 'SKU Performance - All Brands',
    type: 'sku-performance',
    format: 'csv',
    status: 'processing',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    fileSize: '-',
  },
  {
    id: '4',
    name: 'Approval Status - January',
    type: 'approval-status',
    format: 'pdf',
    status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    fileSize: '-',
    error: 'Data fetch timeout',
  },
];

// Scheduled reports - will be translated in component

const statusIcons = {
  completed: CheckCircle2,
  processing: Clock,
  failed: AlertCircle,
};

const statusColors = {
  completed: 'text-green-600',
  processing: 'text-blue-600',
  failed: 'text-red-600',
};

const formatIcons = {
  pdf: FileText,
  excel: FileSpreadsheet,
  csv: File,
};

export default function ReportsPage() {
  const t = useTranslations('pages.reports');
  const tCommon = useTranslations('common');
  const tForms = useTranslations('forms');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const [selectedSeason, setSelectedSeason] = useState('ss25');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  // Translated scheduled reports
  const scheduledReports = useMemo(() => [
    {
      id: '1',
      name: t('weeklyBudgetSummary'),
      type: 'budget-summary',
      schedule: t('scheduleEveryMonday'),
      scheduleType: t('weekly'),
      format: 'pdf',
      recipients: ['finance@dafc.com'],
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      isActive: true,
    },
    {
      id: '2',
      name: t('monthlyOtbReport'),
      type: 'otb-analysis',
      schedule: t('scheduleFirstDayOfMonth'),
      scheduleType: t('monthly'),
      format: 'excel',
      recipients: ['planning@dafc.com', 'management@dafc.com'],
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 23),
      isActive: true,
    },
  ], [t]);

  const handleGenerateReport = async (reportId: string, format: string) => {
    setGeneratingReport(reportId);
    toast.info(t('generating') || 'Generating report...');

    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(null);
      toast.success(`${tCommon('success')}! Format: ${format.toUpperCase()}`);
    }, 2000);
  };

  const handleDownload = (_exportId: string) => {
    toast.success(t('downloadStarted'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('description')}
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">{t('generateReport')}</TabsTrigger>
          <TabsTrigger value="recent">{t('recentExports')}</TabsTrigger>
          <TabsTrigger value="scheduled">{t('scheduledReports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reportFilters')}</CardTitle>
              <CardDescription>{t('selectParameters')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tForms('selectSeason')}</label>
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger>
                      <SelectValue placeholder={tForms('selectSeason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ss25">Spring/Summer 2025</SelectItem>
                      <SelectItem value="fw25">Fall/Winter 2025</SelectItem>
                      <SelectItem value="ss24">Spring/Summer 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tForms('selectBrand')}</label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder={tForms('selectBrand')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tCommon('all')}</SelectItem>
                      <SelectItem value="nike">Nike</SelectItem>
                      <SelectItem value="adidas">Adidas</SelectItem>
                      <SelectItem value="puma">Puma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{tForms('selectType')}</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder={tForms('selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tCommon('all')}</SelectItem>
                      <SelectItem value="month">{t('thisMonth')}</SelectItem>
                      <SelectItem value="quarter">{t('thisQuarter')}</SelectItem>
                      <SelectItem value="year">{t('thisYear')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report, index) => {
              const Icon = report.icon;
              const isGenerating = generatingReport === report.id;

              // Color mapping for each report type
              const colorClasses = [
                { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600' },
                { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600' },
                { border: 'border-l-violet-500', bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-600' },
                { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600' },
                { border: 'border-l-rose-500', bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-600' },
              ];
              const colors = colorClasses[index % colorClasses.length];

              return (
                <div
                  key={report.id}
                  className={cn(
                    'relative overflow-hidden rounded-xl border border-border bg-card',
                    'hover:border-border/80 transition-all duration-200',
                    'border-l-4 p-4',
                    colors.border
                  )}
                >
                  {/* Watermark Icon */}
                  <div className="absolute -right-4 -bottom-4 pointer-events-none">
                    <Icon className={cn('w-20 h-20 opacity-[0.08]', colors.text)} />
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                      {t(report.nameKey)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 pr-10">
                      {t(report.descKey)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.formats.map((format) => {
                      const FormatIcon = formatIcons[format as keyof typeof formatIcons];
                      return (
                        <Button
                          key={format}
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateReport(report.id, format)}
                          disabled={isGenerating}
                        >
                          <FormatIcon className="h-4 w-4 mr-1" />
                          {format.toUpperCase()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('recentExports')}</CardTitle>
              <CardDescription>{t('yourReports')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reportName')}</TableHead>
                      <TableHead>{t('format')}</TableHead>
                      <TableHead>{tForms('status')}</TableHead>
                      <TableHead>{t('size')}</TableHead>
                      <TableHead>{t('generated')}</TableHead>
                      <TableHead className="text-right">{tCommon('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExports.map((export_) => {
                      const StatusIcon = statusIcons[export_.status as keyof typeof statusIcons];
                      const statusColor = statusColors[export_.status as keyof typeof statusColors];
                      const FormatIcon = formatIcons[export_.format as keyof typeof formatIcons];

                      return (
                        <TableRow key={export_.id}>
                          <TableCell className="font-medium">{export_.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FormatIcon className="h-4 w-4" />
                              {export_.format.toUpperCase()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-1 ${statusColor}`}>
                              <StatusIcon className="h-4 w-4" />
                              <span className="capitalize">
                                {export_.status === 'completed' ? tCommon('completed') :
                                 export_.status === 'processing' ? tCommon('loading') :
                                 tCommon('failed')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{export_.fileSize}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(export_.createdAt, { addSuffix: true, locale: dateLocale })}
                          </TableCell>
                          <TableCell className="text-right">
                            {export_.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(export_.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            {export_.status === 'failed' && (
                              <Button variant="ghost" size="sm">
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('scheduledReports')}</CardTitle>
                  <CardDescription>{t('automatedGeneration')}</CardDescription>
                </div>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('scheduleNew')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reportName')}</TableHead>
                      <TableHead>{t('schedule')}</TableHead>
                      <TableHead>{t('format')}</TableHead>
                      <TableHead>{t('recipients')}</TableHead>
                      <TableHead>{t('lastRun')}</TableHead>
                      <TableHead>{t('nextRun')}</TableHead>
                      <TableHead>{tForms('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map((report) => {
                      const FormatIcon = formatIcons[report.format as keyof typeof formatIcons];

                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell>{report.schedule}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FormatIcon className="h-4 w-4" />
                              {report.format.toUpperCase()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {report.recipients.map((email, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {email}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(report.lastRun, { addSuffix: true, locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(report.nextRun, { addSuffix: true, locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={report.isActive ? 'default' : 'secondary'}>
                              {report.isActive ? tCommon('active') : t('paused')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
