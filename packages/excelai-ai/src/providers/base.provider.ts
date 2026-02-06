/**
 * Base Provider
 * Common functionality for all AI providers
 */

import { AIProvider, ChatMessage, ChatOptions, ChatResponse, StreamChunk, AIProviderConfig } from './types';

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig = {}) {
    this.config = {
      defaultTemperature: 0.7,
      defaultMaxTokens: 1024,
      timeout: 30000,
      ...config,
    };
  }

  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  abstract stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  abstract isAvailable(): Promise<boolean>;

  /**
   * Merge options with defaults
   */
  protected mergeOptions(options?: ChatOptions): ChatOptions {
    return {
      temperature: this.config.defaultTemperature,
      maxTokens: this.config.defaultMaxTokens,
      ...options,
    };
  }

  /**
   * Format messages for logging (truncate content)
   */
  protected formatMessagesForLog(messages: ChatMessage[]): string {
    return messages.map(m => {
      const content = m.content.length > 100
        ? m.content.substring(0, 100) + '...'
        : m.content;
      return `[${m.role}]: ${content}`;
    }).join('\n');
  }
}
