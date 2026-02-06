export const runtime = 'nodejs';

import { streamText } from 'ai';
import { openai, DEFAULT_MODEL } from '@/lib/ai/config';
import { getSystemPrompt, getContextPrompt, getDataPrompt, ChatContext } from '@/lib/ai/prompts';
import {
  parseQuery,
  getBudgetSummary,
  getSKUSummary,
  getOTBSummary,
  getBrands,
  getSeasons,
} from '@/lib/ai/actions';
import { auth } from '@/lib/auth';
import { getLocale, getErrorMessage, type Locale } from '@/lib/i18n';

export const maxDuration = 30;

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: ChatContext & { locale?: Locale };
}

// GET handler for loading conversations (returns empty array for now)
export async function GET() {
  // Return empty conversations array - conversation persistence can be added later
  return new Response(
    JSON.stringify([]),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// DELETE handler for removing conversations (placeholder)
export async function DELETE() {
  // Conversation deletion - will be implemented with persistence
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function POST(req: Request) {
  // Get locale from cookie/header
  const locale = await getLocale();

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(getErrorMessage('UNAUTHORIZED', locale), { status: 401 });
    }

    const { messages, context = {} }: ChatRequest = await req.json();

    // Use locale from context if provided, otherwise use detected locale
    const requestLocale = context.locale || locale;

    if (!messages || messages.length === 0) {
      return new Response(getErrorMessage('NO_MESSAGES', requestLocale), { status: 400 });
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return new Response(getErrorMessage('INVALID_MESSAGE_FORMAT', requestLocale), { status: 400 });
    }

    // Parse query to determine what data to fetch
    const queryAnalysis = parseQuery(lastMessage.content);

    // Fetch relevant data based on query
    const dataContext: Record<string, unknown> = {};

    // Get brands and seasons for context
    const [brands, seasons] = await Promise.all([
      getBrands(),
      getSeasons(),
    ]);

    // Find brand ID if mentioned
    let brandId: string | undefined;
    if (queryAnalysis.brandHint) {
      const brand = brands.find((b: { id: string; name: string; code: string }) =>
        b.name.toLowerCase().includes(queryAnalysis.brandHint!.toLowerCase())
      );
      brandId = brand?.id;
    }

    // Find season ID if mentioned
    let seasonId: string | undefined;
    if (queryAnalysis.seasonHint) {
      const season = seasons.find((s: { id: string; code: string }) =>
        s.code.toLowerCase() === queryAnalysis.seasonHint!.toLowerCase()
      );
      seasonId = season?.id;
    }

    const filters = { brandId, seasonId };

    // Fetch data based on query needs
    if (queryAnalysis.needsBudget) {
      const budgetData = await getBudgetSummary(filters);
      dataContext.budgets = budgetData.budgets;
      dataContext.budgetSummary = budgetData.summary;
    }

    if (queryAnalysis.needsSKU) {
      const skuData = await getSKUSummary(filters);
      dataContext.skuProposals = skuData.proposals;
      dataContext.skuSummary = skuData.summary;
    }

    if (queryAnalysis.needsOTB) {
      const otbData = await getOTBSummary(filters);
      dataContext.otbPlans = otbData.plans;
      dataContext.otbSummary = otbData.summary;
    }

    // If no specific data needed, fetch summary
    if (!queryAnalysis.needsBudget && !queryAnalysis.needsSKU && !queryAnalysis.needsOTB) {
      const [budgetData, skuData, otbData] = await Promise.all([
        getBudgetSummary(filters),
        getSKUSummary(filters),
        getOTBSummary(filters),
      ]);
      dataContext.summary = {
        budget: budgetData.summary,
        sku: skuData.summary,
        otb: otbData.summary,
      };
    }

    // Add user context
    const userContext: ChatContext = {
      ...context,
      userName: session.user.name || undefined,
      userRole: (session.user as { role?: string }).role || 'User',
      locale: requestLocale,
    };

    // Build system prompt with context (locale-aware)
    const fullSystemPrompt = getSystemPrompt(requestLocale) +
      getContextPrompt(userContext, requestLocale) +
      getDataPrompt({
        budgets: dataContext.budgets as unknown[],
        skus: dataContext.skuProposals as unknown[],
        otbPlans: dataContext.otbPlans as unknown[],
        summary: dataContext.summary as Record<string, unknown> || {
          budgetSummary: dataContext.budgetSummary,
          skuSummary: dataContext.skuSummary,
          otbSummary: dataContext.otbSummary,
        },
      }, requestLocale);

    // Stream the response
    const result = streamText({
      model: openai(DEFAULT_MODEL),
      system: fullSystemPrompt,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage('CHAT_PROCESSING_FAILED', locale),
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
