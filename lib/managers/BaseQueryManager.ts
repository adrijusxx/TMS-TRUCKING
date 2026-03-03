import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';
import { PermissionResolutionEngine } from '@/lib/managers/PermissionResolutionEngine';
import { buildMcNumberWhereClause } from '@/lib/mc-number-filter';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';
import { handleApiError } from '@/lib/api/route-helpers';
import type { Session } from 'next-auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a single entity's GET list query.
 * Each API route defines one of these and passes it to `executeListQuery`.
 */
export interface EntityQueryConfig<T = any> {
  /** Prisma delegate key, e.g. 'truck', 'vendor', 'customer' */
  prismaModel: string;

  /** Permission required to view this entity, e.g. 'trucks.view' */
  viewPermission?: Permission;

  // ---- MC / tenant filtering ----

  /** Whether this entity uses mcNumberId relation for MC filtering (default: false) */
  useMcFilter?: boolean;

  /**
   * Some entities (Customer, Invoice) use a string `mcNumber` field
   * instead of `mcNumberId` relation. Set to true + provide a converter.
   * Handled externally by the route — BaseQueryManager won't convert.
   */
  mcFilterField?: 'mcNumberId' | 'mcNumber';

  /** Whether MC filter can produce OR clause (null-fallback pattern) */
  mcAllowNullFallback?: boolean;

  // ---- Soft deletes ----

  /** Whether this entity supports soft deletes (deletedAt). Default: true */
  hasSoftDelete?: boolean;

  // ---- Search ----

  /** Fields to search when `?search=` is provided. Each is { contains, mode: 'insensitive' }. */
  searchFields?: string[];

  /**
   * Nested search fields like `{ truck: { truckNumber: ... } }`.
   * Each entry is a dot-path, e.g. 'truck.truckNumber', 'driver.user.firstName'.
   */
  nestedSearchFields?: string[];

  // ---- Static filters ----

  /** Extra static where conditions always applied (e.g. { isActive: true }) */
  staticWhere?: Record<string, any>;

  // ---- Param-based filters ----

  /**
   * Map of query-param name → where clause field.
   * Simple equality filters: `{ status: 'status', priority: 'priority' }`.
   */
  equalityFilters?: Record<string, string>;

  /**
   * Map of query-param name → where clause field for "contains" text filters.
   * E.g. `{ make: 'make', city: 'city' }` produces `{ make: { contains: value, mode: 'insensitive' } }`.
   */
  containsFilters?: Record<string, string>;

  // ---- Ordering ----

  /** Default Prisma orderBy. E.g. `{ name: 'asc' }` or `[{ createdAt: 'desc' }]` */
  defaultOrderBy?: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[];

  /** Map of client sortBy field → Prisma field name for DataTableWrapper compatibility */
  sortFieldMap?: Record<string, string>;

  // ---- Select / Include ----

  /** Prisma `select` clause. If provided, `include` is ignored. */
  select?: Record<string, any>;

  /** Prisma `include` clause. Only used when `select` is not provided. */
  include?: Record<string, any>;

  // ---- Pagination ----

  /** Default page size. Default: 20 */
  defaultLimit?: number;

  /** Max page size. Default: 100 */
  maxLimit?: number;

  // ---- Post-processing ----

  /** Transform each item after fetch (e.g. flatten relations, add computed fields) */
  transformItem?: (item: any, session: Session) => any;

  // ---- Response ----

  /**
   * Response format. Default: 'standard'.
   * - 'standard':  `{ success, data: [...], meta: { total, page, limit, totalPages } }`
   * - 'nested':    `{ success, data: { [dataKey]: [...], pagination: { ... } } }`
   */
  responseFormat?: 'standard' | 'nested';

  /** Key name for nested response format, e.g. 'vendors', 'locations'. */
  dataKey?: string;

  // ---- Hooks ----

  /**
   * Called after base where is built but before query execution.
   * Allows adding complex, entity-specific where conditions.
   */
  buildExtraWhere?: (
    params: { searchParams: URLSearchParams; session: Session; where: Record<string, any> }
  ) => Record<string, any> | Promise<Record<string, any>>;

  /**
   * Override the role-based filter. Receives session and returns extra where conditions.
   * E.g. trucks use `getTruckFilter(createFilterContext(...))`.
   */
  roleFilter?: (session: Session) => Record<string, any>;
}

// ---------------------------------------------------------------------------
// Core query executor
// ---------------------------------------------------------------------------

/**
 * Executes a standardized list/GET query for any entity.
 *
 * Handles: auth → permission → MC filter → soft delete → search → filters →
 *          ordering → pagination → select/include → transform → response.
 *
 * @example
 * // In app/api/vendors/route.ts:
 * export const GET = (req: NextRequest) => executeListQuery(req, vendorQueryConfig);
 */
