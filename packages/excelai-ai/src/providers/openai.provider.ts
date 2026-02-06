/**
 * OpenAI Provider
 * Integration with OpenAI API (GPT-4, GPT-4o-mini, etc.)
 */

import OpenAI from 'openai';
import { BaseProvider } from './base.provider';
import {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  AIProviderConfig
} from './types';

export interface OpenAIConfig extends AIProviderConfig {
  apiKey?: string;
  organization?: string;
  defaultModel?: string;
}

export class OpenAIProvider extends BaseProvider {
  name = 'openai';
  private client: OpenAI | null = null;
  private openaiConfig: OpenAIConfig;

  constructor(config: OpenAIConfig = {}) {
    super(config);
    this.openaiConfig = {
      defaultModel: 'gpt-4o-mini',
      ...config,
    };
    this.initClient();
  }

  private initClient(): void {
    const apiKey = this.openaiConfig.apiKey || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-your-openai-key') {
      this.client = new OpenAI({
        apiKey,
        organization: this.openaiConfig.organization,
        timeout: this.config.timeout,
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Quick health check - list models (lightweight)
      await this.client.models.list();
      return true;
    } catch (error) {
      console.warn('OpenAI provider not available:', error);
      return false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Check API key.');
    }

    const mergedOptions = this.mergeOptions(options);
    const model = mergedOptions.model || this.openaiConfig.defaultModel || 'gpt-4o-mini';

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.maxTokens,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      model: response.model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    if (!this.client) {
      yield { type: 'error', error: 'OpenAI client not initialized' };
      return;
    }

    const mergedOptions = this.mergeOptions(options);
    const model = mergedOptions.model || this.openaiConfig.defaultModel || 'gpt-4o-mini';

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { type: 'content', content };
        }
      }

      yield { type: 'done' };
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default OpenAIProvider;
