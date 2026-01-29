'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingDown,
  TrendingUp,
  Package,
  DollarSign,
  Zap,
  Calendar,
  Check,
  X,
  RefreshCw,
  Loader2,
  ChevronRight,
  Target,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  prediction?: string;
  probability?: number;
  timeframe?: string;
  impact?: Record<string, unknown>;
  recommendedActions?: string[];
  entity?: {
    type: string;
    id: string;
    name: string;
  };
  metric?: {
    current: number;
    threshold: number;
    unit: string;
  };
  createdAt: string;
  actionRequired?: boolean;
}

interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  total: number;
}

const ALERT_TYPE_INFO: Record<
  string,
  { icon: React.ReactNode; color: string; label: string; labelVi: string }
> = {
  STOCKOUT: {
    icon: <Package className="h-4 w-4" />,
    color: 'text-red-500',
    label: 'Stockout Risk',
    labelVi: 'Rủi ro hết hàng',
  },
  OVERSTOCK: {
    icon: <Package className="h-4 w-4" />,
    color: 'text-orange-500',
    label: 'Overstock Risk',
    labelVi: 'Rủi ro tồn kho',
  },
  TREND_REVERSAL: {
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-yellow-500',
    label: 'Trend Reversal',
    labelVi: 'Đảo chiều xu hướng',
  },
  MARGIN_DECLINE: {
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-purple-500',
    label: 'Margin Decline',
    labelVi: 'Suy giảm biên lợi',
  },
  DEMAND_SPIKE: {
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-500',
    label: 'Demand Spike',
    labelVi: 'Tăng vọt nhu cầu',
  },
  SEASONAL: {
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-blue-500',
    label: 'Seasonal',
    labelVi: 'Theo mùa',
  },
  stockout_risk: {
    icon: <Package className="h-4 w-4" />,
    color: 'text-red-500',
    label: 'Stockout Risk',
    labelVi: 'Rủi ro hết hàng',
  },
  overstock_risk: {
    icon: <Package className="h-4 w-4" />,
    color: 'text-orange-500',
    label: 'Overstock Risk',
    labelVi: 'Rủi ro tồn kho',
  },
  otb_overrun: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-red-500',
    label: 'OTB Overrun',
    labelVi: 'Vượt OTB',
  },
  approval_pending: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-blue-500',
    label: 'Approval Pending',
    labelVi: 'Chờ phê duyệt',
  },
  kpi_threshold: {
    icon: <Target className="h-4 w-4" />,
    color: 'text-yellow-500',
    label: 'KPI Alert',
    labelVi: 'Cảnh báo KPI',
  },
  margin_decline: {
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-purple-500',
    label: 'Margin Decline',
    labelVi: 'Suy giảm biên lợi',
  },
};

