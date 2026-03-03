import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';

/**
 * Unified API response helpers.
 * Use these in all API routes for consistent response format.
 */

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Return a success response with data */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Return a paginated success response */
export function apiPaginated<T>(data: T[], meta: PaginationMeta) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page: meta.page,
      pageSize: meta.pageSize,
      total: meta.total,
      totalPages: meta.totalPages,
    },
  });
}

/** Return an error response from an AppError */
export function apiError(error: AppError) {
  return NextResponse.json(error.toJSON(), { status: error.statusCode });
}

/** Return a generic error response */
export function apiErrorMessage(message: string, code: string, status: number = 500) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

/** Return a 401 unauthorized response */
export function apiUnauthorized(message: string = 'Not authenticated') {
  return apiErrorMessage(message, 'UNAUTHORIZED', 401);
}

/** Return a 403 forbidden response */
export function apiForbidden(message: string = 'Insufficient permissions') {
  return apiErrorMessage(message, 'FORBIDDEN', 403);
}

/** Return a 404 not found response */
export function apiNotFound(resource: string) {
  return apiErrorMessage(`${resource} not found`, 'NOT_FOUND', 404);
}

/** Return a 400 bad request response */
export function apiBadRequest(message: string) {
  return apiErrorMessage(message, 'BAD_REQUEST', 400);
}

/**
 * Catch-all error handler for API routes.
 * Converts AppError instances to proper responses, logs unexpected errors.
 */
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiError(error);
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return apiErrorMessage(message, 'INTERNAL_ERROR', 500);
}
