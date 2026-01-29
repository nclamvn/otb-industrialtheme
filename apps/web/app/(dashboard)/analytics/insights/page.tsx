'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Activity,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Clock,
  Sparkles,
  Shield,
  Target,
  Zap,
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'RECOMMENDATION' | 'INSIGHT';
  category: string;
  title: string;
  summary: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendations: { action: string; priority: 'high' | 'medium' | 'low' }[];
  createdAt: Date;
  status: 'new' | 'viewed' | 'actioned' | 'dismissed';
}

export default function InsightsPage() {
  const t = useTranslations('pages.analyticsInsights');

  // Generate translated demo insights
  const demoInsights: Insight[] = useMemo(() => [
    {
      id: '1',
      type: 'WARNING' as const,
      category: 'inventory',
      title: t('demoInsights.excessInventory.title'),
      summary: t('demoInsights.excessInventory.summary'),
      description: t('demoInsights.excessInventory.description'),
      impact: 'high' as const,
      confidence: 0.92,
      recommendations: [
        { action: t('demoInsights.excessInventory.action1'), priority: 'high' as const },
        { action: t('demoInsights.excessInventory.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'new' as const,
    },
    {
      id: '2',
      type: 'OPPORTUNITY' as const,
      category: 'performance',
      title: t('demoInsights.strongRevenue.title'),
      summary: t('demoInsights.strongRevenue.summary'),
      description: t('demoInsights.strongRevenue.description'),
      impact: 'medium' as const,
      confidence: 0.9,
      recommendations: [
        { action: t('demoInsights.strongRevenue.action1'), priority: 'high' as const },
        { action: t('demoInsights.strongRevenue.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'viewed' as const,
    },
    {
      id: '3',
      type: 'WARNING' as const,
      category: 'inventory',
      title: t('demoInsights.stockOut.title'),
      summary: t('demoInsights.stockOut.summary'),
      description: t('demoInsights.stockOut.description'),
      impact: 'medium' as const,
      confidence: 0.95,
      recommendations: [
        { action: t('demoInsights.stockOut.action1'), priority: 'high' as const },
        { action: t('demoInsights.stockOut.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'new' as const,
    },
    {
      id: '4',
      type: 'RECOMMENDATION' as const,
      category: 'optimization',
      title: t('demoInsights.markdownTiming.title'),
      summary: t('demoInsights.markdownTiming.summary'),
      description: t('demoInsights.markdownTiming.description'),
      impact: 'medium' as const,
      confidence: 0.85,
      recommendations: [
        { action: t('demoInsights.markdownTiming.action1'), priority: 'medium' as const },
        { action: t('demoInsights.markdownTiming.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'viewed' as const,
    },
    {
      id: '5',
      type: 'INSIGHT' as const,
      category: 'trend',
      title: t('demoInsights.seasonalPattern.title'),
      summary: t('demoInsights.seasonalPattern.summary'),
      description: t('demoInsights.seasonalPattern.description'),
      impact: 'low' as const,
      confidence: 0.78,
      recommendations: [
        { action: t('demoInsights.seasonalPattern.action1'), priority: 'medium' as const },
        { action: t('demoInsights.seasonalPattern.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'actioned' as const,
    },
    {
      id: '6',
      type: 'OPPORTUNITY' as const,
      category: 'category',
      title: t('demoInsights.accessoriesGrowth.title'),
      summary: t('demoInsights.accessoriesGrowth.summary'),
      description: t('demoInsights.accessoriesGrowth.description'),
      impact: 'medium' as const,
      confidence: 0.88,
      recommendations: [
        { action: t('demoInsights.accessoriesGrowth.action1'), priority: 'high' as const },
        { action: t('demoInsights.accessoriesGrowth.action2'), priority: 'medium' as const },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'new' as const,
    },
  ], [t]);

  const [selectedSeason, setSelectedSeason] = useState('SS25');
  const [filter, setFilter] = useState('all');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize insights with demo data
  useEffect(() => {
    setInsights(demoInsights);
  }, [demoInsights]);

  const filteredInsights = insights.filter((insight) => {
    if (filter === 'all') return true;
    if (filter === 'warnings') return insight.type === 'WARNING';
    if (filter === 'opportunities') return insight.type === 'OPPORTUNITY';
    if (filter === 'recommendations') return insight.type === 'RECOMMENDATION';
    if (filter === 'new') return insight.status === 'new';
    return true;
  });

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };

  const handleAction = (id: string, action: 'view' | 'action' | 'dismiss') => {
    setInsights((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: action === 'action' ? 'actioned' : action === 'dismiss' ? 'dismissed' : 'viewed' }
          : i
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'OPPORTUNITY':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'RECOMMENDATION':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'INSIGHT':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WARNING':
        return <Badge className="bg-yellow-500">{t('warning')}</Badge>;
      case 'OPPORTUNITY':
        return <Badge className="bg-green-500">{t('opportunity')}</Badge>;
      case 'RECOMMENDATION':
        return <Badge className="bg-blue-500">{t('recommendation')}</Badge>;
      case 'INSIGHT':
        return <Badge className="bg-purple-500">{t('insight')}</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">{t('highImpactBadge')}</Badge>;
      case 'medium':
        return <Badge variant="secondary">{t('mediumImpact')}</Badge>;
      case 'low':
        return <Badge variant="outline">{t('lowImpact')}</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: insights.length,
    new: insights.filter((i) => i.status === 'new').length,
    warnings: insights.filter((i) => i.type === 'WARNING').length,
    opportunities: insights.filter((i) => i.type === 'OPPORTUNITY').length,
    highImpact: insights.filter((i) => i.impact === 'high').length,
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SS25">SS25</SelectItem>
              <SelectItem value="FW24">FW24</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateInsights} disabled={isGenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {t('generateInsights')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
          <Sparkles className="absolute -bottom-4 -right-4 h-32 w-32 text-gray-500/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('totalInsights')}</p>
            <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('new')}>
          <Zap className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-500/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('new')}</p>
            <p className="text-3xl font-bold tracking-tight text-blue-600">{stats.new}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('warnings')}>
          <Shield className="absolute -bottom-4 -right-4 h-32 w-32 text-yellow-500/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('warnings')}</p>
            <p className="text-3xl font-bold tracking-tight text-yellow-600">{stats.warnings}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('opportunities')}>
          <Target className="absolute -bottom-4 -right-4 h-32 w-32 text-green-500/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('opportunities')}</p>
            <p className="text-3xl font-bold tracking-tight text-green-600">{stats.opportunities}</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
          <AlertTriangle className="absolute -bottom-4 -right-4 h-32 w-32 text-red-500/10" />
          <CardContent className="relative p-6">
            <p className="text-sm font-medium text-muted-foreground">{t('highImpact')}</p>
            <p className="text-3xl font-bold tracking-tight text-red-600">{stats.highImpact}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {t('all')}
        </Button>
        <Button
          variant={filter === 'warnings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('warnings')}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          {t('warnings')}
        </Button>
        <Button
          variant={filter === 'opportunities' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('opportunities')}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          {t('opportunities')}
        </Button>
        <Button
          variant={filter === 'recommendations' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('recommendations')}
        >
          <Lightbulb className="h-4 w-4 mr-1" />
          {t('recommendations')}
        </Button>
        <Button
          variant={filter === 'new' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('new')}
        >
          {t('newOnly')}
        </Button>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <Card
            key={insight.id}
            className={`transition-all ${
              insight.status === 'new' ? 'border-l-4 border-l-blue-500' : ''
            } ${insight.status === 'actioned' ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-muted">
                  {getTypeIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    {getTypeBadge(insight.type)}
                    {getImpactBadge(insight.impact)}
                    {insight.status === 'new' && (
                      <Badge variant="outline" className="text-blue-500 border-blue-500">
                        {t('new')}
                      </Badge>
                    )}
                    {insight.status === 'actioned' && (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        {t('actioned')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.summary}
                  </p>
                  <p className="text-sm mb-4">{insight.description}</p>

                  {/* Recommendations */}
                  {insight.recommendations.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t('recommendedActions')}
                      </p>
                      <div className="space-y-1">
                        {insight.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span>{rec.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {rec.priority === 'high' ? t('priorityHigh') : rec.priority === 'medium' ? t('priorityMedium') : t('priorityLow')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {insight.createdAt.toLocaleDateString()}
                      </span>
                      <span>{t('confidence')}: {(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {insight.status !== 'actioned' && insight.status !== 'dismissed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(insight.id, 'dismiss')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t('dismiss')}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction(insight.id, 'action')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {t('markAsActioned')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInsights.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">{t('noInsightsFound')}</h3>
              <p className="text-muted-foreground">
                {filter === 'all'
                  ? t('clickGenerate')
                  : t('changeFilter')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
