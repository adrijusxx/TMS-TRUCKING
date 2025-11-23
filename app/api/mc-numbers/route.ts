import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMcNumberSchema = z.object({
  companyName: z.string().min(1),
  type: z.enum(['CARRIER', 'BROKER']),
  companyPhone: z.string().optional(),
  owner: z.string().optional(),
  isDefault: z.boolean().optional(),
  usdot: z.string().optional(),
  notes: z.string().optional(),
  number: z.string().min(1),
});

const updateMcNumberSchema = createMcNumberSchema.partial();

/**
 * Helper function to create an MC number for a specific company
 */
async function createMcNumberForCompany(
  validatedData: z.infer<typeof createMcNumberSchema>,
  companyId: string
) {
  // Normalize the MC number (trim whitespace) before checking for duplicates
  const normalizedNumber = validatedData.number.trim();
  
  // Get all MC numbers for this company to check for duplicates (normalize for comparison)
  const allMcNumbers = await prisma.mcNumber.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    select: { number: true },
  });
  
  // Check if any existing MC number matches the normalized number
  const duplicateExists = allMcNumbers.some(
    (mc) => mc.number.trim() === normalizedNumber
  );
  
  if (duplicateExists) {
    throw new Error('MC number already exists for this company');
  }
  
  // If setting as default, unset other defaults
  if (validatedData.isDefault) {
    await prisma.mcNumber.updateMany({
      where: {
        companyId,
        isDefault: true,
        deletedAt: null,
      },
      data: {
        isDefault: false,
      },
    });
  }

  return await prisma.mcNumber.create({
    data: {
      ...validatedData,
      number: normalizedNumber,
      companyId,
      isDefault: validatedData.isDefault ?? false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
        { usdot: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [mcNumbers, total] = await Promise.all([
      prisma.mcNumber.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.mcNumber.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: mcNumbers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('MC Numbers fetch error:', error);
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

    // Only admins can create MC numbers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only administrators can create MC numbers' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createMcNumberSchema.parse(body);

    // Verify the company exists and is active
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    if (!company) {
      
      // For admins, try to find an alternative company
      if (session.user.role === 'ADMIN') {
        // First, check if they have access via UserCompany
        const userCompanies = await prisma.userCompany.findMany({
          where: {
            userId: session.user.id,
            isActive: true,
          },
          include: {
            company: true,
          },
        });


        if (userCompanies.length > 0) {
          // Admin has access to other companies, use the first active one
          const activeCompany = userCompanies.find(uc => uc.company.isActive)?.company;
          if (activeCompany) {
            // Use the alternative company for MC number creation
            try {
              const mcNumber = await createMcNumberForCompany(validatedData, activeCompany.id);
              return NextResponse.json({
                success: true,
                data: mcNumber,
              });
            } catch (createError: any) {
              // Handle duplicate error from helper function
              if (createError.message === 'MC number already exists for this company') {
                return NextResponse.json(
                  {
                    success: false,
                    error: {
                      code: 'DUPLICATE',
                      message: 'MC number already exists for this company',
                    },
                  },
                  { status: 400 }
                );
              }
              // Re-throw to be handled by outer catch block
              throw createError;
            }
          }
        }

        // If no UserCompany records found, check if there are any active companies in the system
        // Admins should be able to create MC numbers for any company
        const anyActiveCompany = await prisma.company.findFirst({
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (anyActiveCompany) {
          // Use the first active company as fallback
          try {
            const mcNumber = await createMcNumberForCompany(validatedData, anyActiveCompany.id);
            return NextResponse.json({
              success: true,
              data: mcNumber,
            });
          } catch (createError: any) {
            // Handle duplicate error from helper function
            if (createError.message === 'MC number already exists for this company') {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'DUPLICATE',
                    message: 'MC number already exists for this company',
                  },
                },
                { status: 400 }
              );
            }
            // Re-throw to be handled by outer catch block
            throw createError;
          }
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Your company was not found. Please contact support or create a new company.',
          },
        },
        { status: 404 }
      );
    }

    if (!company.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPANY_INACTIVE',
            message: 'Your company is inactive. Please contact support to activate your company.',
          },
        },
        { status: 403 }
      );
    }

    // Create the MC number using the helper function
    try {
      const mcNumber = await createMcNumberForCompany(validatedData, session.user.companyId);
      return NextResponse.json({
        success: true,
        data: mcNumber,
      });
    } catch (createError: any) {
      // Handle duplicate error from helper function
      if (createError.message === 'MC number already exists for this company') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE',
              message: 'MC number already exists for this company',
            },
          },
          { status: 400 }
        );
      }
      // Re-throw to be handled by outer catch block
      throw createError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('MC Number create error:', error);
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE',
              message: 'MC number already exists for this company. Please use a different number.',
            },
          },
          { status: 400 }
        );
      }
      
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'COMPANY_NOT_FOUND',
              message: 'Your company was not found. The database may have been reset. Please log out and log back in, or contact support.',
            },
          },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Something went wrong' 
        },
      },
      { status: 500 }
    );
  }
}
