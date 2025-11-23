/**
 * Centralized MC State Manager
 * Handles all MC number state operations with proper synchronization
 * Eliminates state desync issues by using single source of truth
 */

import { prisma } from '@/lib/prisma';

export interface McState {
  mcNumberId: string | null;
  mcNumber: string | null;
  mcNumberIds: string[]; // For multi-select
  viewMode: 'current' | 'all' | 'multi';
}

export class McStateManager {
  /**
   * Gets the current MC state from session and request
   * Single source of truth - checks session first, then cookies
   */
  static async getMcState(session: any, request?: any): Promise<McState> {
    // Try to get from session first (most authoritative)
    let mcNumberId = (session?.user as any)?.mcNumberId || null;
    let mcNumber: string | null = (session?.user as any)?.mcNumber || null;
    let mcNumberIds: string[] = (session?.user as any)?.mcNumberIds || [];
    let viewMode: 'current' | 'all' | 'multi' = 'current';

    // If not in session, try to get from cookies (for API routes or server components)
    if (!mcNumberId && request) {
      mcNumberId = this.getCookieValue(request, 'currentMcNumberId');
      mcNumber = this.getCookieValue(request, 'currentMcNumber');
      
      // Check for multi-select MC IDs
      const multiMcIdsCookie = this.getCookieValue(request, 'selectedMcNumberIds');
      if (multiMcIdsCookie) {
        try {
          mcNumberIds = JSON.parse(multiMcIdsCookie);
          if (Array.isArray(mcNumberIds) && mcNumberIds.length > 0) {
            viewMode = 'multi';
          }
        } catch {
          mcNumberIds = [];
        }
      }

      // Check view mode cookie
      const viewModeCookie = this.getCookieValue(request, 'mcViewMode');
      if (viewModeCookie === 'all') {
        viewMode = 'all';
      } else if (viewModeCookie === 'multi' && mcNumberIds.length > 0) {
        viewMode = 'multi';
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

    // If multi-select is active, don't use single MC
    if (viewMode === 'multi' && mcNumberIds.length > 0) {
      mcNumberId = null;
      mcNumber = null;
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
   * Builds where clause for single MC filtering
   */
  static async buildMcNumberWhereClause(
    session: any,
    request?: any
  ): Promise<{ companyId: string; mcNumber?: string }> {
    const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const mcState = await this.getMcState(session, request);

    // If "all MCs" mode, don't filter by MC number
    if (mcState.viewMode === 'all') {
      return { companyId };
    }

    // If multi-select mode, return base filter (will be handled by buildMultiMcNumberWhereClause)
    if (mcState.viewMode === 'multi') {
      return { companyId };
    }

    // Single MC mode
    const whereClause: any = { companyId };
    if (mcState.mcNumber) {
      whereClause.mcNumber = mcState.mcNumber;
    }

    return whereClause;
  }

  /**
   * Builds where clause for multi-MC filtering
   */
  static async buildMultiMcNumberWhereClause(
    session: any,
    request?: any
  ): Promise<{ companyId: string; mcNumber?: { in: string[] } }> {
    const companyId = session?.user?.companyId || session?.user?.currentCompanyId;
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const mcState = await this.getMcState(session, request);

    // If not in multi mode, fall back to single MC or all
    if (mcState.viewMode !== 'multi' || mcState.mcNumberIds.length === 0) {
      const singleClause = await this.buildMcNumberWhereClause(session, request);
      // Convert single mcNumber to { in: [mcNumber] } format if needed
      if (singleClause.mcNumber && typeof singleClause.mcNumber === 'string') {
        return {
          companyId: singleClause.companyId,
          mcNumber: { in: [singleClause.mcNumber] },
        };
      }
      return { companyId: singleClause.companyId };
    }

    // Fetch MC number values for the selected IDs
    const mcNumbers = await prisma.mcNumber.findMany({
      where: {
        id: { in: mcState.mcNumberIds },
        companyId,
      },
      select: { number: true },
    });

    const mcNumberValues = mcNumbers
      .map((mc) => mc.number?.trim())
      .filter((num): num is string => !!num);

    if (mcNumberValues.length === 0) {
      return { companyId };
    }

    const whereClause: { companyId: string; mcNumber?: { in: string[] } } = { companyId };
    if (mcNumberValues.length > 0) {
      whereClause.mcNumber = { in: mcNumberValues };
    }
    return whereClause;
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
}

