'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  ShoppingCart,
  TrendingDown,
  RefreshCw,
  Package,
  DollarSign,
  Grid3X3,
  Check,
  X,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Target,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  data: Record<string, unknown>;
  reasoning: string;
  projectedImpact?: {
    revenue?: number;
    margin?: number;
    units?: number;
  };
}

interface SuggestionCategory {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
  type: string;
}

const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    id: 'buy',
    labelKey: 'buyRecommendations',
    icon: <ShoppingCart className="h-4 w-4" />,
    color: 'text-blue-500',
    type: 'buy_recommendations',
  },
  {
    id: 'markdown',
    labelKey: 'markdownRecommendations',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-orange-500',
    type: 'markdown_recommendations',
  },
  {
    id: 'reorder',
    labelKey: 'reorderRecommendations',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-green-500',
    type: 'reorder_recommendations',
  },
  {
    id: 'transfer',
    labelKey: 'transferRecommendations',
    icon: <Package className="h-4 w-4" />,
    color: 'text-purple-500',
    type: 'transfer_recommendations',
  },
  {
    id: 'pricing',
    labelKey: 'pricingRecommendations',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'text-emerald-500',
    type: 'pricing_recommendations',
  },
  {
    id: 'category',
    labelKey: 'categoryOptimization',
    icon: <Grid3X3 className="h-4 w-4" />,
    color: 'text-pink-500',
    type: 'category_optimization',
  },
];

export default function AISuggestionsPage() {
  const t = useTranslations('pages.aiSuggestions');
  const tAi = useTranslations('ai');
  const tCommon = useTranslations('common');

  const [activeCategory, setActiveCategory] = useState('buy');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const category = SUGGESTION_CATEGORIES.find((c) => c.id === activeCategory);
      const res = await fetch(`/api/ai/suggestions?type=${category?.type || 'buy_recommendations'}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  // Fetch suggestions when category changes
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAction = async (suggestion: Suggestion, action: 'accept' | 'reject' | 'dismiss') => {
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'accept' ? 'save' : action,
          suggestion: action === 'accept' ? suggestion : undefined,
          suggestionId: suggestion.id,
        }),
      });

      if (res.ok) {
        // Remove from list
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
        setSelectedSuggestion(null);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[priority] || colors.medium;
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <ArrowDownRight className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const activeCategoryData = SUGGESTION_CATEGORIES.find((c) => c.id === activeCategory);

  const getCategoryLabel = (category: SuggestionCategory) => {
    return t(category.labelKey);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {t('title')}
              </h1>
              <p className="text-muted-foreground">
                {t('description')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={fetchSuggestions} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {tCommon('refresh')}
            </Button>
          </div>
        </div>

        {/* Category Selection - Dropdown on mobile, Tabs on desktop */}
        {/* Mobile: Select Dropdown */}
        <div className="lg:hidden">
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className={activeCategoryData?.color}>
                    {activeCategoryData?.icon}
                  </span>
                  <span>
                    {activeCategoryData && getCategoryLabel(activeCategoryData)}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SUGGESTION_CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <span className={category.color}>{category.icon}</span>
                    <span>
                      {getCategoryLabel(category)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="hidden lg:block">
          <TabsList className="w-full grid grid-cols-6 p-1">
            {SUGGESTION_CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <span className={category.color}>{category.icon}</span>
                <span className="text-sm">
                  {getCategoryLabel(category)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Content Grid - shared by both mobile and desktop */}
        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
            {/* Suggestions List */}
            <div className="lg:col-span-2">
              <Card className="min-h-[400px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className={activeCategoryData?.color}>
                        {activeCategoryData?.icon}
                      </span>
                      {activeCategoryData && getCategoryLabel(activeCategoryData)}
                    </CardTitle>
                    <Badge variant="secondary">
                      {suggestions.length}{' '}
                      {tAi('suggestions').toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-12">
                      <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {t('noSuggestions')}
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        <AnimatePresence>
                          {suggestions.map((suggestion) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              className={cn(
                                'p-4 rounded-lg border cursor-pointer transition-colors',
                                selectedSuggestion?.id === suggestion.id
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              )}
                              onClick={() => setSelectedSuggestion(suggestion)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge
                                      variant="outline"
                                      className={getPriorityColor(suggestion.priority)}
                                    >
                                      {suggestion.priority === 'urgent' && (
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                      )}
                                      {t(`priority.${suggestion.priority}`)}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {getImpactIcon(suggestion.impact)}
                                      {t(`impact.${suggestion.impact}`)}
                                    </div>
                                  </div>
                                  <h4 className="font-medium truncate">
                                    {suggestion.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {suggestion.description}
                                  </p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">
                                      {t('confidence')}
                                    </p>
                                    <p className="font-semibold">
                                      {Math.round(suggestion.confidence * 100)}%
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Suggestion Detail */}
            <div>
              <Card className="sticky top-6 min-h-[400px]">
                <CardHeader>
                  <CardTitle>
                    {t('suggestionDetail')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSuggestion ? (
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(selectedSuggestion.priority)}
                          >
                            {t(`priority.${selectedSuggestion.priority}`)}
                          </Badge>
                          <Badge variant="secondary">
                            {t(`impact.${selectedSuggestion.impact}`)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">
                          {selectedSuggestion.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedSuggestion.description}
                        </p>
                      </div>

                      {/* Confidence */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {t('confidence')}
                          </span>
                          <span className="font-medium">
                            {Math.round(selectedSuggestion.confidence * 100)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedSuggestion.confidence * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Reasoning */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('reasoning')}
                        </p>
                        <p className="text-sm">{selectedSuggestion.reasoning}</p>
                      </div>

                      {/* Projected Impact */}
                      {selectedSuggestion.projectedImpact && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {t('projectedImpact')}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedSuggestion.projectedImpact.revenue && (
                              <div className="p-2 bg-green-500/10 rounded text-center">
                                <p className="text-xs text-muted-foreground">
                                  {t('revenue')}
                                </p>
                                <p className="font-semibold text-green-600">
                                  ${(selectedSuggestion.projectedImpact.revenue / 1000).toFixed(0)}K
                                </p>
                              </div>
                            )}
                            {selectedSuggestion.projectedImpact.margin && (
                              <div className="p-2 bg-blue-500/10 rounded text-center">
                                <p className="text-xs text-muted-foreground">
                                  {t('margin')}
                                </p>
                                <p className="font-semibold text-blue-600">
                                  +{selectedSuggestion.projectedImpact.margin}%
                                </p>
                              </div>
                            )}
                            {selectedSuggestion.projectedImpact.units && (
                              <div className="p-2 bg-purple-500/10 rounded text-center">
                                <p className="text-xs text-muted-foreground">
                                  {t('units')}
                                </p>
                                <p className="font-semibold text-purple-600">
                                  {selectedSuggestion.projectedImpact.units.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleAction(selectedSuggestion, 'accept')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {tCommon('approve')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(selectedSuggestion, 'dismiss')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t('selectSuggestion')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
