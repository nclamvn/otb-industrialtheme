import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'providers/index': 'src/providers/index.ts',
    'context/index': 'src/context/index.ts',
    'prompts/index': 'src/prompts/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['openai', '@anthropic-ai/sdk'],
});