export default function PredictiveAlertsPage() {
  const locale = useLocale();
  const t = useTranslations('pages.predictiveAlerts');
  const tCommon = useTranslations('common');
  const [language, setLanguage] = useState<'en' | 'vi'>(locale === 'vi' ? 'vi' : 'en');
  const [activeTab, setActiveTab] = useState('predictive');
  const [loading, setLoading] = useState(false);
  const [realTimeAlerts, setRealTimeAlerts] = useState<Alert[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>({
    critical: 0,
    warning: 0,
    info: 0,
    total: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  // Sync language with global locale
  useEffect(() => {
    setLanguage(locale === 'vi' ? 'vi' : 'en');
  }, [locale]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/predictive-alerts');
      if (res.ok) {
        const data = await res.json();
        setRealTimeAlerts(data.realTimeAlerts || []);
        setPredictiveAlerts(data.predictiveAlerts || []);
        setSummary(data.summary || { critical: 0, warning: 0, info: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = async (
    alert: Alert,
    action: 'acknowledge' | 'dismiss' | 'resolve'
  ) => {
    try {
      const res = await fetch('/api/ai/predictive-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          alertId: alert.id,
        }),
      });

      if (res.ok) {
        // Remove from list based on action
        if (action === 'dismiss' || action === 'resolve') {
          setPredictiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          setRealTimeAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Alert action failed:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-red-500/10 text-red-500 border-red-500/20',
      warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[severity.toLowerCase()] || colors.info;
  };

  const filterAlerts = (alerts: Alert[]) => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter(
      (a) => a.severity.toLowerCase() === severityFilter.toLowerCase()
    );
  };

  const currentAlerts =
    activeTab === 'predictive' ? predictiveAlerts : realTimeAlerts;
  const filteredAlerts = filterAlerts(currentAlerts);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('title')}
            </h1>
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            {language === 'vi' ? 'Tiếng Việt' : 'English'}
          </Button>
          <Button onClick={fetchAlerts} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {tCommon('refresh')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-red-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('critical')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-red-600">{summary.critical}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('criticalAlerts')}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <AlertCircle className="absolute -bottom-4 -right-4 h-32 w-32 text-yellow-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('warning')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-yellow-600">{summary.warning}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('warningAlerts')}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <Info className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight text-blue-600">{summary.info}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('infoAlerts')}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <Bell className="absolute -bottom-4 -right-4 h-32 w-32 text-primary/10" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tCommon('all')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight">{summary.total}</div>
            <p className="text-sm text-muted-foreground mt-1">{t('totalAlerts')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="predictive" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t('predictive')}
                      <Badge variant="secondary" className="ml-1">
                        {predictiveAlerts.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="realtime" className="gap-2">
                      <Zap className="h-4 w-4" />
                      {t('realtime')}
                      <Badge variant="secondary" className="ml-1">
                        {realTimeAlerts.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {tCommon('all')}
                    </SelectItem>
                    <SelectItem value="critical">
                      {t('critical')}
                    </SelectItem>
                    <SelectItem value="warning">
                      {t('warning')}
                    </SelectItem>
                    <SelectItem value="info">
                      {t('info')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t('noAlerts')}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredAlerts.map((alert) => {
                        const typeInfo = ALERT_TYPE_INFO[alert.type] || {
                          icon: <AlertCircle className="h-4 w-4" />,
                          color: 'text-gray-500',
                          label: alert.type,
                          labelVi: alert.type,
                        };

                        return (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className={cn(
                              'p-4 rounded-lg border cursor-pointer transition-colors',
                              selectedAlert?.id === alert.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-muted/50'
                            )}
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                                  getSeverityColor(alert.severity)
                                )}
                              >
                                {getSeverityIcon(alert.severity)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="outline" className={typeInfo.color}>
                                    {typeInfo.icon}
                                    <span className="ml-1">
                                      {language === 'vi'
                                        ? typeInfo.labelVi
                                        : typeInfo.label}
                                    </span>
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={getSeverityColor(alert.severity)}
                                  >
                                    {alert.severity}
                                  </Badge>
                                  {alert.timeframe && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {alert.timeframe}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-medium">{alert.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {alert.description}
                                </p>
                              </div>

                              {alert.probability && (
                                <div className="text-right shrink-0">
                                  <p className="text-xs text-muted-foreground">
                                    {t('probability')}
                                  </p>
                                  <p className="font-semibold">
                                    {Math.round(alert.probability * 100)}%
                                  </p>
                                </div>
                              )}

                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alert Detail */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>
                {t('alertDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAlert ? (
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={getSeverityColor(selectedAlert.severity)}
                      >
                        {selectedAlert.severity}
                      </Badge>
                      {selectedAlert.timeframe && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedAlert.timeframe}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{selectedAlert.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAlert.description}
                    </p>
                  </div>

                  {/* Prediction */}
                  {selectedAlert.prediction && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {t('prediction')}
                      </p>
                      <p className="text-sm font-medium">{selectedAlert.prediction}</p>
                    </div>
                  )}

                  {/* Probability */}
                  {selectedAlert.probability && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {t('probability')}
                        </span>
                        <span className="font-medium">
                          {Math.round(selectedAlert.probability * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={selectedAlert.probability * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Impact */}
                  {selectedAlert.impact && Object.keys(selectedAlert.impact).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t('impact')}
                      </p>
                      <div className="space-y-2">
                        {Object.entries(selectedAlert.impact).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-medium">
                              {typeof value === 'number'
                                ? value > 1000
                                  ? `$${(value / 1000).toFixed(0)}K`
                                  : value
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {selectedAlert.recommendedActions &&
                    selectedAlert.recommendedActions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t('recommendedActions')}
                        </p>
                        <ul className="space-y-2">
                          {selectedAlert.recommendedActions.map((action, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleAlertAction(selectedAlert, 'acknowledge')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('acknowledge')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleAlertAction(selectedAlert, 'dismiss')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {t('selectAlert')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
