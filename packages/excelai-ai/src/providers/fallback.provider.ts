/**
 * Fallback Provider
 * Automatically switches between providers on failure
 */

import { BaseProvider } from './base.provider';
import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  AIProviderConfig
} from './types';

export interface FallbackConfig extends AIProviderConfig {
  providers: AIProvider[];
  retryDelay?: number; // ms between retries
}

export class FallbackProvider extends BaseProvider {
  name = 'fallback';
  private providers: AIProvider[];
  private retryDelay: number;
  private lastWorkingProvider: AIProvider | null = null;

  constructor(config: FallbackConfig) {
    super(config);
    this.providers = config.providers;
    this.retryDelay = config.retryDelay || 500;
  }

  async isAvailable(): Promise<boolean> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get providers in order (prefer last working one)
   */
  private getOrderedProviders(): AIProvider[] {
    if (this.lastWorkingProvider) {
      const others = this.providers.filter(p => p !== this.lastWorkingProvider);
      return [this.lastWorkingProvider, ...others];
    }
    return this.providers;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const errors: Error[] = [];

    for (const provider of this.getOrderedProviders()) {
      try {
        if (await provider.isAvailable()) {
          const response = await provider.chat(messages, options);
          this.lastWorkingProvider = provider;
          return response;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        errors.push(error instanceof Error ? error : new Error(String(error)));

        // Wait before trying next provider
        await this.delay(this.retryDelay);
      }
    }

    throw new Error(`All providers failed. Errors: ${errors.map(e => e.message).join(', ')}`);
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    const errors: string[] = [];

    for (const provider of this.getOrderedProviders()) {
      try {
        if (await provider.isAvailable()) {
          let hasContent = false;

          for await (const chunk of provider.stream(messages, options)) {
            if (chunk.type === 'error') {
              throw new Error(chunk.error);
            }

            if (chunk.type === 'content') {
              hasContent = true;
            }

            yield chunk;
          }

          if (hasContent) {
            this.lastWorkingProvider = provider;
            return;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`Provider ${provider.name} stream failed:`, errorMsg);
        errors.push(`${provider.name}: ${errorMsg}`);

        await this.delay(this.retryDelay);
      }
    }

    yield { type: 'error', error: `All providers failed: ${errors.join('; ')}` };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<Array<{ name: string; available: boolean }>> {
    const statuses = await Promise.all(
      this.providers.map(async provider => ({
        name: provider.name,
        available: await provider.isAvailable(),
      }))
    );
    return statuses;
  }
}

export default FallbackProvider;
