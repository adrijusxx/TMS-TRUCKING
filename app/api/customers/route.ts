import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createCustomerSchema, quickCreateCustomerSchema } from '@/lib/validations/customer';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { generateUniqueCustomerNumber } from '@/lib/utils/customer-numbering';
import { buildDeletedRecordsFilter, parseIncludeDeleted } from '@/lib/filters/deleted-records-filter';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Permission Check
    if (!hasPermission(session.user.role as any, 'customers.view')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // 3. Build MC Filter (respects admin "all" view, user MC access, current selection)
    // Note: Customer model uses mcNumber string field, not mcNumberId relation
    // We need to convert mcNumberId to mcNumber string
    const mcWhereWithId = await buildMcNumberWhereClause(session, request);

    let mcWhere: { companyId?: string; mcNumber?: string | { in: string[] } } = {
      companyId: mcWhereWithId.companyId
    };

    // Convert mcNumberId to mcNumber string for Customer model
    if (mcWhereWithId.mcNumberId) {
      if (typeof mcWhereWithId.mcNumberId === 'object' && 'in' in mcWhereWithId.mcNumberId) {
        // Multiple MC IDs - convert to mcNumber strings
        const mcNumbers = await prisma.mcNumber.findMany({
          where: { id: { in: mcWhereWithId.mcNumberId.in }, companyId: mcWhereWithId.companyId },
          select: { number: true },
        });
        const mcNumberValues = mcNumbers.map(mc => mc.number?.trim()).filter((n): n is string => !!n);
        if (mcNumberValues.length > 0) {
          mcWhere.mcNumber = { in: mcNumberValues };
        }
      } else {
        // Single MC ID - convert to mcNumber string
        const mcNumber = await prisma.mcNumber.findUnique({
          where: { id: mcWhereWithId.mcNumberId as string },
          select: { number: true },
        });
        if (mcNumber?.number) {
          mcWhere.mcNumber = mcNumber.number.trim();
        }
      }
    }

    // 4. Query with Company + MC filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const minRevenue = searchParams.get('minRevenue');

    // Parse includeDeleted parameter (admins only)
    const includeDeleted = parseIncludeDeleted(request);

    // Build deleted records filter (admins can include deleted records if requested)
    const deletedFilter = buildDeletedRecordsFilter(session, includeDeleted);

    // Build where clause
    const where: any = {
      ...mcWhere,
      isActive: true,
      ...(deletedFilter && { ...deletedFilter }), // Only add if not undefined
    };

    // Include customers with matching MC number OR no MC number (null)
    // This ensures newly created customers without MC numbers still appear
    if (mcWhere.mcNumber) {
      where.AND = [
        {
          OR: [
            { mcNumber: mcWhere.mcNumber },
            { mcNumber: null },
          ],
        },
      ];
      // Remove the direct mcNumber filter since we're using OR logic
      const { mcNumber, ...whereWithoutMcNumber } = where;
      Object.assign(where, whereWithoutMcNumber);
    }

    // Additional filters
    if (type) {
      where.type = type;
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minRevenue) {
      where.totalRevenue = { gte: parseFloat(minRevenue) };
    }

    if (search) {
      // Combine search OR with existing AND conditions
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];

      if (where.AND) {
        where.AND.push({ OR: searchConditions });
      } else {
        where.OR = searchConditions;
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          customerNumber: true,
          name: true,
          type: true,
          city: true,
          state: true,
          phone: true,
          email: true,
          paymentTerms: true,
          totalLoads: true,
          totalRevenue: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // 5. Filter Sensitive Fields (if needed - customers typically don't have sensitive fields)
    // 6. Return Success Response
    return NextResponse.json({
      success: true,
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customer list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred processing your request' },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission to create customers
    const role = session.user.role as 'ADMIN' | 'DISPATCHER' | 'ACCOUNTANT' | 'DRIVER' | 'CUSTOMER';
    if (!hasPermission(role, 'customers.create')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create customers',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a quick create (only name and email provided)
    const isQuickCreate = body.name && body.email && !body.address && !body.city && !body.state && !body.zip && !body.phone;

    let validated: any;
    let customerNumber: string;

    if (isQuickCreate) {
      // Use simplified schema for quick create
      validated = quickCreateCustomerSchema.parse(body);

      // Auto-generate customer number if not provided
      if (!validated.customerNumber) {
        try {
          customerNumber = await generateUniqueCustomerNumber(session.user.companyId);
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'GENERATION_FAILED',
                message: error instanceof Error ? error.message : 'Failed to generate unique customer number',
              },
            },
            { status: 500 }
          );
        }
      } else {
        customerNumber = validated.customerNumber;

        // Check if provided customer number already exists within this company
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            companyId: session.user.companyId,
            customerNumber
          },
        });

        if (existingCustomer) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'Customer number already exists',
              },
            },
            { status: 409 }
          );
        }
      }

      // Determine mcNumber for the new customer
      const isAdmin = (session?.user as any)?.role === 'ADMIN';
      const mcState = await McStateManager.getMcState(session, request);
      let customerMcNumber: string | null = null;

      if (isAdmin) {
        // Admins can assign to any MC they have selected
        customerMcNumber = mcState.mcNumber;
      } else {
        // Non-admins automatically assign to their default MC
        customerMcNumber = (session.user as any)?.mcNumber || null;
        // Ensure non-admins cannot explicitly set mcNumber in the request body
        if (validated.mcNumber && validated.mcNumber !== customerMcNumber) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Employees can only create customers under their assigned MC number.',
              },
            },
            { status: 403 }
          );
        }
      }

      // Create customer with minimal required fields
      const customer = await prisma.customer.create({
        data: {
          customerNumber,
          name: validated.name,
          email: validated.email,
          type: 'DIRECT',
          address: '', // Empty defaults
          city: '',
          state: 'XX', // Placeholder
          zip: '00000', // Placeholder
          phone: '',
          companyId: session.user.companyId,
          paymentTerms: 30,
          mcNumber: customerMcNumber,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: customer,
        },
        { status: 201 }
      );
    } else {
      // Full customer creation with all fields
      validated = createCustomerSchema.parse(body);

      // Check if customer number already exists within this company
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          companyId: session.user.companyId,
          customerNumber: validated.customerNumber
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Customer number already exists',
            },
          },
          { status: 409 }
        );
      }

      // Determine mcNumber for the new customer
      const isAdmin = (session?.user as any)?.role === 'ADMIN';
      const mcState = await McStateManager.getMcState(session, request);
      let customerMcNumber: string | null = validated.mcNumber || null;

      if (!isAdmin) {
        // Non-admins automatically assign to their default MC
        const userMcNumber = (session.user as any)?.mcNumber || null;
        // Ensure non-admins cannot explicitly set mcNumber in the request body
        if (validated.mcNumber && validated.mcNumber !== userMcNumber) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Employees can only create customers under their assigned MC number.',
              },
            },
            { status: 403 }
          );
        }
        customerMcNumber = userMcNumber;
      } else if (!customerMcNumber) {
        // Admin didn't specify MC, use their current selection
        customerMcNumber = mcState.mcNumber;
      }

      const customer = await prisma.customer.create({
        data: {
          ...validated,
          companyId: session.user.companyId,
          mcNumber: customerMcNumber,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: customer,
        },
        { status: 201 }
      );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Customer creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}
