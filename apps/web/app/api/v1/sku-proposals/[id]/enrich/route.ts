export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { enrichSKU, logAIInteraction } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { itemIds } = body;

    const proposal = await prisma.sKUProposal.findUnique({
      where: { id },
      include: {
        otbPlan: {
          include: {
            budget: {
              include: {
                brand: true,
                season: true,
              },
            },
          },
        },
        items: {
          where: itemIds ? { id: { in: itemIds } } : {},
          include: {
            category: true,
            subcategory: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: 'SKU proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to enrich' },
        { status: 400 }
      );
    }

    const enrichedItems: Array<{
      id: string;
      enrichments: {
        demandPrediction: string;
        demandScore: number;
        recommendedQuantity: number;
        insights: string;
      };
    }> = [];

    // Enrich each item using AI
    for (const item of proposal.items) {
      const startTime = Date.now();

      try {
        const enrichment = await enrichSKU({
          skuCode: item.skuCode,
          styleName: item.styleName,
          category: item.category?.name || 'Unknown',
          subcategory: item.subcategory?.name,
          gender: item.gender,
          retailPrice: Number(item.retailPrice),
          costPrice: Number(item.costPrice),
          orderQuantity: item.orderQuantity,
        });

        const responseTime = Date.now() - startTime;

        // Log AI interaction
        await logAIInteraction({
          userId: session.user.id,
          action: 'enrich_sku',
          context: {
            entityType: 'SKU_ITEM',
            entityId: item.id,
            skuCode: item.skuCode,
            brandName: proposal.otbPlan.budget.brand.name,
          },
          latencyMs: responseTime,
        });

        // Update item with enrichments
        await prisma.sKUItem.update({
          where: { id: item.id },
          data: {
            aiDemandScore: enrichment.demandScore,
            aiDemandPrediction: enrichment.demandPrediction,
            aiRecommendedQty: enrichment.recommendedQuantity,
            aiSimilarSKUs: enrichment.similarSKUs,
            aiInsights: enrichment.insights,
            aiEnrichedAt: new Date(),
          },
        });

        enrichedItems.push({
          id: item.id,
          enrichments: {
            demandPrediction: enrichment.demandPrediction,
            demandScore: enrichment.demandScore,
            recommendedQuantity: enrichment.recommendedQuantity,
            insights: enrichment.insights,
          },
        });
      } catch (enrichError) {
        console.error(`Error enriching item ${item.id}:`, enrichError);
        // Continue with other items
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        enrichedCount: enrichedItems.length,
        totalItems: proposal.items.length,
        enrichedItems,
      },
      message: `Successfully enriched ${enrichedItems.length} of ${proposal.items.length} items`,
    });
  } catch (error) {
    console.error('Error enriching SKUs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enrich SKUs' },
      { status: 500 }
    );
  }
}
