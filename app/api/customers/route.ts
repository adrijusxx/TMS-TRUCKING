import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createCustomerSchema, quickCreateCustomerSchema } from '@/lib/validations/customer';
import { z } from 'zod';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, buildMultiMcNumberWhereClause } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { generateUniqueCustomerNumber } from '@/lib/utils/customer-numbering';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const minRevenue = searchParams.get('minRevenue');
    const mcViewMode = searchParams.get('mc'); // 'all', 'current', 'multi', or specific MC ID
    const isAdmin = session.user?.role === 'ADMIN';

    // Check if multi-MC mode is active
    const mcState = await McStateManager.getMcState(session, request);
    const isMultiMode = mcState.viewMode === 'multi' || mcViewMode === 'multi';

    // Build base filter with MC number if applicable
    let baseFilter: any;
    if (isMultiMode && mcState.mcNumberIds.length > 0) {
      // Use multi-MC filtering
      baseFilter = await buildMultiMcNumberWhereClause(session, request);
    } else {
      // Use single MC or all MCs filtering
      baseFilter = await buildMcNumberWhereClause(session, request);
    }
    
    // Admin-only: Override MC filter based on view mode
    if (isAdmin && mcViewMode === 'all') {
      // Remove MC number filter to show all MCs (admin only)
      if (baseFilter.mcNumber) {
        delete baseFilter.mcNumber;
      }
    } else if (isAdmin && mcViewMode && mcViewMode !== 'current' && mcViewMode !== 'multi' && mcViewMode !== null) {
      // Filter by specific MC number ID (admin selecting specific MC)
      // Handle both "mc:ID" format and plain ID format
      const mcId = mcViewMode.startsWith('mc:') ? mcViewMode.substring(3) : mcViewMode;
      const mcNumberRecord = await prisma.mcNumber.findUnique({
        where: { id: mcId },
        select: { number: true, companyId: true, companyName: true },
      });
      if (mcNumberRecord) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { companyId: true, userCompanies: { select: { companyId: true } } },
        });
        const accessibleCompanyIds = [
          user?.companyId,
          ...(user?.userCompanies?.map((uc) => uc.companyId) || []),
        ].filter(Boolean) as string[];
        
        if (accessibleCompanyIds.includes(mcNumberRecord.companyId)) {
          const trimmedMcNumber = mcNumberRecord.number?.trim();
          const trimmedCompanyName = mcNumberRecord.companyName?.trim();
          
          // Build OR conditions to match both MC number value AND company name
          const orConditions: any[] = [];
          
          if (trimmedMcNumber) {
            orConditions.push({ mcNumber: trimmedMcNumber });
          }
          
          if (trimmedCompanyName) {
            orConditions.push({ mcNumber: { contains: trimmedCompanyName, mode: 'insensitive' } });
          }
          
          if (orConditions.length > 1) {
            baseFilter = {
              ...baseFilter,
              OR: orConditions,
            };
            delete baseFilter.mcNumber;
          } else if (orConditions.length === 1) {
            baseFilter = {
              ...baseFilter,
              ...orConditions[0],
            };
          }
        }
      }
    }
    // Non-admin users: always use baseFilter (their assigned MC)

    // Build where clause - include customers with matching MC number OR no MC number (null)
    // This ensures newly created customers without MC numbers still appear
    const where: any = {
      companyId: baseFilter.companyId,
      isActive: true,
      deletedAt: null,
    };
    
    // If filtering by MC number, include both matching MC number and null MC numbers
    // This ensures customers created without MC numbers are still visible
    if (baseFilter.mcNumber) {
      where.AND = [
        {
          OR: [
            { mcNumber: baseFilter.mcNumber },
            { mcNumber: null },
          ],
        },
      ];
    }

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
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
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
        
        // Check if provided customer number already exists
        const existingCustomer = await prisma.customer.findUnique({
          where: { customerNumber },
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
      
      // Get user's MC number from session for filtering
      const userMcNumber = (session.user as any)?.mcNumber || null;
      
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
          mcNumber: userMcNumber, // Set MC number from user's session
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
      
      // Check if customer number already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { customerNumber: validated.customerNumber },
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

      const customer = await prisma.customer.create({
        data: {
          ...validated,
          companyId: session.user.companyId,
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
