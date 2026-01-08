/**
 * Centralized MC State Manager
 * Handles all MC number state operations with proper synchronization
 * Eliminates state desync issues by using single source of truth
 * 
 * View Modes:
 * - 'all': Admin viewing all MCs (no filtering)
 * - 'filtered': Admin viewing specific selected MCs
 * - 'assigned': Employee viewing their assigned MCs (from mcAccess array)
 */

import { prisma } from '@/lib/prisma';

interface McState {
  mcNumberId: string | null; // Single MC ID (legacy, for backward compatibility)
  mcNumber: string | null; // Single MC number value (legacy)
  mcNumberIds: string[]; // Array of MC IDs being viewed
  viewMode: 'all' | 'filtered' | 'assigned';
}

export class McStateManager {
  /**
   * Gets user's accessible MC IDs from session (for quick checks)
   * Returns empty array for admins (which means access to all MCs)
   * Note: This reads from session which may be stale. Use getMcAccessFromDb() for fresh data.
   */
  static getMcAccess(session: any): string[] {
    const mcAccess = (session?.user as any)?.mcAccess;
    if (Array.isArray(mcAccess)) {
      return mcAccess;
    }
    return [];
  }

  /**
   * Gets user's accessible MC IDs from database (always fresh)
   * Returns empty array for admins (which means access to all MCs)
   * Use this when you need the latest mcAccess data
   */
  static async getMcAccessFromDb(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mcAccess: true, role: true },
      });

      if (!user) {
        return [];
      }

      // Return mcAccess array (empty for admins = access to all)
      return user.mcAccess || [];
    } catch (error) {
      console.error('[McStateManager] Error fetching mcAccess from database:', error);
      return [];
    }
  }

  /**
 * Checks if user can access a specific MC ID
 * 
 * Rules:
 * - Admins can access ALL MCs in their company (regardless of mcAccess array)
 * - Employees can only access MCs in their mcAccess array
 * - If mcAccess is empty for non-admin, they have no access
 * 
 * IMPORTANT: Reads from database to ensure fresh data
 */
  static async canAccessMc(session: any, mcId: string): Promise<boolean> {
    const userId = session?.user?.id;
    const companyId = session?.user?.companyId;
    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    console.log('[McStateManager] canAccessMc called:', { userId, companyId, isAdmin, mcId });

    if (!userId) {
      console.log('[McStateManager] canAccessMc: No userId');
      return false;
    }

    // Admins can access ANY MC in their company
    if (isAdmin && companyId) {
      // Verify the MC belongs to the same company
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: mcId,
          companyId: companyId,
          deletedAt: null,
        },
      });
      console.log('[McStateManager] canAccessMc: Admin check result:', !!mcNumber);
      return !!mcNumber;
    }

    // Non-admins: read mcAccess from database for fresh data
    const mcAccess = await this.getMcAccessFromDb(userId);
    const hasAccess = mcAccess.includes(mcId);

    console.log('[McStateManager] canAccessMc: Non-admin check:', { mcAccess, hasAccess });

    // Employees can only access MCs in their mcAccess array
    return hasAccess;
  }
  /**
   * Gets the current MC state from session and request
   * Single source of truth - checks session first, then cookies
   * Validates MC selection against user's mcAccess array
   * 
   * Logic:
   * - Admins with empty mcAccess: Can view 'all' or 'filtered' (specific MCs)
   * - Employees with mcAccess array: Always view 'assigned' (their accessible MCs)
   * - Validates all MC selections against user permissions
   * 
   * IMPORTANT: Always reads mcAccess from database to ensure fresh data
   */
  static async getMcState(session: any, request?: any): Promise<McState> {
    const userId = session?.user?.id;
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const companyId = session?.user?.companyId || session?.user?.currentCompanyId;

    // Always read mcAccess from database to ensure we have the latest data
    // This prevents issues where session is stale after admin updates user's mcAccess
    let mcAccess: string[] = [];
    if (userId) {
      mcAccess = await this.getMcAccessFromDb(userId);
    } else {
      // Fallback to session if no userId (shouldn't happen, but handle gracefully)
      console.warn('[McStateManager] No userId in session, falling back to session mcAccess');
      mcAccess = this.getMcAccess(session);
    }

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[McStateManager] User MC Access:', {
        userId,
        role: isAdmin ? 'ADMIN' : 'EMPLOYEE',
        mcAccessFromDb: mcAccess,
        mcAccessFromSession: this.getMcAccess(session),
      });
    }

    // Initialize state variables
    let mcNumberId: string | null = null;
    let mcNumber: string | null = null;
    let mcNumberIds: string[] = [];
    let viewMode: 'all' | 'filtered' | 'assigned' = 'all';

    // CASE 1: Admin - always uses cookie-based filtering for dropdown selection
    if (isAdmin) {
      // Check cookies for admin's selection
      const viewModeCookie = this.getCookieValue(request, 'mcViewMode');
      const selectedMcIdsCookie = this.getCookieValue(request, 'selectedMcNumberIds');
      const currentMcIdCookie = this.getCookieValue(request, 'currentMcNumberId');

      // Debug logging
      console.log('[McStateManager] Admin cookie values:', {
        viewModeCookie,
        currentMcIdCookie,
        selectedMcIdsCookie: selectedMcIdsCookie ? `${selectedMcIdsCookie.substring(0, 50)}...` : null,
        requestType: request ? (request.cookies ? 'NextRequest' : 'cookies()') : 'null',
      });

      if (viewModeCookie === 'all' || !viewModeCookie) {
        // Admin viewing all MCs (default)
        viewMode = 'all';
        mcNumberIds = [];
        console.log('[McStateManager] Decision: viewMode=all (no filter or explicit all)');
      } else if (viewModeCookie === 'filtered') {
        // Admin viewing specific filtered MCs - check both single and multi-select cookies
        if (currentMcIdCookie) {
          // Single MC selection
          viewMode = 'filtered';
          mcNumberIds = [currentMcIdCookie];
          console.log('[McStateManager] Decision: viewMode=filtered (single MC)', { mcNumberIds });
        } else if (selectedMcIdsCookie) {
          // Multi-MC selection
          try {
            const parsedIds = JSON.parse(selectedMcIdsCookie);
            if (Array.isArray(parsedIds) && parsedIds.length > 0) {
              viewMode = 'filtered';
              mcNumberIds = parsedIds;
              console.log('[McStateManager] Decision: viewMode=filtered (multi MC)', { mcNumberIds });
            } else {
              // Invalid selection, default to 'all'
              viewMode = 'all';
              mcNumberIds = [];
              console.log('[McStateManager] Decision: viewMode=all (invalid parsedIds)');
            }
          } catch {
            // Invalid JSON, default to 'all'
            viewMode = 'all';
            mcNumberIds = [];
            console.log('[McStateManager] Decision: viewMode=all (JSON parse error)');
          }
        } else {
          // No MC IDs found, default to 'all'
          viewMode = 'all';
          mcNumberIds = [];
          console.log('[McStateManager] Decision: viewMode=all (no MC IDs in cookies)');
        }
      } else {
        // Default to 'all' for any other case
        viewMode = 'all';
        mcNumberIds = [];
        console.log('[McStateManager] Decision: viewMode=all (unknown viewModeCookie value)');
      }
    }
    // CASE 2: Employee with mcAccess - always see their assigned MCs only
    else if (mcAccess.length > 0) {
      // Employees always see their assigned MCs (combined view)
      viewMode = 'assigned';
      mcNumberIds = [...mcAccess]; // Use all their accessible MCs
    }
    // CASE 3: User with no MC access - fallback to their default mcNumberId
    else {
      viewMode = 'assigned';
      // If no mcAccess but user has a default mcNumberId, use that
      const defaultMcNumberId = (session?.user as any)?.mcNumberId;
      if (defaultMcNumberId) {
        mcNumberIds = [defaultMcNumberId];
        console.warn('[McStateManager] User has empty mcAccess, falling back to default mcNumberId:', defaultMcNumberId);
      } else {
        mcNumberIds = [];
        console.warn('[McStateManager] User has no mcAccess and no default mcNumberId - will see no data');
      }
    }

    // Validate all MC IDs belong to company (security check)
    if (mcNumberIds.length > 0 && companyId) {
      const validation = await this.validateMcNumberIds(mcNumberIds, companyId);
      if (!validation.valid) {
        // Remove invalid IDs
        mcNumberIds = mcNumberIds.filter(id => !validation.invalidIds.includes(id));
      }
    }

    // For backward compatibility: set single mcNumberId if only one MC
    if (mcNumberIds.length === 1) {
      mcNumberId = mcNumberIds[0];
      // Fetch MC number value
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcNumberId },
        select: { number: true },
      });
      mcNumber = mcNumberRecord?.number?.trim() || null;
    }

    return {
      mcNumberId,
      mcNumber,
      mcNumberIds,
      viewMode,
    };
  }

  /**
   * Gets cookie value from request (handles both NextRequest and cookies() helper)
   */
  private static getCookieValue(request: any, cookieName: string): string | null {
    if (!request) return null;

    if (request.cookies && typeof request.cookies.get === 'function') {
      // API route - NextRequest has cookies as a Map-like object with get method
      return request.cookies.get(cookieName)?.value || null;
    } else if (typeof request.get === 'function') {
      // Server component - cookies() helper returns a cookie store with get method
      const cookieValue = request.get(cookieName);
      return cookieValue?.value || null;
    }

    return null;
  }

  /**
   * Builds where clause for MC filtering using mcNumberId
   * Returns appropriate filter based on user type and view mode
   * 
   * Returns:
   * - Admin 'all' mode: { companyId } (no MC filter)
   * - Admin 'filtered' mode: { companyId, mcNumberId: { in: [...] } }
   * - Employee 'assigned' mode: { companyId, mcNumberId: { in: [...] } }
   * 
   * Note: This method now returns multi-MC format for consistency
   * Use this for all queries that need MC filtering
   */
  static async buildMcNumberWhereClause(
    session: any,
    request?: any
  ): Promise<{ companyId: string; mcNumberId?: string | { in: string[] } }> {
    const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const mcState = await this.getMcState(session, request);

    // Admin viewing all MCs - no MC filter
    if (mcState.viewMode === 'all') {
      return { companyId };
    }

    // Admin filtered mode or employee assigned mode - filter by MC array
    // Include loads with null mcNumberId as well (unassigned loads)
    if (mcState.mcNumberIds.length > 0) {
      return {
        companyId,
        OR: [
          { mcNumberId: { in: mcState.mcNumberIds } },
          { mcNumberId: null },
        ],
      } as any;
    }

    // No MCs accessible - return empty filter (no results)
    return {
      companyId,
      mcNumberId: { in: [] },
    };
  }

  /**
   * Builds where clause for multi-MC filtering using mcNumberId
   * This is now an alias for buildMcNumberWhereClause for backward compatibility
   * Both methods now return the same format
   * 
   * @deprecated Use buildMcNumberWhereClause instead - both now return the same format
   */
  static async buildMultiMcNumberWhereClause(
    session: any,
    request?: any
  ): Promise<{ companyId: string; mcNumberId?: { in: string[] } }> {
    const result = await this.buildMcNumberWhereClause(session, request);

    // Ensure we always return { in: [...] } format for this method
    if (result.mcNumberId && typeof result.mcNumberId === 'string') {
      return {
        companyId: result.companyId,
        mcNumberId: { in: [result.mcNumberId] },
      };
    }

    return result as { companyId: string; mcNumberId?: { in: string[] } };
  }

  /**
   * Gets MC number values for an array of MC IDs
   */
  static async getMcNumberValues(mcNumberIds: string[]): Promise<string[]> {
    if (!mcNumberIds || mcNumberIds.length === 0) {
      return [];
    }

    const mcNumbers = await prisma.mcNumber.findMany({
      where: {
        id: { in: mcNumberIds },
      },
      select: { number: true },
    });

    return mcNumbers
      .map((mc) => mc.number?.trim())
      .filter((num): num is string => !!num);
  }

  /**
   * Validates that MC number IDs belong to the user's company
   */
  static async validateMcNumberIds(
    mcNumberIds: string[],
    companyId: string
  ): Promise<{ valid: boolean; invalidIds: string[] }> {
    if (!mcNumberIds || mcNumberIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }

    const mcNumbers = await prisma.mcNumber.findMany({
      where: {
        id: { in: mcNumberIds },
        companyId,
      },
      select: { id: true },
    });

    const validIds = new Set(mcNumbers.map((mc) => mc.id));
    const invalidIds = mcNumberIds.filter((id) => !validIds.has(id));

    return {
      valid: invalidIds.length === 0,
      invalidIds,
    };
  }

  /**
   * Sets cookies for MC state (server-side)
   */
  static setMcStateCookies(
    response: any,
    mcState: Partial<McState>
  ): void {
    const cookieOptions = {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    };

    if (mcState.mcNumberId && mcState.mcNumber) {
      response.cookies.set('currentMcNumberId', mcState.mcNumberId, cookieOptions);
      response.cookies.set('currentMcNumber', mcState.mcNumber, cookieOptions);
    } else {
      response.cookies.delete('currentMcNumberId');
      response.cookies.delete('currentMcNumber');
    }

    if (mcState.mcNumberIds && mcState.mcNumberIds.length > 0) {
      response.cookies.set(
        'selectedMcNumberIds',
        JSON.stringify(mcState.mcNumberIds),
        cookieOptions
      );
    } else {
      response.cookies.delete('selectedMcNumberIds');
    }

    if (mcState.viewMode) {
      response.cookies.set('mcViewMode', mcState.viewMode, cookieOptions);
    }
  }

  /**
   * Clears all MC state cookies
   */
  static clearMcStateCookies(response: any): void {
    response.cookies.delete('currentMcNumberId');
    response.cookies.delete('currentMcNumber');
    response.cookies.delete('selectedMcNumberIds');
    response.cookies.delete('mcViewMode');
  }
  /**
   * Finds the company's default MC number (or the first created one if no default set)
   */
  static async getCompanyDefaultMc(companyId: string): Promise<string | null> {
    try {
      // 1. Try to find explicit default
      const defaultMc = await prisma.mcNumber.findFirst({
        where: {
          companyId,
          isDefault: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (defaultMc) return defaultMc.id;

      // 2. Fallback to first created MC
      const firstMc = await prisma.mcNumber.findFirst({
        where: {
          companyId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      return firstMc ? firstMc.id : null;
    } catch (error) {
      console.error('[McStateManager] Error fetching company default MC:', error);
      return null;
    }
  }

  /**
   * Determines the effective MC ID for CREATING new records (Drivers, Trucks, etc.)
   * "The Waterfall":
   * 1. Session/Request Context (Active View)
   * 2. User's Assigned Default
   * 3. Company's Default
   */
  static async determineActiveCreationMc(session: any, request?: any): Promise<string | null> {
    try {
      if (!session?.user?.companyId) return null;

      // 1. Check active context (what is the user "viewing"?)
      const state = await this.getMcState(session, request);
      // If viewing exactly one MC, that's the context
      if (state.mcNumberId) return state.mcNumberId;
      if (state.mcNumberIds && state.mcNumberIds.length === 1) return state.mcNumberIds[0];

      // 2. Check User's Default (from Profile)
      // Note: accessing raw session property as it might not be typed in all contexts
      const userDefault = (session.user as any)?.mcNumberId;
      if (userDefault && (await this.canAccessMc(session, userDefault))) {
        return userDefault;
      }

      // 3. Check Company Default (Ultimate Fallback)
      const companyDefault = await this.getCompanyDefaultMc(session.user.companyId);
      if (companyDefault) {
        // We use the company default as the ultimate fallback
        return companyDefault;
      }

      return null;
    } catch (error) {
      console.error('[McStateManager] Error determining active creation MC:', error);
      return null;
    }
  }
}


