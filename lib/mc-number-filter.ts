/**
 * Utility functions for filtering data by MC number
 * Now uses McStateManager for centralized state management
 */

import { prisma } from '@/lib/prisma';
import { McStateManager } from '@/lib/managers/McStateManager';

/**
 * Gets the current MC number ID and value from session or cookies
 * This checks both the session and cookies for MC number selection
 * @deprecated Use McStateManager.getMcState() instead
 */
export async function getCurrentMcNumber(session: any, request?: any): Promise<{ mcNumberId: string | null; mcNumber: string | null }> {
  const mcState = await McStateManager.getMcState(session, request);
  return {
    mcNumberId: mcState.mcNumberId,
    mcNumber: mcState.mcNumber,
  };
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
 * Now uses McStateManager for centralized state management
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumber?: string }> - Where clause object
 */
export async function buildMcNumberWhereClause(session: any, request?: any): Promise<{ companyId: string; mcNumber?: string }> {
  // Check URL params for "all" mode (takes precedence)
  if (request) {
    let showAllMcNumbers = false;
    if (request.nextUrl) {
      const mcParam = request.nextUrl.searchParams?.get('mc');
      if (mcParam === 'all') {
        showAllMcNumbers = true;
      }
    } else if (request.searchParams) {
      const mcParam = request.searchParams.get('mc');
      if (mcParam === 'all') {
        showAllMcNumbers = true;
      }
    }

    if (showAllMcNumbers) {
      const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      return { companyId };
    }
  }

  return McStateManager.buildMcNumberWhereClause(session, request);
}

/**
 * Builds a where clause for multi-MC filtering
 * Supports filtering by multiple MC numbers
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumber?: { in: string[] } }> - Where clause object
 */
export async function buildMultiMcNumberWhereClause(
  session: any,
  request?: any
): Promise<{ companyId: string; mcNumber?: { in: string[] } }> {
  return McStateManager.buildMultiMcNumberWhereClause(session, request);
}

/**
 * Builds a where clause for settings models that use mcNumberId instead of mcNumber
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumberId?: string }> - Where clause object (mcNumberId only included if not null/undefined)
 */
export async function buildMcNumberIdWhereClause(session: any, request?: any): Promise<{ companyId: string; mcNumberId?: string }> {
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

  const whereClause: { companyId: string; mcNumberId?: string } = { companyId };
  // Only include mcNumberId if it has a value (not null or undefined)
  // For required fields (Driver, Truck), we don't filter by MC number if none is selected
  // For nullable fields (Settings), the caller can add mcNumberId: null if needed
  if (mcNumberId) {
    whereClause.mcNumberId = mcNumberId;
  }
  // If mcNumberId is null, don't include it in the filter (show all for the company)

  return whereClause;
}

