// AI Insights Types

export type InsightType = 'OPPORTUNITY' | 'RISK' | 'ANOMALY' | 'TREND' | 'RECOMMENDATION' | 'ALERT';
export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InsightStatus = 'NEW' | 'VIEWED' | 'ACTION_TAKEN' | 'DISMISSED' | 'EXPIRED';

export interface AIInsight {
  id: string;
  insightType: InsightType;
  category: string;
  title: string;
  description: string;
  impactLevel: ImpactLevel;
  confidence: number;
  dataContext: InsightDataContext;
  affectedEntities?: AffectedEntity[];
  recommendations?: Recommendation[];
  status: InsightStatus;
  viewedAt?: Date;
  actionTakenAt?: Date;
  dismissedAt?: Date;
  userId?: string;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface InsightDataContext {
  metric?: string;
  currentValue?: number;
  expectedValue?: number;
  deviation?: number;
  period?: string;
  comparison?: {
    type: 'period' | 'target' | 'benchmark';
    baseline: number;
    actual: number;
    variance: number;
  };
  relatedData?: Record<string, unknown>;
}

export interface AffectedEntity {
  type: 'brand' | 'category' | 'location' | 'sku';
  id: string;
  name: string;
  impact: number;
}

export interface Recommendation {
  id: string;
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact?: {
    metric: string;
    value: number;
    unit: string;
  };
  steps?: string[];
}

export interface InsightFeed {
  insights: AIInsight[];
  summary: {
    total: number;
    byType: Record<InsightType, number>;
    byImpact: Record<ImpactLevel, number>;
    unread: number;
  };
  lastUpdated: Date;
}

export interface InsightAction {
  insightId: string;
  action: 'view' | 'take_action' | 'dismiss';
  note?: string;
}

export interface RiskIndicator {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    name: string;
    severity: number;
    trend: 'improving' | 'stable' | 'worsening';
  }[];
  mitigationActions: string[];
}

export interface OpportunityIndicator {
  category: string;
  opportunityLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
  confidence: number;
  factors: {
    name: string;
    contribution: number;
  }[];
  suggestedActions: string[];
}

// Insight generation context
export interface InsightGenerationContext {
  seasonId: string;
  brandIds?: string[];
  categoryIds?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  focusAreas?: InsightType[];
}
