/**
 * Utility functions for filtering data by MC number
 * Now uses McStateManager for centralized state management
 */

import { prisma } from '@/lib/prisma';
import { McStateManager } from '@/lib/managers/McStateManager';

/**
 * Converts mcNumberId filter to mcNumber string filter for models that still use mcNumber string
 * (e.g., Customer, Invoice, InvoiceBatch)
 * @param mcWhere - The where clause from buildMcNumberWhereClause (contains mcNumberId)
 * @returns A where clause with mcNumber string instead of mcNumberId
 */
export async function convertMcNumberIdToMcNumberString(
  mcWhere: { companyId: string; mcNumberId?: string | { in: string[] } }
): Promise<{ companyId: string; mcNumber?: string | { in: string[] } }> {
  const result: { companyId: string; mcNumber?: string | { in: string[] } } = {
    companyId: mcWhere.companyId,
  };

  if (mcWhere.mcNumberId) {
    if (typeof mcWhere.mcNumberId === 'string') {
      const mcNumber = await prisma.mcNumber.findUnique({
        where: { id: mcWhere.mcNumberId },
        select: { number: true },
      });
      if (mcNumber?.number) {
        result.mcNumber = mcNumber.number.trim();
      }
    } else if (typeof mcWhere.mcNumberId === 'object' && 'in' in mcWhere.mcNumberId) {
      const mcNumbers = await prisma.mcNumber.findMany({
        where: { id: { in: mcWhere.mcNumberId.in }, companyId: mcWhere.companyId },
        select: { number: true },
      });
      const mcNumberValues = mcNumbers.map(mc => mc.number?.trim()).filter((n): n is string => !!n);
      if (mcNumberValues.length > 0) {
        result.mcNumber = { in: mcNumberValues };
      }
    }
  }

  return result;
}


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
 * Builds a where clause for queries that should filter by MC number
 * Now uses McStateManager for centralized state management
 * 
 * Returns:
 * - Admin 'all' mode: { companyId } (no MC filter)
 * - Admin 'filtered' mode: { companyId, mcNumberId: { in: [...] } }
 * - Employee 'assigned' mode: { companyId, mcNumberId: { in: [...] } }
 * 
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumberId?: string | { in: string[] } }> - Where clause object
 */
export async function buildMcNumberWhereClause(
  session: any, 
  request?: any
): Promise<{ companyId: string; mcNumberId?: string | { in: string[] } }> {
  return McStateManager.buildMcNumberWhereClause(session, request);
}

/**
 * Builds a where clause for multi-MC filtering using mcNumberId
 * 
 * @deprecated This is now an alias for buildMcNumberWhereClause - both return the same format
 * Use buildMcNumberWhereClause instead for consistency
 * 
 * @param session - The NextAuth session object
 * @param request - Optional NextRequest object to read cookies from
 * @returns Promise<{ companyId: string; mcNumberId?: { in: string[] } }> - Where clause object
 */
export async function buildMultiMcNumberWhereClause(
  session: any,
  request?: any
): Promise<{ companyId: string; mcNumberId?: { in: string[] } }> {
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

  // If "all MCs" is selected, check if user has permission
  if (showAllMcNumbers) {
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const mcAccess = McStateManager.getMcAccess(session);
    
    // Only allow "all" mode for admins with empty mcAccess
    if (isAdmin && mcAccess.length === 0) {
      return { companyId };
    }
  }

  const { mcNumberId } = await getCurrentMcNumber(session, request);

  const whereClause: { companyId: string; mcNumberId?: string } = { companyId };
  // Only include mcNumberId if it has a value and user has access
  // For required fields (Driver, Truck), we don't filter by MC number if none is selected
  // For nullable fields (Settings), the caller can add mcNumberId: null if needed
  if (mcNumberId && (await McStateManager.canAccessMc(session, mcNumberId))) {
    whereClause.mcNumberId = mcNumberId;
  }
  // If mcNumberId is null or user doesn't have access, don't include it in the filter

  return whereClause;
}

