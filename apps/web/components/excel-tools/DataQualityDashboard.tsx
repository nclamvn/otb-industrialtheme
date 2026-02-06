'use client';

/**
 * Data Quality Dashboard Component
 * Displays data quality analysis results and allows fixing issues
 */

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Loader2,
  Wrench,
  Download,
  RefreshCw,
  Shield,
} from 'lucide-react';

interface DataIssue {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  row: number;
  column: string;
  value: unknown;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

interface QualityScore {
  overall: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  validity: number;
}

interface CleaningSummary {
  duplicatesRemoved: number;
  missingValuesFilled: number;
  outliersDetected: number;
  formatErrorsFixed: number;
  inconsistenciesFixed: number;
  executionTimeMs: number;
}

interface AnalysisResult {
  success: boolean;
  originalRowCount: number;
  cleanedRowCount?: number;
  issuesFound: number;
  issuesFixed?: number;
  issues: DataIssue[];
  qualityScore: QualityScore;
  summary: CleaningSummary;
  cleanedData?: Record<string, unknown>[];
}

interface DataQualityDashboardProps {
  data: Record<string, unknown>[];
  onDataCleaned?: (cleanedData: Record<string, unknown>[]) => void;
  requiredColumns?: string[];
  numericColumns?: string[];
  categoryColumns?: string[];
  className?: string;
}

export function DataQualityDashboard({
  data,
  onDataCleaned,
  requiredColumns,
  numericColumns,
  categoryColumns,
  className = '',
}: DataQualityDashboardProps) {
  const t = useTranslations('excelTools.dataQuality');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Analyze data quality
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/excel-tools/data-quality/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          requiredColumns,
          numericColumns,
          categoryColumns,
        }),
      });

      if (response.ok) {
        const analysisResult: AnalysisResult = await response.json();
        setResult(analysisResult);
      }
    } catch (error) {
      console.error('Failed to analyze data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fix data quality issues
  const handleFix = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/excel-tools/data-quality/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          requiredColumns,
          numericColumns,
          categoryColumns,
          autoFix: true,
          removeDuplicates: true,
        }),
      });

      if (response.ok) {
        const fixResult: AnalysisResult = await response.json();
        setResult(fixResult);

        if (fixResult.cleanedData && onDataCleaned) {
          onDataCleaned(fixResult.cleanedData);
        }
      }
    } catch (error) {
      console.error('Failed to fix data:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Group issues by severity
  const issuesBySeverity = useMemo(() => {
    if (!result) return { critical: [], warning: [], info: [] };

    return {
      critical: result.issues.filter((i) => i.severity === 'critical'),
      warning: result.issues.filter((i) => i.severity === 'warning'),
      info: result.issues.filter((i) => i.severity === 'info'),
    };
  }, [result]);

  // Group issues by type
  const issuesByType = useMemo(() => {
    if (!result) return {};

    const grouped: Record<string, DataIssue[]> = {};
    result.issues.forEach((issue) => {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    });
    return grouped;
  }, [result]);

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Get progress color
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !data.length}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('analyze')}
            </Button>
            {result && result.issues.some((i) => i.autoFixable) && (
              <Button onClick={handleFix} disabled={isFixing}>
                {isFixing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                {t('autoFix')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!result ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('clickToAnalyze')}</p>
            <p className="text-sm mt-1">{t('rowsReady', { count: data.length })}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
              <TabsTrigger value="issues">
                {t('issues')} ({result.issuesFound})
              </TabsTrigger>
              <TabsTrigger value="details">{t('details')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Quality Score */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('totalScore')}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(result.qualityScore.overall)}`}>
                    {result.qualityScore.overall}%
                  </div>
                  <Progress
                    value={result.qualityScore.overall}
                    className={`h-2 mt-2 ${getProgressColor(result.qualityScore.overall)}`}
                  />
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('completeness')}</div>
                  <div className={`text-xl font-bold ${getScoreColor(result.qualityScore.completeness)}`}>
                    {result.qualityScore.completeness}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('accuracy')}</div>
                  <div className={`text-xl font-bold ${getScoreColor(result.qualityScore.accuracy)}`}>
                    {result.qualityScore.accuracy}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('consistency')}</div>
                  <div className={`text-xl font-bold ${getScoreColor(result.qualityScore.consistency)}`}>
                    {result.qualityScore.consistency}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">{t('validity')}</div>
                  <div className={`text-xl font-bold ${getScoreColor(result.qualityScore.validity)}`}>
                    {result.qualityScore.validity}%
                  </div>
                </Card>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('totalRows')}</div>
                    <div className="font-semibold">{result.originalRowCount}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('critical')}</div>
                    <div className="font-semibold">{issuesBySeverity.critical.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('warning')}</div>
                    <div className="font-semibold">{issuesBySeverity.warning.length}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <Wrench className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('fixed')}</div>
                    <div className="font-semibold">{result.issuesFixed || 0}</div>
                  </div>
                </div>
              </div>

              {/* Issue Summary by Type */}
              {Object.keys(issuesByType).length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">{t('issueCategories')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(issuesByType).map(([type, issues]) => (
                      <Badge key={type} variant="outline">
                        {type}: {issues.length}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="mt-4">
              {result.issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>{t('noIssues')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t('severity')}</TableHead>
                        <TableHead className="w-[80px]">{t('row')}</TableHead>
                        <TableHead className="w-[120px]">{t('column')}</TableHead>
                        <TableHead>{t('issue')}</TableHead>
                        <TableHead className="w-[100px]">{t('fixable')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.issues.slice(0, 50).map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(issue.severity)}
                              <span className="text-xs capitalize">
                                {issue.severity === 'critical'
                                  ? t('critical')
                                  : issue.severity === 'warning'
                                  ? t('warning')
                                  : t('info')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{issue.row}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 rounded">
                              {issue.column}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t('suggestion')}: {issue.suggestion}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {issue.autoFixable ? (
                              <Badge variant="outline" className="text-green-500">
                                {t('yes')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                {t('no')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {result.issues.length > 50 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border-t">
                      {t('showingIssues', { total: result.issues.length })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">{t('detailedStats')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('originalRows')}:</span>
                      <span>{result.originalRowCount}</span>
                    </div>
                    {result.cleanedRowCount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('rowsAfterFix')}:</span>
                        <span>{result.cleanedRowCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('duplicatesRemoved')}:</span>
                      <span>{result.summary.duplicatesRemoved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('outliersDetected')}:</span>
                      <span>{result.summary.outliersDetected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('formatErrorsFixed')}:</span>
                      <span>{result.summary.formatErrorsFixed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('inconsistenciesFixed')}:</span>
                      <span>{result.summary.inconsistenciesFixed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('processingTime')}:</span>
                      <span>{result.summary.executionTimeMs}ms</span>
                    </div>
                  </div>
                </Card>

                {result.cleanedData && result.cleanedData.length > 0 && (
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {t('downloadCleaned', { count: result.cleanedData.length })}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default DataQualityDashboard;
