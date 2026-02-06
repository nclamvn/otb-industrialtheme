import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FallbackProvider,
  OpenAIProvider,
  AnthropicProvider,
  OTBContextBuilder,
  SYSTEM_PROMPTS,
  INSIGHT_PROMPTS,
  ChatMessage,
  StreamChunk,
  OTBContext,
} from '@dafc/excelai-ai';
import { InsightDto } from './dto';

@Injectable()
export class AICopilotService implements OnModuleInit {
  private readonly logger = new Logger(AICopilotService.name);
  private aiProvider: FallbackProvider;
  private contextBuilder: OTBContextBuilder;

  constructor(private prisma: PrismaService) {
    this.contextBuilder = new OTBContextBuilder();
  }

  onModuleInit() {
    // Initialize providers with fallback
    const openai = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    });

    const anthropic = new AnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    });

    this.aiProvider = new FallbackProvider({
      providers: [openai, anthropic],
      retryDelay: 500,
    });

    this.logger.log('AI Copilot initialized with fallback providers');
  }

  /**
   * Stream chat response
   */
  async *streamChat(
    messages: ChatMessage[],
    otbPlanId?: string,
  ): AsyncIterable<StreamChunk> {
    // Build context if plan ID provided
    let contextString = '';
    if (otbPlanId) {
      const context = await this.buildOTBContext(otbPlanId);
      if (context) {
        contextString = this.contextBuilder.build(context);
      }
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(contextString);
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Stream response
    yield* this.aiProvider.stream(fullMessages);
  }

  /**
   * Non-streaming chat
   */
  async chat(messages: ChatMessage[], otbPlanId?: string) {
    let contextString = '';
    if (otbPlanId) {
      const context = await this.buildOTBContext(otbPlanId);
      if (context) {
        contextString = this.contextBuilder.build(context);
      }
    }

    const systemPrompt = this.buildSystemPrompt(contextString);
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    return this.aiProvider.chat(fullMessages);
  }

  /**
   * Generate insights for OTB plan
   */
  async generateInsights(otbPlanId: string, type: 'full' | 'quick' = 'quick'): Promise<InsightDto[]> {
    const context = await this.buildOTBContext(otbPlanId);
    if (!context) {
      return [];
    }

    const contextString = this.contextBuilder.build(context);
    const prompt = type === 'full'
      ? INSIGHT_PROMPTS.CATEGORY_RANKING
      : INSIGHT_PROMPTS.HEALTH_CHECK;

    const response = await this.aiProvider.chat([
      { role: 'system', content: SYSTEM_PROMPTS.INSIGHT_GENERATION },
      { role: 'user', content: `${prompt}\n\n${contextString}` },
    ]);

    // Parse insights from response
    return this.parseInsights(response.content);
  }

  /**
   * Get provider status
   */
  async getProvidersStatus() {
    return this.aiProvider.getProvidersStatus();
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(contextString: string): string {
    const basePrompt = SYSTEM_PROMPTS.OTB_ASSISTANT_VI;

    if (contextString) {
      return `${basePrompt}\n\n## Current OTB Context:\n${contextString}`;
    }

    return basePrompt;
  }

  /**
   * Build OTB context from database
   */
  private async buildOTBContext(planId: string): Promise<OTBContext | null> {
    try {
      const plan = await this.prisma.oTBPlan.findUnique({
        where: { id: planId },
        include: {
          lineItems: true,
          brand: true,
          season: true,
        },
      }) as any; // Cast to any to access included relations

      if (!plan) return null;

      // Calculate metrics from line items
      const lineItems = plan.lineItems || [];
      const metrics = this.calculateMetrics(lineItems);
      const categories = this.groupByCategory(lineItems);
      const alerts = this.detectAlerts(metrics, categories);

      // Build plan name from brand/season if no versionName
      const brandName = plan.brand?.name || 'Plan';
      const seasonName = plan.season?.name || 'Season';
      const planName = plan.versionName || `${brandName} - ${seasonName}`;

      return {
        planId: plan.id,
        planName,
        brand: brandName,
        season: seasonName,
        year: plan.season?.year,
        metrics,
        categories,
        alerts,
        asOfDate: new Date().toISOString().split('T')[0],
        lastUpdated: plan.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to build OTB context: ${error}`);
      return null;
    }
  }

  /**
   * Calculate metrics from line items
   */
  private calculateMetrics(lineItems: any[]): OTBContext['metrics'] {
    if (lineItems.length === 0) {
      return {
        totalBudget: 0,
        totalUnits: 0,
        aur: 0,
        auc: 0,
        margin: 0,
        sellThrough: 0,
        buyPercentage: 0,
        salesPercentage: 0,
      };
    }

    const totalBudget = lineItems.reduce((sum, item) => sum + (item.budget || 0), 0);
    const totalUnits = lineItems.reduce((sum, item) => sum + (item.units || 0), 0);
    const totalRetail = lineItems.reduce((sum, item) => sum + (item.retailValue || 0), 0);
    const totalCost = lineItems.reduce((sum, item) => sum + (item.costValue || 0), 0);

    return {
      totalBudget,
      totalUnits,
      aur: totalUnits > 0 ? totalRetail / totalUnits : 0,
      auc: totalUnits > 0 ? totalCost / totalUnits : 0,
      margin: totalRetail > 0 ? ((totalRetail - totalCost) / totalRetail) * 100 : 0,
      sellThrough: 75, // TODO: Calculate from actual sales data
      buyPercentage: 85,
      salesPercentage: 78,
    };
  }

  /**
   * Group line items by category
   */
  private groupByCategory(lineItems: any[]): OTBContext['categories'] {
    const categoryMap = new Map<string, { budget: number; units: number; margin: number }>();

    lineItems.forEach(item => {
      const catName = item.categoryName || 'Uncategorized';
      const existing = categoryMap.get(catName) || { budget: 0, units: 0, margin: 0 };

      categoryMap.set(catName, {
        budget: existing.budget + (item.budget || 0),
        units: existing.units + (item.units || 0),
        margin: item.margin || existing.margin,
      });
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      budget: data.budget,
      units: data.units,
      margin: data.margin,
      performance: data.margin > 55 ? 'above' : data.margin < 45 ? 'below' : 'on-target',
    }));
  }

  /**
   * Detect alerts from metrics
   */
  private detectAlerts(metrics: OTBContext['metrics'], categories: OTBContext['categories']): OTBContext['alerts'] {
    const alerts: OTBContext['alerts'] = [];

    // Low margin alert
    if (metrics.margin < 40) {
      alerts.push({
        type: 'error',
        message: `Overall margin is critically low at ${metrics.margin.toFixed(1)}%`,
      });
    } else if (metrics.margin < 50) {
      alerts.push({
        type: 'warning',
        message: `Overall margin is below target at ${metrics.margin.toFixed(1)}%`,
      });
    }

    // Category-specific alerts
    categories.forEach((cat: { name: string; margin: number }) => {
      if (cat.margin < 40) {
        alerts.push({
          type: 'warning',
          message: `${cat.name} margin is low at ${cat.margin.toFixed(1)}%`,
          category: cat.name,
        });
      }
    });

    return alerts;
  }

  /**
   * Parse insights from AI response
   */
  private parseInsights(content: string): InsightDto[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: create single insight from text
      return [{
        type: 'info',
        severity: 'medium',
        title: 'AI Analysis',
        description: content,
      }];
    } catch (error) {
      this.logger.warn('Failed to parse insights JSON, returning text');
      return [{
        type: 'info',
        severity: 'medium',
        title: 'AI Analysis',
        description: content,
      }];
    }
  }

  /**
   * Save conversation to database
   */
  async saveConversation(
    userId: string,
    messages: ChatMessage[],
    response: string,
    conversationId?: string,
  ) {
    if (conversationId) {
      // Add to existing conversation
      await this.prisma.aIMessage.createMany({
        data: [
          ...messages.filter(m => m.role === 'user').map(m => ({
            conversationId,
            role: 'USER' as const,
            content: m.content,
          })),
          {
            conversationId,
            role: 'ASSISTANT' as const,
            content: response,
          },
        ],
      });
      return conversationId;
    }

    // Create new conversation
    const conversation = await this.prisma.aIConversation.create({
      data: {
        userId,
        title: messages[0]?.content.substring(0, 50) || 'New conversation',
        messages: {
          create: [
            ...messages.filter(m => m.role === 'user').map(m => ({
              role: 'USER' as const,
              content: m.content,
            })),
            {
              role: 'ASSISTANT' as const,
              content: response,
            },
          ],
        },
      },
    });

    return conversation.id;
  }
}
