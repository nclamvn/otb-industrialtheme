import { createOpenAI } from '@ai-sdk/openai';

// OpenAI client configuration
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model
export const DEFAULT_MODEL = 'gpt-4o-mini';

// AI Settings
export const AI_CONFIG = {
  maxTokens: 2000,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Rate limiting
export const RATE_LIMIT = {
  maxRequestsPerMinute: 20,
  maxTokensPerDay: 100000,
};
