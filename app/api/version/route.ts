import { NextResponse } from 'next/server';

/**
 * Version endpoint - returns current build version and metadata.
 * Useful for health checks, monitoring, and post-deploy verification.
 */
export async function GET() {
  return NextResponse.json({
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
    commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown',
    commitShaShort: process.env.NEXT_PUBLIC_COMMIT_SHA_SHORT || 'unknown',
    buildTimestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || null,
    nodeEnv: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
  });
}
