export const runtime = 'nodejs';

// app/api/cron/keep-alive/route.ts
// Keep-alive endpoint to prevent Render cold starts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/cron/keep-alive
 *
 * Ping this endpoint every 5 minutes via UptimeRobot or cron
 * to keep the Render instance warm and prevent cold starts.
 *
 * Setup:
 * 1. Go to https://uptimerobot.com
 * 2. Create new HTTP(s) monitor
 * 3. URL: https://dafc-otb-platform.onrender.com/api/cron/keep-alive
 * 4. Interval: 5 minutes
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Quick database check to keep connection warm
    await prisma.$queryRaw`SELECT 1 as alive`;

    const duration = Date.now() - startTime;

    return NextResponse.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      dbLatency: `${duration}ms`,
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Keep-alive check failed:', error);

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

// Also allow HEAD requests for lighter pings
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
