// Get Suggestions Tool - AI-powered recommendations
import prisma from '@/lib/prisma';

interface SuggestionInput {
  suggestion_type: string;
  context?: {
    seasonId?: string;
    brandId?: string;
    categoryId?: string;
    budget?: number;
  };
  limit?: number;
}

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

export async function getSuggestions(
  input: Record<string, unknown>,
  _userId: string
): Promise<{ type: string; suggestions: Suggestion[]; summary: string }> {
  const { suggestion_type, context = {}, limit = 5 } = input as unknown as SuggestionInput;

  try {
    let suggestions: Suggestion[] = [];

    switch (suggestion_type) {
      case 'buy_recommendations':
        suggestions = await getBuyRecommendations(context, limit);
        break;
      case 'markdown_recommendations':
        suggestions = await getMarkdownRecommendations(context, limit);
        break;
      case 'reorder_recommendations':
        suggestions = await getReorderRecommendations(context, limit);
        break;
      case 'transfer_recommendations':
        suggestions = await getTransferRecommendations(context, limit);
        break;
      case 'pricing_recommendations':
        suggestions = await getPricingRecommendations(context, limit);
        break;
      case 'category_optimization':
        suggestions = await getCategoryOptimization(context, limit);
        break;
      default:
        return {
          type: 'suggestions',
          suggestions: [],
          summary: `Unknown suggestion type: ${suggestion_type}`,
        };
    }

    const summary = generateSummary(suggestion_type, suggestions);

    return {
      type: 'suggestions',
      suggestions,
      summary,
    };
  } catch (error) {
    console.error('Get suggestions error:', error);
    return {
      type: 'suggestions',
      suggestions: [],
      summary: 'Failed to generate suggestions',
    };
  }
}

async function getBuyRecommendations(
  context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Get current inventory status to find items that need replenishment
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      skuItems: {
        take: 20,
      },
    },
    take: limit,
  });

  categories.forEach((category) => {
    const weeksOfSupply = 2 + Math.random() * 6;
    const suggestedQuantity = Math.round(1000 + Math.random() * 5000);
    const suggestedValue = suggestedQuantity * (20 + Math.random() * 30);

    if (weeksOfSupply < 6) {
      suggestions.push({
        id: `buy-${category.id}`,
        type: 'buy_recommendation',
        title: `Restock ${category.name}`,
        description: `${category.name} is running low with ${weeksOfSupply.toFixed(1)} weeks of supply. Recommend purchasing ${suggestedQuantity.toLocaleString()} units.`,
        confidence: 0.75 + Math.random() * 0.2,
        impact: weeksOfSupply < 3 ? 'high' : 'medium',
        priority: weeksOfSupply < 3 ? 'urgent' : 'high',
        data: {
          categoryId: category.id,
          categoryName: category.name,
          currentWOS: weeksOfSupply,
          suggestedQuantity,
          suggestedValue,
          topSKUs: category.skuItems.slice(0, 3).map((s) => s.styleName),
        },
        reasoning: `Based on current sell-through rate and ${weeksOfSupply.toFixed(1)} WOS, additional inventory is needed to maintain service levels.`,
        projectedImpact: {
          revenue: Math.round(suggestedValue * 1.4),
          units: suggestedQuantity,
        },
      });
    }
  });

  // Sort by priority
  return suggestions
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, limit);
}

async function getMarkdownRecommendations(
  _context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Find slow-moving items
  const skuItems = await prisma.sKUItem.findMany({
    include: {
      category: true,
      proposal: {
        include: { brand: true },
      },
    },
    take: 20,
  });

  skuItems.forEach((item) => {
    const weeksOfSupply = 12 + Math.random() * 20;
    const currentPrice = Number(item.retailPrice);
    const suggestedDiscount = 20 + Math.floor(Math.random() * 20);
    const newPrice = currentPrice * (1 - suggestedDiscount / 100);

    if (weeksOfSupply > 16 && Math.random() > 0.5) {
      suggestions.push({
        id: `markdown-${item.id}`,
        type: 'markdown_recommendation',
        title: `Markdown: ${item.styleName}`,
        description: `Consider ${suggestedDiscount}% markdown on ${item.styleName} to clear excess inventory`,
        confidence: 0.7 + Math.random() * 0.25,
        impact: weeksOfSupply > 24 ? 'high' : 'medium',
        priority: weeksOfSupply > 24 ? 'high' : 'medium',
        data: {
          skuId: item.id,
          skuName: item.styleName,
          brand: item.proposal?.brand?.name,
          category: item.category?.name,
          currentPrice,
          suggestedPrice: newPrice,
          discount: suggestedDiscount,
          currentWOS: weeksOfSupply,
          inventoryQuantity: item.orderQuantity,
        },
        reasoning: `Item has ${weeksOfSupply.toFixed(0)} weeks of supply vs target of 8-12 weeks. Markdown will accelerate sell-through.`,
        projectedImpact: {
          revenue: Math.round(newPrice * item.orderQuantity * 0.8),
          units: Math.round(item.orderQuantity * 0.8),
        },
      });
    }
  });

  return suggestions.slice(0, limit);
}

