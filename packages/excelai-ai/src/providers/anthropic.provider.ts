/**
 * Anthropic Provider
 * Integration with Anthropic API (Claude models)
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider';
import {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  AIProviderConfig
} from './types';

export interface AnthropicConfig extends AIProviderConfig {
  apiKey?: string;
  defaultModel?: string;
}

export class AnthropicProvider extends BaseProvider {
  name = 'anthropic';
  private client: Anthropic | null = null;
  private anthropicConfig: AnthropicConfig;

  constructor(config: AnthropicConfig = {}) {
    super(config);
    this.anthropicConfig = {
      defaultModel: 'claude-3-haiku-20240307',
      ...config,
    };
    this.initClient();
  }

  private initClient(): void {
    const apiKey = this.anthropicConfig.apiKey || process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your-anthropic-key') {
      this.client = new Anthropic({
        apiKey,
        timeout: this.config.timeout,
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Quick health check with minimal tokens
      await this.client.messages.create({
        model: this.anthropicConfig.defaultModel || 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      console.warn('Anthropic provider not available:', error);
      return false;
    }
  }

  /**
   * Convert messages to Anthropic format
   * Anthropic requires system message to be separate
   */
  private convertMessages(messages: ChatMessage[]): {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  } {
    let system: string | undefined;
    const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
      } else {
        anthropicMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return { system, messages: anthropicMessages };
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. Check API key.');
    }

    const mergedOptions = this.mergeOptions(options);
    const model = mergedOptions.model || this.anthropicConfig.defaultModel || 'claude-3-haiku-20240307';
    const { system, messages: anthropicMessages } = this.convertMessages(messages);

    const response = await this.client.messages.create({
      model,
      max_tokens: mergedOptions.maxTokens || 1024,
      system,
      messages: anthropicMessages,
    });

    const content = response.content[0];

    return {
      content: content.type === 'text' ? content.text : '',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || undefined,
    };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    if (!this.client) {
      yield { type: 'error', error: 'Anthropic client not initialized' };
      return;
    }

    const mergedOptions = this.mergeOptions(options);
    const model = mergedOptions.model || this.anthropicConfig.defaultModel || 'claude-3-haiku-20240307';
    const { system, messages: anthropicMessages } = this.convertMessages(messages);

    try {
      const stream = await this.client.messages.stream({
        model,
        max_tokens: mergedOptions.maxTokens || 1024,
        system,
        messages: anthropicMessages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            yield { type: 'content', content: delta.text };
          }
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

export default AnthropicProvider;
