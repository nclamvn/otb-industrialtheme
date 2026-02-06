import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../src/providers/openai.provider';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      models: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      chat: {
        completions: {
          create: vi.fn().mockImplementation(async (params) => {
            if (params.stream) {
              return {
                [Symbol.asyncIterator]: async function* () {
                  yield { choices: [{ delta: { content: 'Hello' } }] };
                  yield { choices: [{ delta: { content: ' World' } }] };
                },
              };
            }
            return {
              choices: [{ message: { content: 'Test response' }, finish_reason: 'stop' }],
              model: 'gpt-4o-mini',
              usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
            };
          }),
        },
      },
    })),
  };
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    provider = new OpenAIProvider();
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('openai');
  });

  it('should check availability', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  it('should return chat response', async () => {
    const response = await provider.chat([
      { role: 'user', content: 'Hello' }
    ]);
    expect(response.content).toBe('Test response');
    expect(response.model).toBe('gpt-4o-mini');
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
