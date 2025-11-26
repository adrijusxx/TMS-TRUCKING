import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Validate configuration before creating handler
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is missing! Authentication will not work.');
  console.error('Please set NEXTAUTH_SECRET in your environment variables.');
}

const handler = NextAuth(authOptions);

export const { handlers, auth } = handler;

// Export handlers with proper typing for Next.js 16
export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}

