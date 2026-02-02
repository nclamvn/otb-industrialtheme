/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  GripVertical,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Type,
  Image as ImageIcon,
  Clock,
  Save,
  Settings,
  Copy,
  Eye,
  FileSpreadsheet,
  File,
  Presentation,
  LayoutGrid,
  Layers,
} from 'lucide-react';

interface ReportWidget {
  id: string;
  type: 'chart' | 'table' | 'text' | 'kpi' | 'image';
  title: string;
  config: any;
  width: 'full' | 'half' | 'third';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  schedule?: {
    frequency: string;
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function ReportBuilderPage() {
  const t = useTranslations('pages.analyticsReports');
  const tCommon = useTranslations('common');

  // Available widgets for drag-and-drop
  const availableWidgets = [
    { type: 'chart', subtype: 'bar', label: t('barChart'), icon: <BarChart3 className="h-4 w-4" /> },
    { type: 'chart', subtype: 'line', label: t('lineChart'), icon: <LineChart className="h-4 w-4" /> },
    { type: 'chart', subtype: 'pie', label: t('pieChart'), icon: <PieChart className="h-4 w-4" /> },
    { type: 'table', subtype: 'data', label: t('dataTable'), icon: <Table className="h-4 w-4" /> },
    { type: 'kpi', subtype: 'card', label: t('kpiCard'), icon: <LayoutGrid className="h-4 w-4" /> },
    { type: 'text', subtype: 'heading', label: t('textHeading'), icon: <Type className="h-4 w-4" /> },
    { type: 'image', subtype: 'logo', label: t('imageLogo'), icon: <ImageIcon className="h-4 w-4" /> },
  ];

  // Demo saved reports
  const savedReports: ReportTemplate[] = [
    {
      id: '1',
      name: t('weeklyPerformance'),
      description: t('keyMetricsTrends'),
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Revenue', config: {}, width: 'third' },
        { id: 'w2', type: 'kpi', title: 'Margin', config: {}, width: 'third' },
        { id: 'w3', type: 'kpi', title: 'Sell-Through', config: {}, width: 'third' },
        { id: 'w4', type: 'chart', title: 'Sales Trend', config: { type: 'line' }, width: 'half' },
        { id: 'w5', type: 'chart', title: 'Category Mix', config: { type: 'pie' }, width: 'half' },
      ],
      schedule: { frequency: 'weekly', recipients: ['team@company.com'] },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: t('monthlyExecutive'),
      description: t('comprehensiveOverview'),
      widgets: [
        { id: 'w1', type: 'text', title: 'Executive Summary', config: {}, width: 'full' },
        { id: 'w2', type: 'chart', title: 'Revenue by Brand', config: { type: 'bar' }, width: 'full' },
        { id: 'w3', type: 'table', title: 'Top Products', config: {}, width: 'half' },
        { id: 'w4', type: 'table', title: 'Inventory Status', config: {}, width: 'half' },
      ],
      schedule: { frequency: 'monthly', recipients: ['executives@company.com'] },
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: t('inventoryHealthReport'),
      description: t('stockTurnoverAlerts'),
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Weeks of Supply', config: {}, width: 'third' },
        { id: 'w2', type: 'kpi', title: 'Stock-Out Rate', config: {}, width: 'third' },
        { id: 'w3', type: 'kpi', title: 'Inventory Turn', config: {}, width: 'third' },
        { id: 'w4', type: 'table', title: 'Low Stock Items', config: {}, width: 'full' },
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const [reports, setReports] = useState(savedReports);
  const [activeReport, setActiveReport] = useState<ReportTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportDesc, setNewReportDesc] = useState('');
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [_showScheduleDialog, _setShowScheduleDialog] = useState(false);

  const handleCreateReport = () => {
    setIsCreating(true);
    setActiveReport(null);
    setWidgets([]);
    setNewReportName('');
    setNewReportDesc('');
  };

  const handleEditReport = (report: ReportTemplate) => {
    setActiveReport(report);
    setWidgets(report.widgets);
    setNewReportName(report.name);
    setNewReportDesc(report.description);
    setIsCreating(true);
  };

  const handleAddWidget = (widgetType: typeof availableWidgets[0]) => {
    const newWidget: ReportWidget = {
      id: `w-${Date.now()}`,
      type: widgetType.type as any,
      title: widgetType.label,
      config: { subtype: widgetType.subtype },
      width: 'half',
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  };

  const handleWidgetWidthChange = (widgetId: string, width: 'full' | 'half' | 'third') => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, width } : w))
    );
  };

  const handleSaveReport = () => {
    const report: ReportTemplate = {
      id: activeReport?.id || `r-${Date.now()}`,
      name: newReportName,
      description: newReportDesc,
      widgets,
      createdAt: activeReport?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (activeReport) {
      setReports((prev) => prev.map((r) => (r.id === activeReport.id ? report : r)));
    } else {
      setReports((prev) => [report, ...prev]);
    }

    setIsCreating(false);
    setActiveReport(null);
  };

  const handleExport = (_format: 'pdf' | 'excel' | 'ppt') => {
    // TODO: In production, this would trigger actual export
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-4 w-4" />;
      case 'table':
        return <Table className="h-4 w-4" />;
      case 'kpi':
        return <LayoutGrid className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isCreating ? (
            <Button onClick={handleCreateReport}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newReport')}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleSaveReport} disabled={!newReportName || widgets.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {t('saveReport')}
              </Button>
            </>
          )}
        </div>
      </div>

      {isCreating ? (
        /* Report Builder Interface */
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Widget Palette */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">{t('availableWidgets')}</CardTitle>
              <CardDescription>{t('dragOrClick')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableWidgets.map((widget, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAddWidget(widget)}
                >
                  {widget.icon}
                  {widget.label}
                  <Plus className="h-3 w-3 ml-auto" />
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Report Canvas */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('reportName')}</Label>
                    <Input
                      value={newReportName}
                      onChange={(e) => setNewReportName(e.target.value)}
                      placeholder={t('enterReportName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tCommon('details')}</Label>
                    <Input
                      value={newReportDesc}
                      onChange={(e) => setNewReportDesc(e.target.value)}
                      placeholder={t('briefDescription')}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">{t('noWidgetsAdded')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('clickWidgetsToAdd')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={`border rounded-lg p-4 ${
                        widget.width === 'full'
                          ? 'w-full'
                          : widget.width === 'half'
                          ? 'w-full md:w-[calc(50%-0.5rem)] md:inline-block'
                          : 'w-full md:w-[calc(33.333%-0.5rem)] md:inline-block'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          {getWidgetIcon(widget.type)}
                          <span className="font-medium text-sm">{widget.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {widget.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Select
                            value={widget.width}
                            onValueChange={(v) => handleWidgetWidthChange(widget.id, v as any)}
                          >
                            <SelectTrigger className="h-7 w-20 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="third">1/3</SelectItem>
                              <SelectItem value="half">1/2</SelectItem>
                              <SelectItem value="full">Full</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRemoveWidget(widget.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted rounded h-24 flex items-center justify-center text-muted-foreground text-sm">
                        {widget.type === 'chart' && t('chartPreview')}
                        {widget.type === 'table' && t('tablePreview')}
                        {widget.type === 'kpi' && t('kpiCardPreview')}
                        {widget.type === 'text' && t('textBlockPreview')}
                        {widget.type === 'image' && t('imagePreview')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Report List */
        <Tabs defaultValue="my-reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-reports">{t('myReports')}</TabsTrigger>
            <TabsTrigger value="scheduled">{t('scheduled')}</TabsTrigger>
            <TabsTrigger value="templates">{t('templates')}</TabsTrigger>
          </TabsList>

          <TabsContent value="my-reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <Card key={report.id} className="hover:border-border/80 transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </div>
                      {report.schedule && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {report.schedule.frequency}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      {report.widgets.slice(0, 4).map((w) => (
                        <div
                          key={w.id}
                          className="h-8 w-8 rounded bg-muted flex items-center justify-center"
                        >
                          {getWidgetIcon(w.type)}
                        </div>
                      ))}
                      {report.widgets.length > 4 && (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{report.widgets.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      {t('updated')} {report.updatedAt.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditReport(report)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {tCommon('edit')}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        {t('preview')}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            {tCommon('export')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('exportReport')}</DialogTitle>
                            <DialogDescription>
                              {t('chooseFormat')} &quot;{report.name}&quot;
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => handleExport('pdf')}
                            >
                              <File className="h-5 w-5 mr-3 text-red-500" />
                              <div className="text-left">
                                <div className="font-medium">{t('pdfDocument')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t('bestForPrinting')}
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => handleExport('excel')}
                            >
                              <FileSpreadsheet className="h-5 w-5 mr-3 text-green-500" />
                              <div className="text-left">
                                <div className="font-medium">{t('excelSpreadsheet')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t('bestForAnalysis')}
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => handleExport('ppt')}
                            >
                              <Presentation className="h-5 w-5 mr-3 text-orange-500" />
                              <div className="text-left">
                                <div className="font-medium">{t('powerPoint')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t('bestForPresentations')}
                                </div>
                              </div>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('scheduledReports')}</CardTitle>
                <CardDescription>
                  {t('autoGeneratedReports')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports
                    .filter((r) => r.schedule)
                    .map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.schedule?.recipients.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">
                            {report.schedule?.frequency}
                          </Badge>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  name: t('salesPerformance'),
                  description: t('revenueUnits'),
                  widgets: 6,
                },
                {
                  name: t('inventoryHealth'),
                  description: t('stockLevelsAlerts'),
                  widgets: 5,
                },
                {
                  name: t('categoryPerformance'),
                  description: t('categoryPerformance'),
                  widgets: 4,
                },
                {
                  name: t('brandComparison'),
                  description: t('crossBrandMetrics'),
                  widgets: 5,
                },
                {
                  name: t('executiveSummary'),
                  description: t('highLevelKpis'),
                  widgets: 8,
                },
                {
                  name: t('forecastReport'),
                  description: t('predictionsTrends'),
                  widgets: 4,
                },
              ].map((template, i) => (
                <Card key={i} className="cursor-pointer hover:border-border/80 transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {template.widgets} {t('widgets')}
                      </span>
                      <Button variant="outline" size="sm">
                        <Copy className="h-3 w-3 mr-1" />
                        {t('useTemplate')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
