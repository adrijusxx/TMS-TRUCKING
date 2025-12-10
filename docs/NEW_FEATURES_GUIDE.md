# New Features Guide

This guide explains how to use the new features added to the TMS codebase.

## Table of Contents

1. [Error Handling](#error-handling)
2. [API Route Helpers](#api-route-helpers)
3. [Real-Time Updates](#real-time-updates)
4. [Testing](#testing)
5. [Health Checks](#health-checks)
6. [Structured Logging](#structured-logging)

---

## Error Handling

### Overview

Standardized error handling with custom error classes that provide consistent error responses across the API.

### Error Classes

```typescript
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
} from '@/lib/errors';
```

### Usage

```typescript
// In API routes or services
import { NotFoundError, ValidationError } from '@/lib/errors';

// Throw errors - they will be automatically handled
if (!load) {
  throw new NotFoundError('Load', loadId);
}

if (!isValid) {
  throw new ValidationError('Invalid input', { field: 'status' });
}
```

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional additional details */ }
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - 400 - Input validation failed
- `NOT_FOUND` - 404 - Resource not found
- `UNAUTHORIZED` - 401 - Not authenticated
- `FORBIDDEN` - 403 - Insufficient permissions
- `CONFLICT` - 409 - Resource conflict
- `BAD_REQUEST` - 400 - Malformed request
- `INTERNAL_ERROR` - 500 - Server error

---

## API Route Helpers

### Overview

Helper functions that simplify API route implementation and reduce code duplication.

### Available Helpers

#### `withAuth()`

Wraps a route handler to require authentication.

```typescript
import { withAuth } from '@/lib/api/route-helpers';

export const GET = withAuth(async (request, session) => {
  // session is guaranteed to exist here
  return successResponse({ userId: session.user.id });
});
```

#### `withPermission()`

Wraps a route handler to require specific permission.

```typescript
import { withPermission } from '@/lib/api/route-helpers';

export const GET = withPermission('loads:read', async (request, session) => {
  // User has 'loads:read' permission
  const loads = await prisma.load.findMany({ /* ... */ });
  return successResponse(loads);
});
```

#### `withMcFilter()`

Wraps a route handler to automatically apply MC number filtering.

```typescript
import { withMcFilter } from '@/lib/api/route-helpers';

export const GET = withMcFilter(async (request, session, mcWhere) => {
  // mcWhere contains companyId and mcNumberId filters
  const loads = await prisma.load.findMany({
    where: { ...mcWhere, deletedAt: null }
  });
  return successResponse(loads);
});
```

#### `validateRequest()`

Validates request body against a Zod schema.

```typescript
import { validateRequest } from '@/lib/api/route-helpers';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const data = validateRequest(schema, body); // Throws ValidationError if invalid
  
  // data is now typed and validated
  const user = await prisma.user.create({ data });
  return successResponse(user, 201);
});
```

#### `successResponse()` and `paginatedResponse()`

Create standardized success responses.

```typescript
import { successResponse, paginatedResponse } from '@/lib/api/route-helpers';

// Simple success response
return successResponse({ message: 'Success' });

// Paginated response
return paginatedResponse(items, {
  page: 1,
  limit: 20,
  total: 100,
  totalPages: 5,
});
```

#### `getPaginationParams()`

Extract pagination parameters from query string.

```typescript
import { getPaginationParams } from '@/lib/api/route-helpers';

export const GET = withAuth(async (request, session) => {
  const { page, limit } = getPaginationParams(request);
  // page defaults to 1, limit defaults to 20, max 100
});
```

### Combining Helpers

You can combine multiple helpers:

```typescript
export const GET = withPermission(
  'loads:read',
  withMcFilter(async (request, session, mcWhere) => {
    // Has permission AND MC filtering applied
    const loads = await prisma.load.findMany({ where: mcWhere });
    return successResponse(loads);
  })
);
```

### Complete Example

See `app/api/example-refactored/route.ts` for a complete example.

---

## Real-Time Updates

### Overview

Server-Sent Events (SSE) system for real-time updates without WebSocket complexity.

### Using in Components

```typescript
'use client';

import { useRealtimeLoads } from '@/hooks/useRealtime';

export function LoadsList() {
  const { isConnected, lastEvent } = useRealtimeLoads((event) => {
    // Handle real-time events
    if (event.type === 'load:status:changed') {
      // Update UI when load status changes
      queryClient.invalidateQueries(['loads']);
    }
  });

  return (
    <div>
      {isConnected ? (
        <span className="text-green-500">Live</span>
      ) : (
        <span className="text-gray-500">Disconnected</span>
      )}
      {/* Your component UI */}
    </div>
  );
}
```

### Available Hooks

- `useRealtime()` - Generic hook for any event types
- `useRealtimeLoads()` - Load-specific events
- `useRealtimeDispatch()` - Dispatch updates
- `useRealtimeBreakdowns()` - Breakdown events

### Emitting Events

In API routes or services:

```typescript
import { emitLoadStatusChanged, emitLoadAssigned } from '@/lib/realtime/emitEvent';

// After updating a load
await prisma.load.update({
  where: { id: loadId },
  data: { status: 'DELIVERED' }
});

// Emit event
emitLoadStatusChanged(loadId, 'DELIVERED', load);
```

### Event Types

- `load:status:changed` - Load status updated
- `load:assigned` - Load assigned to driver
- `load:delivered` - Load delivered
- `driver:location:updated` - Driver location updated
- `dispatch:updated` - Dispatch board updated
- `breakdown:reported` - Breakdown reported
- `breakdown:resolved` - Breakdown resolved
- `invoice:created` - Invoice created
- `invoice:paid` - Invoice paid
- `settlement:generated` - Settlement generated
- `notification` - General notification

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

### Writing Tests

#### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ValidationError } from '@/lib/errors';

describe('MyFunction', () => {
  it('should throw ValidationError for invalid input', () => {
    expect(() => {
      throw new ValidationError('Invalid');
    }).toThrow(ValidationError);
  });
});
```

#### Integration Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/loads/route';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    load: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/loads', () => {
  it('should return loads', async () => {
    // Test implementation
  });
});
```

### Test Structure

```
tests/
├── setup.ts              # Test configuration
├── unit/                  # Unit tests
│   └── lib/
│       └── managers/
└── integration/           # Integration tests
    └── api/
```

---

## Health Checks

### Endpoint

`GET /api/health`

### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "responseTime": 5
  }
}
```

### Status Values

- `healthy` - All systems operational
- `degraded` - Some performance issues
- `unhealthy` - Critical systems down

### Usage

Use for:
- Load balancer health checks
- Monitoring systems
- Deployment verification

---

## Structured Logging

### Overview

Replace `console.log()` and `console.error()` with structured logging.

### Usage

```typescript
import { logger } from '@/lib/utils/logger';

// Different log levels
logger.debug('Debug message', { context: 'value' });
logger.info('Info message', { userId: '123' });
logger.warn('Warning message', { issue: 'something' });
logger.error('Error message', { error: errorObject });
```

### Benefits

- Consistent log format
- Log levels (debug, info, warn, error)
- Context included in logs
- Easy to integrate with log aggregation services

### Log Format

```
[2024-01-01T00:00:00.000Z] [INFO] Message {"context":"value"}
```

---

## Migration Guide

### Migrating API Routes

**Before:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }
    
    if (!hasPermission(session, 'loads:read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    
    // ... rest of logic
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}
```

**After:**

```typescript
import { withPermission, withMcFilter, successResponse } from '@/lib/api/route-helpers';

export const GET = withPermission('loads:read', withMcFilter(async (request, session, mcWhere) => {
  const loads = await prisma.load.findMany({ where: mcWhere });
  return successResponse(loads);
}));
```

### Migrating Error Handling

**Before:**

```typescript
if (!load) {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Load not found' } },
    { status: 404 }
  );
}
```

**After:**

```typescript
import { NotFoundError } from '@/lib/errors';

if (!load) {
  throw new NotFoundError('Load', loadId);
}
```

---

## Best Practices

1. **Always use route helpers** for new API routes
2. **Use error classes** instead of manual error responses
3. **Emit real-time events** for important state changes
4. **Write tests** for new features
5. **Use structured logging** instead of console.log
6. **Check health endpoint** in monitoring systems

---

## Support

For questions or issues, refer to:
- `docs/IMPLEMENTATION_PROGRESS.md` - Implementation details
- `app/api/example-refactored/route.ts` - Complete example
- Test files in `tests/` - Usage examples










