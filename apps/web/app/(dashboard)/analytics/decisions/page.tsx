'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  FileText,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Brain,
  Sparkles,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { ChartWrapper } from '@/components/ui/chart-wrapper';
import { cn } from '@/lib/utils';

interface RiskFactor {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  impact: number;
  riskScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  mitigations: string[];
  timeframe: string;
}

interface ExecutiveSummary {
  generatedAt: string;
  highlights: {
    type: 'positive' | 'negative' | 'neutral';
    metric: string;
    value: string;
    change: number;
    context: string;
  }[];
  financialSnapshot: {
    totalBudget: number;
    utilized: number;
    utilizationRate: number;
    variance: number;
    projection: string;
  };
  operationalStatus: {
    pendingApprovals: number;
    activePlans: number;
    completedPlans: number;
    blockers: string[];
  };
  riskSummary: {
    overallLevel: string;
    criticalCount: number;
    topRisks: string[];
  };
  recommendations: {
    priority: 'critical' | 'high' | 'medium';
    action: string;
    rationale: string;
  }[];
  aiNarrative?: string;
}

interface RiskAssessment {
  overallRiskScore: number;
  riskLevel: string;
  summary: string;
  topRisks: RiskFactor[];
  trends: { category: string; currentScore: number; previousScore: number; change: number }[];
  recommendedActions: { priority: string; action: string; expectedImpact: string }[];
}

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const priorityIcons = {
  critical: XCircle,
  high: AlertTriangle,
  medium: AlertCircle,
  low: CheckCircle2,
};

