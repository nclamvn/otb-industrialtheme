import { NextRequest } from 'next/server';

// Prevent static generation - SSE endpoints must be dynamic
export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for global edit feed
 * Used by NotificationCenter to show real-time edit notifications
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'feed_connected' })}\n\n`)
      );

      // In production: subscribe to Redis pub/sub for all edit events
      // For now: send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
