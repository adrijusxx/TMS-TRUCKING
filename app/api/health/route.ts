import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint
 * Returns system health status
 */
export async function GET() {
  const startTime = Date.now();
  const health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    services: {
      database: 'healthy' | 'unhealthy';
      responseTime: number;
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'healthy',
      responseTime: 0,
    },
  };

  try {
    // Check database connection
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.responseTime = Date.now() - dbStartTime;
    health.services.database = 'healthy';
  } catch (error) {
    health.status = 'unhealthy';
    health.services.database = 'unhealthy';
    health.services.responseTime = Date.now() - startTime;
  }

  const totalResponseTime = Date.now() - startTime;

  // If database is unhealthy, return 503
  if (health.status === 'unhealthy') {
    return NextResponse.json(health, { status: 503 });
  }

  // If response time is high, mark as degraded
  if (totalResponseTime > 1000) {
    health.status = 'degraded';
  }

  // Map status to match monitoring dashboard expectations
  const responseStatus = health.status === 'healthy' ? 'ok' : health.status === 'degraded' ? 'degraded' : 'down';
  
  return NextResponse.json({
    status: responseStatus,
    timestamp: health.timestamp,
    uptime: Math.floor(health.uptime),
    services: health.services,
  }, {
    status: 200, // unhealthy case already returns 503 earlier
  });
}

