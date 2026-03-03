import { NextRequest, NextResponse } from 'next/server';
import { withAuth, successResponse } from '@/lib/api/route-helpers';

/**
 * Delete a saved filter
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ id: string }> }
) => {
  // For now, we'll use localStorage on the client side
  // In a production system, you'd want to delete from the database
  // This is a placeholder implementation

  return successResponse({ message: 'Filter deleted' });
});
