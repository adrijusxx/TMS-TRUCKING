import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { Session } from 'next-auth';

/**
 * Get authenticated session or return unauthorized response
 */
export async function getAuthenticatedSession(): Promise<
  | { session: Session; companyId: string }
  | { response: NextResponse }
> {
  const session = await auth();
  
  if (!session?.user?.companyId) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return {
    session,
    companyId: session.user.companyId,
  };
}

/**
 * Standard error response handler
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string,
  status: number = 500
): NextResponse {
  console.error(defaultMessage, error);
  return NextResponse.json(
    { error: defaultMessage },
    { status }
  );
}

/**
 * Standard success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Common driver include for Prisma queries
 */
const driverInclude = {
  driver: {
    include: {
      user: true,
    },
  },
} as const;

/**
 * Common document include for Prisma queries
 */
const documentInclude = {
  document: true,
} as const;

/**
 * Combined driver and document includes
 */
export const driverWithDocumentInclude = {
  ...driverInclude,
  ...documentInclude,
} as const;

/**
 * Type guard to check if result is an error response
 */
export function isErrorResponse(
  result: { session: Session; companyId: string } | { response: NextResponse }
): result is { response: NextResponse } {
  return 'response' in result;
}

