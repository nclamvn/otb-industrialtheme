import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../src/providers/anthropic.provider';

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Test response' }],
          model: 'claude-3-haiku-20240307',
          usage: { input_tokens: 10, output_tokens: 5 },
          stop_reason: 'end_turn',
        }),
        stream: vi.fn().mockImplementation(async () => ({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'content_block_delta', delta: { text: 'Hello' } };
            yield { type: 'content_block_delta', delta: { text: ' World' } };
          },
        })),
      },
    })),
  };
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    provider = new AnthropicProvider();
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('anthropic');
  });

  it('should return chat response', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'Hello' }
    ]);
    expect(response.content).toBe('Test response');
    expect(response.model).toBe('claude-3-haiku-20240307');
  });

  it('should handle system messages', async () => {
    const response = await provider.chat([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' }
    ]);
    expect(response.content).toBeDefined();
  });

  it('should stream responses', async () => {
    const chunks: string[] = [];
    for await (const chunk of provider.stream([{ role: 'user', content: 'Hello' }])) {
      if (chunk.type === 'content' && chunk.content) {
        chunks.push(chunk.content);
      }
    }
    expect(chunks.join('')).toBe('Hello World');
  });
});
