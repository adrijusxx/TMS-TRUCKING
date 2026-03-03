import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCustomerSchema, quickCreateCustomerSchema } from '@/lib/validations/customer';
import { hasPermission } from '@/lib/permissions';
import { buildMcNumberWhereClause, convertMcNumberIdToMcNumberString } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';
import { generateUniqueCustomerNumber } from '@/lib/utils/customer-numbering';
import { handleApiError } from '@/lib/api/route-helpers';
import { executeListQuery, type EntityQueryConfig } from '@/lib/managers/BaseQueryManager';

const customerQueryConfig: EntityQueryConfig = {
  prismaModel: 'customer',
  viewPermission: 'customers.view',
  // MC filter handled in buildExtraWhere (uses mcNumber string, not mcNumberId)
  useMcFilter: false,
  staticWhere: { isActive: true },
  searchFields: ['name', 'customerNumber', 'email'],
  equalityFilters: { type: 'type' },
  containsFilters: { state: 'state', city: 'city' },
  defaultOrderBy: { name: 'asc' },
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
  responseFormat: 'standard',
  buildExtraWhere: async ({ searchParams, session, where }) => {
    const extra: Record<string, any> = {};

    // MC filter: Customer uses mcNumber string, not mcNumberId relation
    const mcWhereWithId = await buildMcNumberWhereClause(session as any, undefined);
    const mcWhere = await convertMcNumberIdToMcNumberString(mcWhereWithId as any);

    // Include customers with matching MC OR null MC (unassigned)
    if (mcWhere.mcNumber) {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { mcNumber: mcWhere.mcNumber },
          { mcNumber: null },
        ],
      });
    }

    // minRevenue filter
    const minRevenue = searchParams.get('minRevenue');
    if (minRevenue) {
      extra.totalRevenue = { gte: parseFloat(minRevenue) };
    }

    return extra;
  },
};

export async function GET(request: NextRequest) {
  return executeListQuery(request, customerQueryConfig);
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

      // Determine mcNumber (string) for the new customer
      let customerMcNumberString: string | null = null;
      let targetMcId: string | null = null;

      if (validated.mcNumber) {
        // If provided in body (optional string from schema), treat as ID? Or String? 
        // Schema says string. Let's assume frontend processes might send ID if they use the selector.
        // BUT Customer model expects string. Let's assume input is ID if it looks like CUID, or just handle both.
        // Actually, let's rely on standard logic: Determine ID, then fetch String.
        targetMcId = validated.mcNumber;
      } else {
        // Fallback to active context
        const { McStateManager } = await import('@/lib/managers/McStateManager');
        targetMcId = await McStateManager.determineActiveCreationMc(session, request);
      }

      // If we have an ID, fetch the number string
      if (targetMcId) {
        const mcRecord = await prisma.mcNumber.findUnique({
          where: { id: targetMcId },
          select: { number: true },
        });
        if (mcRecord) {
          customerMcNumberString = mcRecord.number;
        }
      }

      const customer = await prisma.customer.create({
        data: {
          ...validated,
          // Remove mcNumber from validated if it exists there to avoid conflict/wrong type (though schema has it)
          // We override it explicitly
          mcNumber: customerMcNumberString, // Save the STRING (e.g. "123456")
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
    return handleApiError(error);
  }
}