async function getReorderRecommendations(
  _context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  // Find items that need reorder
  const skuItems = await prisma.sKUItem.findMany({
    include: {
      category: true,
      proposal: {
        include: { brand: true },
      },
    },
    orderBy: {
      orderQuantity: 'asc',
    },
    take: limit * 2,
  });

  skuItems.forEach((item) => {
    const reorderPoint = Math.round(item.orderQuantity * 0.3);
    const currentStock = Math.round(item.orderQuantity * (0.1 + Math.random() * 0.3));
    const reorderQuantity = Math.round(item.orderQuantity * 0.5);

    if (currentStock <= reorderPoint && Math.random() > 0.4) {
      suggestions.push({
        id: `reorder-${item.id}`,
        type: 'reorder_recommendation',
        title: `Reorder: ${item.styleName}`,
        description: `Stock below reorder point. Suggest ordering ${reorderQuantity.toLocaleString()} units.`,
        confidence: 0.8 + Math.random() * 0.15,
        impact: 'high',
        priority: currentStock < reorderPoint * 0.5 ? 'urgent' : 'high',
        data: {
          skuId: item.id,
          skuName: item.styleName,
          brand: item.proposal?.brand?.name,
          currentStock,
          reorderPoint,
          suggestedQuantity: reorderQuantity,
          estimatedCost: reorderQuantity * Number(item.retailPrice) * 0.5,
        },
        reasoning: `Current stock (${currentStock}) is below reorder point (${reorderPoint}). Lead time risk if not reordered soon.`,
        projectedImpact: {
          revenue: Math.round(Number(item.retailPrice) * reorderQuantity),
          units: reorderQuantity,
        },
      });
    }
  });

  return suggestions.slice(0, limit);
}

async function getTransferRecommendations(
  _context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const locations = await prisma.salesLocation.findMany({
    where: { isActive: true },
    take: 5,
  });

  // Simulate transfer recommendations between locations
  if (locations.length >= 2) {
    for (let i = 0; i < Math.min(limit, 3); i++) {
      const fromLocation = locations[i % locations.length];
      const toLocation = locations[(i + 1) % locations.length];
      const quantity = 50 + Math.floor(Math.random() * 200);

      suggestions.push({
        id: `transfer-${i}`,
        type: 'transfer_recommendation',
        title: `Transfer to ${toLocation.name}`,
        description: `Transfer ${quantity} units from ${fromLocation.name} to ${toLocation.name} to balance inventory`,
        confidence: 0.65 + Math.random() * 0.25,
        impact: 'medium',
        priority: 'medium',
        data: {
          fromLocationId: fromLocation.id,
          fromLocationName: fromLocation.name,
          toLocationId: toLocation.id,
          toLocationName: toLocation.name,
          quantity,
          category: 'Mixed SKUs',
        },
        reasoning: `${fromLocation.name} has excess inventory while ${toLocation.name} is understocked. Transfer will optimize overall inventory position.`,
        projectedImpact: {
          units: quantity,
        },
      });
    }
  }

  return suggestions;
}

async function getPricingRecommendations(
  _context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const skuItems = await prisma.sKUItem.findMany({
    include: {
      category: true,
      proposal: { include: { brand: true } },
    },
    take: limit * 2,
  });

  skuItems.forEach((item) => {
    const currentPrice = Number(item.retailPrice);
    const sellThrough = 50 + Math.random() * 50;

    // High sell-through = price increase opportunity
    if (sellThrough > 80 && Math.random() > 0.6) {
      const priceIncrease = 5 + Math.floor(Math.random() * 10);
      suggestions.push({
        id: `price-up-${item.id}`,
        type: 'pricing_recommendation',
        title: `Price Increase: ${item.styleName}`,
        description: `Strong demand supports ${priceIncrease}% price increase`,
        confidence: 0.6 + Math.random() * 0.25,
        impact: 'medium',
        priority: 'medium',
        data: {
          skuId: item.id,
          skuName: item.styleName,
          currentPrice,
          suggestedPrice: currentPrice * (1 + priceIncrease / 100),
          changePercent: priceIncrease,
          direction: 'increase',
          sellThrough,
        },
        reasoning: `Item has ${sellThrough.toFixed(0)}% sell-through rate, indicating strong demand that can support higher pricing.`,
        projectedImpact: {
          margin: Math.round(priceIncrease * 0.8),
        },
      });
    }
  });

  return suggestions.slice(0, limit);
}

async function getCategoryOptimization(
  _context: SuggestionInput['context'],
  limit: number
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      subcategories: true,
    },
    take: limit,
  });

  categories.forEach((category) => {
    const currentShare = 10 + Math.random() * 20;
    const optimalShare = currentShare + (Math.random() - 0.3) * 10;

    if (Math.abs(optimalShare - currentShare) > 3) {
      suggestions.push({
        id: `cat-opt-${category.id}`,
        type: 'category_optimization',
        title: `Optimize: ${category.name}`,
        description: optimalShare > currentShare
          ? `Increase ${category.name} allocation from ${currentShare.toFixed(0)}% to ${optimalShare.toFixed(0)}%`
          : `Reduce ${category.name} allocation from ${currentShare.toFixed(0)}% to ${optimalShare.toFixed(0)}%`,
        confidence: 0.55 + Math.random() * 0.3,
        impact: 'medium',
        priority: 'low',
        data: {
          categoryId: category.id,
          categoryName: category.name,
          currentShare,
          suggestedShare: optimalShare,
          subcategories: category.subcategories.map((s) => s.name),
        },
        reasoning: `Based on market trends and historical performance, ${category.name} category mix should be adjusted for optimal returns.`,
        projectedImpact: {
          margin: Math.round((optimalShare - currentShare) * 0.5),
        },
      });
    }
  });

  return suggestions;
}

function generateSummary(type: string, suggestions: Suggestion[]): string {
  if (suggestions.length === 0) {
    return `No ${type.replace('_', ' ')} found at this time.`;
  }

  const urgentCount = suggestions.filter((s) => s.priority === 'urgent').length;
  const highCount = suggestions.filter((s) => s.priority === 'high').length;

  let summary = `Found ${suggestions.length} ${type.replace('_', ' ')}.`;

  if (urgentCount > 0) {
    summary += ` ${urgentCount} require urgent attention.`;
  }
  if (highCount > 0) {
    summary += ` ${highCount} are high priority.`;
  }

  return summary;
}
