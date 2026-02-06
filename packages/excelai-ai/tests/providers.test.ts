import { describe, it, expect } from 'vitest';
import { BaseProvider, ChatMessage, ChatOptions, ChatResponse, StreamChunk } from '../src/providers';

// Mock provider for testing
class MockProvider extends BaseProvider {
  name = 'mock';

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    return {
      content: 'Mock response',
      model: 'mock-model',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    };
  }

  async *stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    yield { type: 'content', content: 'Hello ' };
    yield { type: 'content', content: 'World' };
    yield { type: 'done' };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

describe('BaseProvider', () => {
  const provider = new MockProvider();

  it('should have a name', () => {
    expect(provider.name).toBe('mock');
  });

  it('should return chat response', async () => {
    const response = await provider.chat([{ role: 'user', content: 'Hello' }]);
    expect(response.content).toBe('Mock response');
    expect(response.model).toBe('mock-model');
  });

  it('should stream responses', async () => {
    const chunks: StreamChunk[] = [];
    for await (const chunk of provider.stream([{ role: 'user', content: 'Hello' }])) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(3);
    expect(chunks[0].content).toBe('Hello ');
    expect(chunks[1].content).toBe('World');
    expect(chunks[2].type).toBe('done');
  });

  it('should check availability', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });
});
