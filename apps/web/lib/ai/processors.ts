// AI Response Processors
// Utility functions to process and validate AI responses

export interface ProcessedProposal {
  category: string;
  subcategory?: string;
  proposedPct: number;
  proposedValue: number;
  confidence: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  anomalyFlags: string[];
}

export interface ProcessedSKUEnrichment {
  demandLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  recommendedQty: number;
  qtyDelta: number;
  qtyDeltaPct: number;
  insights: string[];
  risks: string[];
  similarProducts: {
    skuCode: string;
    season: string;
    performance: number;
  }[];
}

// Process OTB proposals from AI
export function processProposals(
  rawProposals: {
    category: string;
    subcategory?: string;
    proposedPercentage: number;
    confidenceScore: number;
    reasoning: string;
    riskFactors: string[];
  }[],
  totalBudget: number,
  historicalData: Record<string, number>
): ProcessedProposal[] {
  return rawProposals.map((proposal) => {
    const proposedValue = (proposal.proposedPercentage / 100) * totalBudget;
    const historicalPct = historicalData[proposal.category] || 0;
    const deviation = Math.abs(proposal.proposedPercentage - historicalPct);

    // Determine risk level based on deviation and confidence
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const anomalyFlags: string[] = [];

    if (deviation > 20) {
      riskLevel = 'high';
      anomalyFlags.push(`Large deviation from historical (${deviation.toFixed(1)}%)`);
    } else if (deviation > 10) {
      riskLevel = 'medium';
      anomalyFlags.push(`Moderate deviation from historical (${deviation.toFixed(1)}%)`);
    }

    if (proposal.confidenceScore < 50) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      anomalyFlags.push('Low AI confidence score');
    }

    if (proposal.riskFactors.length > 2) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      anomalyFlags.push('Multiple risk factors identified');
    }

    return {
      category: proposal.category,
      subcategory: proposal.subcategory,
      proposedPct: proposal.proposedPercentage,
      proposedValue,
      confidence: proposal.confidenceScore,
      reasoning: proposal.reasoning,
      riskLevel,
      anomalyFlags,
    };
  });
}

// Process SKU enrichment data
export function processSKUEnrichment(
  rawEnrichment: {
    demandPrediction: string;
    demandScore: number;
    recommendedQuantity: number;
    quantityReasoning: string;
    similarSKUs: { skuCode: string; season: string; sellThrough: number }[];
    riskFactors: string[];
    insights: string;
  },
  currentQty: number
): ProcessedSKUEnrichment {
  const qtyDelta = rawEnrichment.recommendedQuantity - currentQty;
  const qtyDeltaPct = currentQty > 0 ? (qtyDelta / currentQty) * 100 : 0;

  // Parse insights into array
  const insights = rawEnrichment.insights
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return {
    demandLevel: rawEnrichment.demandPrediction as 'HIGH' | 'MEDIUM' | 'LOW',
    score: rawEnrichment.demandScore,
    recommendedQty: rawEnrichment.recommendedQuantity,
    qtyDelta,
    qtyDeltaPct,
    insights,
    risks: rawEnrichment.riskFactors,
    similarProducts: rawEnrichment.similarSKUs.map((s) => ({
      skuCode: s.skuCode,
      season: s.season,
      performance: s.sellThrough,
    })),
  };
}

// Format currency for display
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format percentage for display
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Calculate variance with sign
export function calculateVariance(
  current: number,
  baseline: number
): { value: number; formatted: string; direction: 'up' | 'down' | 'neutral' } {
  const variance = current - baseline;
  const direction: 'up' | 'down' | 'neutral' =
    variance > 0.5 ? 'up' : variance < -0.5 ? 'down' : 'neutral';

  return {
    value: variance,
    formatted: `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`,
    direction,
  };
}

// Validate AI response structure
export function validateAIResponse<T>(
  response: unknown,
  requiredFields: string[]
): { valid: boolean; data: T | null; errors: string[] } {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return {
      valid: false,
      data: null,
      errors: ['Response is not a valid object'],
    };
  }

  const obj = response as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    data: errors.length === 0 ? (response as T) : null,
    errors,
  };
}

// Summarize proposals for quick view
export function summarizeProposals(
  proposals: ProcessedProposal[]
): {
  totalPct: number;
  highRiskCount: number;
  avgConfidence: number;
  topCategory: string;
  topCategoryPct: number;
} {
  const totalPct = proposals.reduce((sum, p) => sum + p.proposedPct, 0);
  const highRiskCount = proposals.filter((p) => p.riskLevel === 'high').length;
  const avgConfidence =
    proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length;

  const sorted = [...proposals].sort((a, b) => b.proposedPct - a.proposedPct);
  const topCategory = sorted[0]?.category || 'N/A';
  const topCategoryPct = sorted[0]?.proposedPct || 0;

  return {
    totalPct,
    highRiskCount,
    avgConfidence,
    topCategory,
    topCategoryPct,
  };
}

// Generate anomaly description
export function generateAnomalyDescription(
  type: string,
  data: {
    category?: string;
    currentValue?: number;
    expectedValue?: number;
    threshold?: number;
  }
): string {
  switch (type) {
    case 'HIGH_VARIANCE':
      return `${data.category}: Allocation ${data.currentValue?.toFixed(1)}% significantly differs from expected ${data.expectedValue?.toFixed(1)}%`;
    case 'LOW_CONFIDENCE':
      return `${data.category}: AI confidence score below threshold (${data.threshold}%)`;
    case 'BUDGET_OVERFLOW':
      return `Total allocation ${data.currentValue?.toFixed(1)}% exceeds 100%`;
    case 'MISSING_DATA':
      return `${data.category}: Insufficient historical data for reliable analysis`;
    default:
      return `Anomaly detected in ${data.category || 'data'}`;
  }
}

// Calculate risk score from multiple factors
export function calculateRiskScore(factors: {
  deviationFromHistory: number;
  confidenceScore: number;
  newCategoryRatio: number;
  anomalyCount: number;
}): { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' } {
  // Weighted risk calculation
  let score = 0;

  // Deviation from history (0-40 points)
  if (factors.deviationFromHistory > 20) score += 40;
  else if (factors.deviationFromHistory > 10) score += 25;
  else if (factors.deviationFromHistory > 5) score += 10;

  // Confidence score (0-30 points, inverted)
  if (factors.confidenceScore < 50) score += 30;
  else if (factors.confidenceScore < 70) score += 20;
  else if (factors.confidenceScore < 85) score += 10;

  // New category ratio (0-20 points)
  score += Math.min(factors.newCategoryRatio * 20, 20);

  // Anomaly count (0-10 points)
  score += Math.min(factors.anomalyCount * 3, 10);

  // Determine level
  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level };
}
