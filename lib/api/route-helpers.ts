import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { AppError, UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/errors';
import { ZodSchema } from 'zod';
import { logger } from '@/lib/utils/logger';
import type { Session } from 'next-auth';

/**
 * Standardized API error handler
 * Converts errors to proper API responses
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle known AppError instances
  if (error instanceof AppError) {
    logger.error('API Error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });

    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const details = zodError.issues.reduce((acc, issue) => {
      const path = issue.path.join('.');
      acc[path] = issue.message;
      return acc;
    }, {} as Record<string, string>);

    logger.error('Validation Error', { details });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      },
      { status: 400 }
    );
  }

  // Handle unknown errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  logger.error('Unexpected API Error', {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred processing your request',
      },
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, session: Session, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = await auth();

      if (!session?.user?.companyId) {
        throw new UnauthorizedError('Not authenticated');
      }

      return await handler(request, session, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wrapper for API routes that require specific permissions
 */
export function withPermission(
  permission: string,
  handler: (request: NextRequest, session: Session, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (request, session, ...args) => {
    const role = (session.user.role as any) || 'CUSTOMER';
    if (!hasPermission(role, permission as any)) {
      throw new ForbiddenError(`Insufficient permissions. Required: ${permission}`);
    }

    return await handler(request, session, ...args);
  });
}

/**
 * Wrapper for API routes that require MC filtering
 */
export function withMcFilter<T extends any[]>(
  handler: (
    request: NextRequest,
    session: Session,
    mcWhere: Record<string, unknown>,
    ...args: T
  ) => Promise<NextResponse>
) {
  return withAuth(async (request, session, ...args: any[]) => {
    const mcWhere = await buildMcNumberWhereClause(session, request);
    return await handler(request, session, mcWhere, ...(args as T));
  });
}

/**
 * Validate request body against a Zod schema
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError('Validation failed', {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  return result.data;
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Standard paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): NextResponse {
  return successResponse({
    data,
    pagination,
  });
}

/**
 * Get request body as JSON with error handling
 */
export async function getRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Get query parameters from request
 */
export function getQueryParams(request: NextRequest): URLSearchParams {
  return request.nextUrl.searchParams;
}

/**
 * Get pagination parameters from query
 */
export function getPaginationParams(request: NextRequest): { page: number; limit: number } {
  const searchParams = getQueryParams(request);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  return { page, limit };
}

/**
 * High-level API request handler that combines authentication, permission checking, and error handling
 * 
 * @param request - The NextRequest object
 * @param handler - Async function that receives session and returns data
 * @param options - Optional configuration for permission checking and logging
 * @returns NextResponse with formatted data or error
 */
export async function handleApiRequest<T = unknown>(
  request: NextRequest,
  handler: (session: Session) => Promise<T>,
  options?: {
    permission?: string;
    loggable?: boolean;
  }
): Promise<NextResponse> {
  try {
    // Authenticate user
    const session = await auth();

    if (!session?.user?.companyId) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Check permission if provided
    if (options?.permission) {
      const role = (session.user.role as any) || 'CUSTOMER';
      if (!hasPermission(role, options.permission as any)) {
        throw new ForbiddenError(`Insufficient permissions. Required: ${options.permission}`);
      }
    }

    // Log request if loggable is enabled
    if (options?.loggable) {
      logger.info('API Request', {
        path: request.nextUrl.pathname,
        method: request.method,
        userId: session.user.id,
        companyId: session.user.companyId,
      });
    }

    // Execute handler and get data
    const data = await handler(session);

    // Return success response with data
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

