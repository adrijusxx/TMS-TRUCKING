import { Session } from 'next-auth';

/**
 * Build a where clause that conditionally includes soft-deleted records for admins
 * 
 * @param session - User session
 * @param includeDeleted - Whether to include soft-deleted records (default: false)
 * @returns Prisma where clause condition for deletedAt field
 * 
 * @example
 * const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
 * const where = {
 *   ...mcWhere,
 *   ...deletedFilter, // Will conditionally include deletedAt based on role and param
 * };
 */
export function buildDeletedRecordsFilter(
  session: Session | null,
  includeDeleted: boolean = false
): { deletedAt: null | { not: null } | undefined } {
  const isAdmin = session?.user?.role === 'ADMIN';
  
  // Admins can see deleted records if explicitly requested
  if (isAdmin && includeDeleted) {
    // Return undefined to not filter by deletedAt (show all records)
    return undefined as any;
  }
  
  // Default: only show non-deleted records
  return { deletedAt: null };
}

/**
 * Parse includeDeleted parameter from request
 * 
 * @param request - Next.js request object
 * @returns Boolean indicating if deleted records should be included
 */
export function parseIncludeDeleted(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const includeDeleted = searchParams.get('includeDeleted');
  return includeDeleted === 'true' || includeDeleted === '1';
}





