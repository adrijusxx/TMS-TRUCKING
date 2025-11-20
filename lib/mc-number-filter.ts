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
    mcNumber = mcNumberRecord?.number?.trim() || null;
  }

  // Normalize MC number value (trim whitespace)
  if (mcNumber) {
    mcNumber = mcNumber.trim();
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

  // Check if "all MCs" mode is selected via cookie or URL parameter
  let showAllMcNumbers = false;
  if (request) {
    // Check cookie for mcViewMode=all
    let mcViewModeCookie: string | null = null;
    if (request.cookies && typeof request.cookies.get === 'function') {
      // API route - NextRequest has cookies as a Map-like object with get method
      mcViewModeCookie = request.cookies.get('mcViewMode')?.value || null;
    } else if (typeof request.get === 'function') {
      // Server component - cookies() helper returns a cookie store with get method
      const cookieValue = request.get('mcViewMode');
      mcViewModeCookie = cookieValue?.value || null;
    }
    
    if (mcViewModeCookie === 'all') {
      showAllMcNumbers = true;
    }
    
    // Also check URL search params for mc=all (fallback)
    if (!showAllMcNumbers) {
      if (request.nextUrl) {
        const mcParam = request.nextUrl.searchParams?.get('mc');
        if (mcParam === 'all') {
          showAllMcNumbers = true;
        }
      } else if (request.searchParams) {
        // Alternative: request might have searchParams directly
        const mcParam = request.searchParams.get('mc');
        if (mcParam === 'all') {
          showAllMcNumbers = true;
        }
      }
    }
  }

  // If "all MCs" is selected, don't filter by MC number
  if (showAllMcNumbers) {
    return { companyId };
  }

  const { mcNumber } = await getCurrentMcNumber(session, request);

  const whereClause: any = { companyId };
  if (mcNumber) {
    // Normalize MC number for comparison: trim whitespace
    whereClause.mcNumber = mcNumber.trim();
  }

  return whereClause;
}

/**
 * Builds a where clause for settings models that use mcNumberId instead of mcNumber
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumberId?: string | null }> - Where clause object
 */
export async function buildMcNumberIdWhereClause(session: any, request?: any): Promise<{ companyId: string; mcNumberId?: string | null }> {
  const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
  if (!companyId) {
    throw new Error('Company ID is required');
  }

  // Check if "all MCs" mode is selected via cookie or URL parameter
  let showAllMcNumbers = false;
  if (request) {
    // Check cookie for mcViewMode=all
    let mcViewModeCookie: string | null = null;
    if (request.cookies && typeof request.cookies.get === 'function') {
      // API route - NextRequest has cookies as a Map-like object with get method
      mcViewModeCookie = request.cookies.get('mcViewMode')?.value || null;
    } else if (typeof request.get === 'function') {
      // Server component - cookies() helper returns a cookie store with get method
      const cookieValue = request.get('mcViewMode');
      mcViewModeCookie = cookieValue?.value || null;
    }
    
    if (mcViewModeCookie === 'all') {
      showAllMcNumbers = true;
    }
    
    // Also check URL search params for mc=all (fallback)
    if (!showAllMcNumbers) {
      if (request.nextUrl) {
        const mcParam = request.nextUrl.searchParams?.get('mc');
        if (mcParam === 'all') {
          showAllMcNumbers = true;
        }
      } else if (request.searchParams) {
        // Alternative: request might have searchParams directly
        const mcParam = request.searchParams.get('mc');
        if (mcParam === 'all') {
          showAllMcNumbers = true;
        }
      }
    }
  }

  // If "all MCs" is selected, don't filter by MC number
  if (showAllMcNumbers) {
    return { companyId };
  }

  const { mcNumberId } = await getCurrentMcNumber(session, request);

  const whereClause: any = { companyId };
  if (mcNumberId) {
    whereClause.mcNumberId = mcNumberId;
  } else {
    // If no MC number is selected, only show settings that are not MC-specific (mcNumberId is null)
    whereClause.mcNumberId = null;
  }

  return whereClause;
}

