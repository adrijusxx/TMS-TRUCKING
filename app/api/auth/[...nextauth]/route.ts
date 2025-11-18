import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';

const handler = NextAuth(authOptions);

export const { handlers, auth } = handler;

// Export handlers with proper typing for Next.js 16
export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}

