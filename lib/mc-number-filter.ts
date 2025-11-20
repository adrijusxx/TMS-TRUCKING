/**
 * Utility functions for filtering data by MC number
 */

import { prisma } from '@/lib/prisma';

/**
 * Gets the current MC number ID and value from session or cookies
 * This checks both the session and cookies for MC number selection
 */
export async function getCurrentMcNumber(session: any, request?: any): Promise<{ mcNumberId: string | null; mcNumber: string | null }> {
  // Try to get from session first
  let mcNumberId = (session?.user as any)?.mcNumberId || null;
  let mcNumber: string | null = (session?.user as any)?.mcNumber || null;

  // If not in session, try to get from cookies (for API routes or server components)
  if (!mcNumberId && request) {
    // Handle both NextRequest cookies and Next.js cookies() helper
    if (request.cookies && typeof request.cookies.get === 'function') {
      // API route - NextRequest has cookies as a Map-like object with get method
      mcNumberId = request.cookies.get('currentMcNumberId')?.value || null;
      mcNumber = request.cookies.get('currentMcNumber')?.value || null;
    } else if (typeof request.get === 'function') {
      // Server component - cookies() helper returns a cookie store with get method
      const cookieValue = request.get('currentMcNumberId');
      mcNumberId = cookieValue?.value || null;
      const mcNumberCookie = request.get('currentMcNumber');
      mcNumber = mcNumberCookie?.value || null;
    }
  }

  // If we have mcNumberId but not the value, fetch it from database
  if (mcNumberId && !mcNumber) {
    const mcNumberRecord = await prisma.mcNumber.findUnique({
      where: { id: mcNumberId },
      select: { number: true },
    });
    mcNumber = mcNumberRecord?.number || null;
  }

  return { mcNumberId, mcNumber };
}

/**
 * Builds a where clause that filters by companyId and optionally by mcNumber
 * @param companyId - The company ID
 * @param mcNumber - Optional MC number value to filter by
 * @returns A where clause object for Prisma queries
 */
export function buildMcNumberFilter(companyId: string, mcNumber?: string | null) {
  const baseFilter: any = {
    companyId,
  };

  if (mcNumber) {
    baseFilter.mcNumber = mcNumber;
  }

  return baseFilter;
}

/**
 * Gets the MC number value from session
 * Note: This is a server-side helper
 */
export function getMcNumberFromSession(session: any): string | null | undefined {
  return (session?.user as any)?.mcNumber || null;
}

/**
 * Gets the MC number value from an MC number ID
 * This should be called server-side with Prisma access
 */
export async function getMcNumberValue(mcNumberId: string | null | undefined): Promise<string | null> {
  if (!mcNumberId) return null;
  
  const mcNumber = await prisma.mcNumber.findUnique({
    where: { id: mcNumberId },
    select: { number: true },
  });
  
  return mcNumber?.number || null;
}

/**
 * Builds a where clause for queries that should filter by MC number if selected
 * This is a convenience function that combines companyId and mcNumber filtering
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumber?: string }> - Where clause object
 */
export async function buildMcNumberWhereClause(session: any, request?: any): Promise<{ companyId: string; mcNumber?: string }> {
  const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  const { mcNumber } = await getCurrentMcNumber(session, request);

  const whereClause: any = { companyId };
  if (mcNumber) {
    whereClause.mcNumber = mcNumber;
  }

  return whereClause;
}