export default function DecisionCopilotPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [selectedScenario, setSelectedScenario] = useState('balanced');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, riskRes] = await Promise.all([
        fetch('/api/analytics/executive-summary'),
        fetch('/api/analytics/risk-assessment'),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setExecutiveSummary(data);
      }

      if (riskRes.ok) {
        const data = await riskRes.json();
        setRiskAssessment(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/analytics/executive-summary?includeAI=true');
      if (res.ok) {
        const data = await res.json();
        setExecutiveSummary(data);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Scenario comparison data
  const scenarioData = useMemo(() => [
    { metric: 'Revenue', aggressive: 85, balanced: 75, conservative: 60 },
    { metric: 'Margin', aggressive: 55, balanced: 70, conservative: 80 },
    { metric: 'Risk', aggressive: 40, balanced: 70, conservative: 90 },
    { metric: 'Growth', aggressive: 90, balanced: 70, conservative: 45 },
    { metric: 'Inventory', aggressive: 50, balanced: 75, conservative: 85 },
  ], []);

  // Risk trend data for bar chart
  const riskTrendData = riskAssessment?.trends || [
    { category: 'Financial', currentScore: 35, previousScore: 32, change: 9.4 },
    { category: 'Operational', currentScore: 28, previousScore: 30, change: -6.7 },
    { category: 'Supply Chain', currentScore: 42, previousScore: 38, change: 10.5 },
    { category: 'Market', currentScore: 25, previousScore: 24, change: 4.2 },
    { category: 'Strategic', currentScore: 30, previousScore: 32, change: -6.3 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Decision Copilot
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights for strategic decision making
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={generateAISummary} disabled={isGeneratingAI}>
            <Sparkles className={cn('h-4 w-4 mr-2', isGeneratingAI && 'animate-pulse')} />
            {isGeneratingAI ? 'Generating...' : 'AI Summary'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {executiveSummary?.highlights.map((highlight, i) => {
          const Icon = highlight.type === 'positive' ? TrendingUp :
                      highlight.type === 'negative' ? TrendingDown : Target;
          return (
            <Card key={i} className="relative overflow-hidden">
              <Icon className={cn(
                'absolute -bottom-4 -right-4 h-32 w-32',
                highlight.type === 'positive' && 'text-green-500/10',
                highlight.type === 'negative' && 'text-red-500/10',
                highlight.type === 'neutral' && 'text-blue-500/10'
              )} />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {highlight.metric}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className={cn(
                  'text-3xl font-bold tracking-tight',
                  highlight.type === 'positive' && 'text-green-600',
                  highlight.type === 'negative' && 'text-red-600',
                  highlight.type === 'neutral' && 'text-blue-600'
                )}>{highlight.value}</div>
                <p className="text-sm text-muted-foreground mt-1">{highlight.context}</p>
                <div className={cn(
                  'text-xs mt-2 flex items-center gap-1',
                  highlight.change >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {highlight.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(highlight.change).toFixed(1)}% vs last period
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Executive Summary
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Scenario Analysis
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Assessment
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Financial Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Financial Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium">{executiveSummary?.financialSnapshot.utilizationRate}%</span>
                  </div>
                  <Progress value={executiveSummary?.financialSnapshot.utilizationRate || 0} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-lg font-bold">{formatCurrency(executiveSummary?.financialSnapshot.totalBudget || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Utilized</p>
                    <p className="text-lg font-bold">{formatCurrency(executiveSummary?.financialSnapshot.utilized || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(executiveSummary?.financialSnapshot.variance || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projection</p>
                    <Badge variant={executiveSummary?.financialSnapshot.projection === 'On track' ? 'default' : 'destructive'}>
                      {executiveSummary?.financialSnapshot.projection}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operational Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Operational Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{executiveSummary?.operationalStatus.pendingApprovals}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{executiveSummary?.operationalStatus.activePlans}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{executiveSummary?.operationalStatus.completedPlans}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
                {executiveSummary?.operationalStatus.blockers.length ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Blockers</p>
                    {executiveSummary.operationalStatus.blockers.map((blocker, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {blocker}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    No blockers identified
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Narrative */}
          {executiveSummary?.aiNarrative && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{executiveSummary.aiNarrative}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scenario Analysis Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Scenario Selector */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Scenario</CardTitle>
                <CardDescription>Compare different strategic approaches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aggressive">Aggressive Growth</SelectItem>
                    <SelectItem value="balanced">Balanced Approach</SelectItem>
                    <SelectItem value="conservative">Conservative</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-3 pt-4">
                  {[
                    { name: 'Aggressive Growth', desc: 'Maximize revenue, accept higher risk', score: 72, risk: 'High' },
                    { name: 'Balanced Approach', desc: 'Optimize for sustainable growth', score: 78, risk: 'Medium' },
                    { name: 'Conservative', desc: 'Minimize risk, protect margins', score: 65, risk: 'Low' },
                  ].map((scenario, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border cursor-pointer transition-colors',
                        selectedScenario === scenario.name.toLowerCase().split(' ')[0] && 'border-primary bg-primary/5'
                      )}
                      onClick={() => setSelectedScenario(scenario.name.toLowerCase().split(' ')[0])}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{scenario.name}</span>
                        <Badge variant="outline">{scenario.risk} Risk</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{scenario.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <Progress value={scenario.score} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium">{scenario.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Radar Comparison Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
                <CardDescription>Multi-dimensional analysis across scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWrapper height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={scenarioData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Aggressive"
                        dataKey="aggressive"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Balanced"
                        dataKey="balanced"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                      <Radar
                        name="Conservative"
                        dataKey="conservative"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.2}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Risk Overview */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="text-5xl font-bold">{riskAssessment?.overallRiskScore || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Overall Risk Score</p>
                  <Badge
                    variant={riskAssessment?.riskLevel === 'critical' ? 'destructive' : 'secondary'}
                    className="mt-2"
                  >
                    {riskAssessment?.riskLevel?.toUpperCase()} Risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{riskAssessment?.summary}</p>
              </CardContent>
            </Card>

            {/* Risk Trends Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Risk Trends by Category</CardTitle>
                <CardDescription>Current vs previous period comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartWrapper height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskTrendData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 60]} />
                      <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="previousScore" name="Previous" fill="#94a3b8" />
                      <Bar dataKey="currentScore" name="Current" fill="#3b82f6">
                        {riskTrendData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.change > 0 ? '#ef4444' : entry.change < 0 ? '#22c55e' : '#3b82f6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Top Risks List */}
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Factors</CardTitle>
              <CardDescription>Priority risks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {riskAssessment?.topRisks.map((risk, i) => {
                    const Icon = priorityIcons[risk.severity] || AlertCircle;
                    return (
                      <div
                        key={risk.id || i}
                        className={cn(
                          'p-4 rounded-lg border',
                          severityColors[risk.severity]
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5" />
                            <div>
                              <h4 className="font-medium">{risk.title}</h4>
                              <p className="text-sm mt-1 opacity-80">{risk.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span>Impact: {risk.impact}</span>
                                <span>Probability: {(risk.probability * 100).toFixed(0)}%</span>
                                <span>Score: {risk.riskScore.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {risk.timeframe?.replace('_', ' ')}
                          </Badge>
                        </div>
                        {risk.mitigations?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-current/20">
                            <p className="text-xs font-medium mb-1">Mitigations:</p>
                            <ul className="text-xs space-y-1">
                              {risk.mitigations.slice(0, 2).map((m, j) => (
                                <li key={j} className="flex items-center gap-2">
                                  <ChevronRight className="h-3 w-3" />
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Priority Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Priority Actions
                </CardTitle>
                <CardDescription>Recommended actions based on current analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executiveSummary?.recommendations.map((rec, i) => {
                    const Icon = priorityIcons[rec.priority] || AlertCircle;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'p-4 rounded-lg border-l-4',
                          rec.priority === 'critical' && 'border-l-red-500 bg-red-50',
                          rec.priority === 'high' && 'border-l-orange-500 bg-orange-50',
                          rec.priority === 'medium' && 'border-l-blue-500 bg-blue-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={cn(
                            'h-5 w-5 mt-0.5',
                            rec.priority === 'critical' && 'text-red-600',
                            rec.priority === 'high' && 'text-orange-600',
                            rec.priority === 'medium' && 'text-blue-600'
                          )} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rec.action}</h4>
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Risk Mitigations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Risk Mitigations
                </CardTitle>
                <CardDescription>Actions to reduce identified risks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskAssessment?.recommendedActions.map((action, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{action.action}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Expected Impact: {action.expectedImpact}
                          </p>
                        </div>
                        <Badge variant={action.priority === 'immediate' ? 'destructive' : 'secondary'}>
                          {action.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
