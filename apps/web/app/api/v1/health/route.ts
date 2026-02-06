import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    api: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
  details?: Record<string, unknown>;
}

// Track start time for uptime
const startTime = Date.now();

// Check database connection
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'pass',
      message: 'Database connection successful',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      duration: Date.now() - start,
    };
  }
}

// Check memory usage
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const rssaMB = Math.round(used.rss / 1024 / 1024);

  const heapPercentage = (used.heapUsed / used.heapTotal) * 100;

  return {
    status: heapPercentage > 90 ? 'warn' : 'pass',
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercentage.toFixed(1)}%)`,
    details: {
      heapUsed: heapUsedMB,
      heapTotal: heapTotalMB,
      rss: rssaMB,
      heapPercentage: heapPercentage.toFixed(1),
    },
  };
}

// Check API responsiveness
function checkApi(): HealthCheck {
  return {
    status: 'pass',
    message: 'API is responsive',
    details: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
}

// Determine overall status
function getOverallStatus(checks: HealthStatus['checks']): HealthStatus['status'] {
  const statuses = Object.values(checks).map((c) => c.status);

  if (statuses.includes('fail')) {
    return 'unhealthy';
  }
  if (statuses.includes('warn')) {
    return 'degraded';
  }
  return 'healthy';
}

// GET /api/v1/health - Basic health check (for load balancers)
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    api: checkApi(),
  };

  const status = getOverallStatus(checks);

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: httpStatus });
}

// HEAD /api/v1/health - Quick health check
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
