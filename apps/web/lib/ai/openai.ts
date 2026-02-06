import OpenAI from 'openai';
import { PROMPTS } from './prompts';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Model selection based on task complexity
export const MODELS = {
  FAST: 'gpt-4o-mini',           // Quick validations, classifications
  STANDARD: 'gpt-4o',            // Analysis, chat, comments
  ADVANCED: 'gpt-4o',            // Complex reasoning, summaries
} as const;

export type ModelType = keyof typeof MODELS;

// Response types
export interface AIProposalResponse {
  proposals: {
    category: string;
    subcategory?: string;
    proposedPercentage: number;
    confidenceScore: number;
    reasoning: string;
    riskFactors: string[];
  }[];
  overallConfidence: number;
  executiveSummary: string;
}

export interface AICommentResponse {
  comments: {
    tone: 'data-driven' | 'strategic' | 'conservative';
    content: string;
  }[];
}

export interface AISummaryResponse {
  overview: {
    totalBudget: string;
    utilization: string;
    skuCount: number;
  };
  keyDecisions: string[];
  riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH';
  riskDetails: string[];
  recommendation: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  recommendationDetails: string;
}

export interface SKUEnrichmentResponse {
  demandPrediction: 'HIGH' | 'MEDIUM' | 'LOW';
  demandScore: number;
  recommendedQuantity: number;
  quantityReasoning: string;
  similarSKUs: {
    skuCode: string;
    season: string;
    sellThrough: number;
  }[];
  riskFactors: string[];
  insights: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Generate OTB Proposal
export async function generateOTBProposal(context: {
  brand: string;
  season: string;
  budget: number;
  historicalData: {
    category: string;
    subcategory?: string;
    historicalPct: number;
    historicalValue: number;
    yoyGrowth?: number;
  }[];
}): Promise<AIProposalResponse> {
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.STANDARD,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: PROMPTS.SYSTEM_PROPOSAL,
        },
        {
          role: 'user',
          content: `
Brand: ${context.brand}
Season: ${context.season}
Total Budget: $${context.budget.toLocaleString()}

Historical Data:
${JSON.stringify(context.historicalData, null, 2)}

Please generate optimal % Buy allocation proposals for each category.
Return response as JSON with this structure:
{
  "proposals": [
    {
      "category": "string",
      "subcategory": "string or null",
      "proposedPercentage": number,
      "confidenceScore": number (0-100),
      "reasoning": "string",
      "riskFactors": ["string"]
    }
  ],
  "overallConfidence": number (0-100),
  "executiveSummary": "string"
}
          `,
        },
      ],
    });

    const _latencyMs = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    const result = JSON.parse(content) as AIProposalResponse;
    return result;
  } catch (error) {
    console.error('Error generating OTB proposal:', error);
    throw error;
  }
}

// Generate Comment Options
export async function generateComments(context: {
  category: string;
  subcategory?: string;
  historicalPct: number;
  systemProposedPct: number;
  userPct: number;
  variance: number;
}): Promise<AICommentResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.STANDARD,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: PROMPTS.COMMENT_GENERATOR,
        },
        {
          role: 'user',
          content: `
Category: ${context.category}${context.subcategory ? ` > ${context.subcategory}` : ''}
Historical %: ${context.historicalPct}%
System Proposed %: ${context.systemProposedPct}%
User's %: ${context.userPct}%
Variance from System: ${context.variance > 0 ? '+' : ''}${context.variance}%

Generate 3 professional comment options to justify this allocation decision.
Return as JSON:
{
  "comments": [
    { "tone": "data-driven", "content": "string" },
    { "tone": "strategic", "content": "string" },
    { "tone": "conservative", "content": "string" }
  ]
}
          `,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content) as AICommentResponse;
  } catch (error) {
    console.error('Error generating comments:', error);
    throw error;
  }
}

