// app/api/ai/test/route.ts
// AI Configuration Test Endpoint
// This endpoint tests OpenAI API connectivity without requiring authentication

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TestResult {
  status: 'success' | 'error' | 'no_key';
  hasKey: boolean;
  keyPrefix?: string;
  model?: string;
  response?: string;
  latencyMs?: number;
  error?: string;
  errorType?: string;
  timestamp: string;
  checks: {
    envVariable: boolean;
    keyFormat: boolean;
    apiConnection: boolean;
    modelAccess: boolean;
  };
  recommendations?: string[];
}

export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  const result: TestResult = {
    status: 'error',
    hasKey: false,
    timestamp: new Date().toISOString(),
    checks: {
      envVariable: false,
      keyFormat: false,
      apiConnection: false,
      modelAccess: false,
    },
    recommendations: [],
  };

  try {
    // Check 1: Environment variable exists
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      result.status = 'no_key';
      result.hasKey = false;
      result.error = 'OPENAI_API_KEY environment variable is not set';
      result.recommendations = [
        'Go to Render Dashboard → Environment',
        'Add OPENAI_API_KEY with your OpenAI API key',
        'The key should start with sk-proj- or sk-',
        'Save and wait for automatic redeploy',
      ];
      return NextResponse.json(result, { status: 200 });
    }

    result.hasKey = true;
    result.checks.envVariable = true;

    // Check 2: Key format
    const keyPrefix = apiKey.substring(0, 10) + '...';
    result.keyPrefix = keyPrefix;

    if (apiKey.startsWith('sk-proj-')) {
      result.checks.keyFormat = true;
    } else if (apiKey.startsWith('sk-')) {
      result.checks.keyFormat = true;
      result.recommendations?.push('Consider upgrading to a project-based API key (sk-proj-*)');
    } else {
      result.error = 'Invalid API key format. Key should start with sk- or sk-proj-';
      result.recommendations = ['Verify your API key from https://platform.openai.com/api-keys'];
      return NextResponse.json(result, { status: 200 });
    }

    // Check 3: API Connection
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Check 4: Model Access - Make a simple completion request
    const model = 'gpt-4o-mini'; // Use a lightweight model for testing
    result.model = model;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a test assistant. Respond with exactly: "AI is working!"',
        },
        {
          role: 'user',
          content: 'Test',
        },
      ],
      max_tokens: 20,
      temperature: 0,
    });

    result.checks.apiConnection = true;
    result.checks.modelAccess = true;

    const responseText = completion.choices[0]?.message?.content || '';
    result.response = responseText;
    result.status = 'success';
    result.latencyMs = Date.now() - startTime;

    // Clear recommendations if successful
    result.recommendations = [];

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    result.latencyMs = Date.now() - startTime;

    if (error instanceof OpenAI.APIError) {
      result.errorType = error.type || 'api_error';
      result.error = error.message;

      switch (error.status) {
        case 401:
          result.error = 'Invalid API key - authentication failed';
          result.recommendations = [
            'Verify your API key is correct',
            'Generate a new key at https://platform.openai.com/api-keys',
            'Make sure the key has not been revoked',
          ];
          break;
        case 403:
          result.error = 'Access forbidden - check API key permissions';
          result.recommendations = [
            'Verify your API key has the required permissions',
            'Check if your OpenAI account is in good standing',
          ];
          break;
        case 429:
          result.error = 'Rate limit exceeded or quota exhausted';
          result.recommendations = [
            'Check your OpenAI usage at https://platform.openai.com/usage',
            'Verify billing is set up correctly',
            'Wait a moment and try again',
          ];
          break;
        case 500:
        case 502:
        case 503:
          result.error = 'OpenAI service temporarily unavailable';
          result.checks.apiConnection = true; // We reached OpenAI
          result.recommendations = ['Try again in a few minutes'];
          break;
        default:
          result.recommendations = [
            'Check OpenAI status at https://status.openai.com',
            'Review the error message for more details',
          ];
      }
    } else if (error instanceof Error && 'code' in error && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
      result.error = 'Network error - cannot reach OpenAI API';
      result.errorType = 'network_error';
      result.recommendations = [
        'Check network connectivity',
        'Verify firewall settings allow outbound HTTPS',
      ];
    } else {
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      result.errorType = 'unknown_error';
    }

    return NextResponse.json(result, { status: 200 });
  }
}

// Also support POST for testing with custom messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const testMessage = body.message || 'Hello, can you confirm you are working?';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        error: 'OPENAI_API_KEY not configured',
        hasKey: false,
      }, { status: 200 });
    }

    const openai = new OpenAI({ apiKey });
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for DAFC OTB Platform. Keep responses brief.',
        },
        {
          role: 'user',
          content: testMessage,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return NextResponse.json({
      status: 'success',
      hasKey: true,
      message: testMessage,
      response: completion.choices[0]?.message?.content,
      model: completion.model,
      latencyMs: Date.now() - startTime,
      usage: completion.usage,
    }, { status: 200 });

  } catch (error: unknown) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      hasKey: !!process.env.OPENAI_API_KEY,
    }, { status: 200 });
  }
}