export async function executeListQuery<T = any>(
  request: NextRequest,
  config: EntityQueryConfig<T>,
): Promise<NextResponse> {
  try {
    // 1. Auth
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 },
      );
    }

    // 2. Permission
    if (config.viewPermission) {
      const hasAccess = session.user.roleId
        ? await PermissionResolutionEngine.hasPermission(session.user.id, config.viewPermission)
        : hasPermission(session.user.role as any, config.viewPermission);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 },
        );
      }
    }

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const maxLimit = config.maxLimit ?? 100;
    const defaultLimit = config.defaultLimit ?? 20;
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10)), maxLimit);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

    // 4. Base where clause
    const where: Record<string, any> = {
      companyId: session.user.companyId,
    };

    // 5. MC filter
    if (config.useMcFilter) {
      const mcWhere = await buildMcNumberWhereClause(session, request);

      if (config.mcAllowNullFallback) {
        // Complex pattern: extract OR clause for null-fallback
        const mcOrClause = (mcWhere as any).OR;
        const { OR: _mcOr, companyId: _cid, ...mcWhereRest } = mcWhere as any;
        Object.assign(where, mcWhereRest);

        // Check explicit mcNumberId param from table filter
        const mcNumberIdFilter = searchParams.get('mcNumberId');
        if (mcNumberIdFilter) {
          where.mcNumberId = mcNumberIdFilter === 'null' || mcNumberIdFilter === 'unassigned'
            ? null
            : mcNumberIdFilter;
        } else if (mcOrClause) {
          where.OR = mcOrClause;
        }
      } else {
        // Simple pattern: just spread the mc where (minus companyId we already have)
        const { companyId: _cid, ...mcWhereRest } = mcWhere as any;
        Object.assign(where, mcWhereRest);
      }
    }

    // 6. Role filter
    if (config.roleFilter) {
      Object.assign(where, config.roleFilter(session));
    }

    // 7. Soft delete filter
    if (config.hasSoftDelete !== false) {
      const includeDeleted = parseIncludeDeleted(request);
      const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);
      if (deletedFilter) {
        Object.assign(where, deletedFilter);
      }
    }

    // 8. Static where
    if (config.staticWhere) {
      Object.assign(where, config.staticWhere);
    }

    // 9. Equality filters
    if (config.equalityFilters) {
      for (const [param, field] of Object.entries(config.equalityFilters)) {
        const value = searchParams.get(param);
        if (value) {
          where[field] = value;
        }
      }
    }

    // 10. Contains filters
    if (config.containsFilters) {
      for (const [param, field] of Object.entries(config.containsFilters)) {
        const value = searchParams.get(param);
        if (value) {
          where[field] = { contains: value, mode: 'insensitive' };
        }
      }
    }

    // 11. Extra where hook
    if (config.buildExtraWhere) {
      const extra = await config.buildExtraWhere({ searchParams, session, where });
      Object.assign(where, extra);
    }

    // 12. Search
    if (search && (config.searchFields?.length || config.nestedSearchFields?.length)) {
      const searchConditions: any[] = [];

      // Flat search fields
      for (const field of config.searchFields ?? []) {
        searchConditions.push({ [field]: { contains: search, mode: 'insensitive' } });
      }

      // Nested search fields (e.g. 'truck.truckNumber' → { truck: { truckNumber: ... } })
      for (const dotPath of config.nestedSearchFields ?? []) {
        const parts = dotPath.split('.');
        let obj: any = { [parts[parts.length - 1]]: { contains: search, mode: 'insensitive' } };
        for (let i = parts.length - 2; i >= 0; i--) {
          obj = { [parts[i]]: obj };
        }
        searchConditions.push(obj);
      }

      // Merge with existing OR (e.g. from MC filter)
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // 13. Ordering
    let orderBy: any = config.defaultOrderBy ?? { createdAt: 'desc' };
    if (sortBy) {
      const mappedField = config.sortFieldMap?.[sortBy] ?? sortBy;
      orderBy = { [mappedField]: sortOrder };
    }

    // 14. Build query args
    const model = (prisma as any)[config.prismaModel];
    const queryArgs: any = {
      where,
      orderBy,
      skip,
      take: limit,
    };

    if (config.select) {
      queryArgs.select = config.select;
    } else if (config.include) {
      queryArgs.include = config.include;
    }

    // 15. Execute query + count in parallel
    const [items, total] = await Promise.all([
      model.findMany(queryArgs),
      model.count({ where }),
    ]);

    // 16. Transform
    let result = items;
    if (config.transformItem) {
      result = items.map((item: any) => config.transformItem!(item, session));
    }

    // 17. Response
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    if (config.responseFormat === 'nested' && config.dataKey) {
      return NextResponse.json({
        success: true,
        data: {
          [config.dataKey]: result,
          pagination,
        },
      });
    }

    // Standard format
    return NextResponse.json({
      success: true,
      data: result,
      meta: pagination,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
