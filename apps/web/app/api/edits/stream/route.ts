import { NextRequest } from 'next/server';

// Prevent static generation - SSE endpoints must be dynamic
export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for real-time edit streaming
 * Clients subscribe to entity-specific edit events
 */
export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get('entityType');
  const entityId = req.nextUrl.searchParams.get('entityId');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'connected', entityType, entityId })}\n\n`
        )
      );

      // In production: subscribe to Redis pub/sub or database change stream
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