// Generate Executive Summary
export async function generateExecutiveSummary(context: {
  brand: string;
  season: string;
  totalBudget: number;
  plannedValue: number;
  totalSKUs: number;
  newSKUs: number;
  carryoverSKUs: number;
  keyAllocations: {
    category: string;
    percentage: number;
    change: number;
    reason?: string;
  }[];
  anomalies: string[];
}): Promise<AISummaryResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.ADVANCED,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: PROMPTS.EXECUTIVE_SUMMARY,
        },
        {
          role: 'user',
          content: `
Brand: ${context.brand}
Season: ${context.season}
Total Budget: $${context.totalBudget.toLocaleString()}
Planned Value: $${context.plannedValue.toLocaleString()}
Budget Utilization: ${((context.plannedValue / context.totalBudget) * 100).toFixed(1)}%

SKU Breakdown:
- Total SKUs: ${context.totalSKUs}
- New SKUs: ${context.newSKUs}
- Carryover SKUs: ${context.carryoverSKUs}

Key Allocation Changes:
${context.keyAllocations.map((a) => `- ${a.category}: ${a.percentage}% (${a.change > 0 ? '+' : ''}${a.change}%)${a.reason ? ` - ${a.reason}` : ''}`).join('\n')}

Anomalies/Warnings:
${context.anomalies.length > 0 ? context.anomalies.map((a) => `- ${a}`).join('\n') : '- None identified'}

Generate an executive summary for Board of Directors review.
Return as JSON:
{
  "overview": {
    "totalBudget": "string formatted",
    "utilization": "string formatted",
    "skuCount": number
  },
  "keyDecisions": ["string"],
  "riskAssessment": "LOW" | "MEDIUM" | "HIGH",
  "riskDetails": ["string"],
  "recommendation": "APPROVE" | "REJECT" | "REQUEST_CHANGES",
  "recommendationDetails": "string"
}
          `,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content) as AISummaryResponse;
  } catch (error) {
    console.error('Error generating executive summary:', error);
    throw error;
  }
}

// Enrich SKU with AI
export async function enrichSKU(context: {
  skuCode: string;
  styleName: string;
  category: string;
  subcategory?: string;
  gender: string;
  retailPrice: number;
  costPrice: number;
  orderQuantity: number;
  historicalSKUs?: {
    skuCode: string;
    season: string;
    sellThrough: number;
    category: string;
  }[];
}): Promise<SKUEnrichmentResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.STANDARD,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: PROMPTS.SKU_ENRICHMENT,
        },
        {
          role: 'user',
          content: `
SKU: ${context.skuCode}
Style: ${context.styleName}
Category: ${context.category}${context.subcategory ? ` > ${context.subcategory}` : ''}
Gender: ${context.gender}
Retail Price: $${context.retailPrice}
Cost Price: $${context.costPrice}
Margin: ${(((context.retailPrice - context.costPrice) / context.retailPrice) * 100).toFixed(1)}%
Current Order Qty: ${context.orderQuantity}

Historical Similar SKUs:
${context.historicalSKUs?.map((s) => `- ${s.skuCode} (${s.season}): ${s.sellThrough}% sell-through`).join('\n') || 'No historical data available'}

Analyze this SKU and provide demand prediction and recommendations.
Return as JSON:
{
  "demandPrediction": "HIGH" | "MEDIUM" | "LOW",
  "demandScore": number (0-100),
  "recommendedQuantity": number,
  "quantityReasoning": "string",
  "similarSKUs": [{ "skuCode": "string", "season": "string", "sellThrough": number }],
  "riskFactors": ["string"],
  "insights": "string"
}
          `,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content) as SKUEnrichmentResponse;
  } catch (error) {
    console.error('Error enriching SKU:', error);
    throw error;
  }
}

// Chat with AI Assistant
export async function chat(
  messages: ChatMessage[],
  context?: {
    brand?: string;
    season?: string;
    currentPage?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<string> {
  try {
    let systemPrompt = PROMPTS.CHAT_ASSISTANT;

    if (context) {
      systemPrompt += `\n\nCurrent Context:
- Brand: ${context.brand || 'Not specified'}
- Season: ${context.season || 'Not specified'}
- Page: ${context.currentPage || 'Not specified'}
${context.additionalData ? `- Additional Data: ${JSON.stringify(context.additionalData)}` : ''}`;
    }

    const response = await openai.chat.completions.create({
      model: MODELS.STANDARD,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return content;
  } catch (error) {
    console.error('Error in chat:', error);
    throw error;
  }
}

// Log AI interaction for analytics
export interface AIInteractionLog {
  userId: string;
  action: string;
  context?: Record<string, unknown>;
  result?: Record<string, unknown>;
  latencyMs?: number;
  error?: string;
}

export async function logAIInteraction(_log: AIInteractionLog): Promise<void> {
  // TODO: In production, store to database for analytics
}

// Quick classification (using fast model)
export async function classify(
  text: string,
  categories: string[]
): Promise<{ category: string; confidence: number }> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.FAST,
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `Classify the following text into one of these categories: ${categories.join(', ')}

Text: "${text}"

Return JSON: { "category": "string", "confidence": number (0-100) }`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error classifying:', error);
    throw error;
  }
}
