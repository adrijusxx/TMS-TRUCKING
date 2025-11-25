import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';
import { McStateManager } from '@/lib/managers/McStateManager';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
  mcNumberId: z.string().min(1, 'MC number is required'),
  mcAccess: z.array(z.string()).optional(), // Array of MC IDs user can access
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().min(1, 'MC number is required').optional(),
});

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
    const roleFilter = searchParams.get('role');
    const statsOnly = searchParams.get('stats') === 'true';

    // Get MC state - MC numbers are the primary organizational unit
    const mcState = await McStateManager.getMcState(session, request);
    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const mcAccess = McStateManager.getMcAccess(session);
    
    // Debug logging
    console.log('[Users API] MC State:', {
      isAdmin,
      mcAccessLength: mcAccess.length,
      viewMode: mcState.viewMode,
      roleFilter
    });

    const where: any = {
      deletedAt: null,
    };

    // MC-based filtering - no companyId, only MC numbers
    const { mcNumberId } = await getCurrentMcNumber(session, request);

    // Filter by role if specified
    if (roleFilter === 'DISPATCHER') {
      where.role = 'DISPATCHER';
    } else if (roleFilter === 'ACCOUNTANT') {
      where.role = 'ACCOUNTANT';
    } else if (roleFilter === 'FLEET') {
      where.role = 'FLEET';
    } else if (roleFilter === 'ADMIN') {
      where.role = 'ADMIN';
    } else if (roleFilter === 'EMPLOYEES') {
      where.role = 'ACCOUNTANT';
    } else if (roleFilter === 'DRIVER') {
      where.role = 'DRIVER';
    } else if (roleFilter === 'SAFETY') {
      where.OR = [
        { role: 'SAFETY' },
        { safetyManagedDrivers: { some: {} } },
      ];
    } else if (roleFilter === 'HR') {
      where.OR = [
        { role: 'HR' },
        { hrManagedDrivers: { some: {} } },
      ];
    }

    // Apply MC number filtering (MC-based organization)
    // Admins can view "all MCs" or filter by selected MC(s)
    if (isAdmin && mcState.viewMode === 'all') {
      // Admin viewing all MCs - no MC filter
    } else {
      // Filter by MC number(s)
      if (mcState.viewMode === 'filtered' && mcState.mcNumberIds && mcState.mcNumberIds.length > 0) {
        // Multiple MCs selected
        where.OR = [
          { mcNumberId: { in: mcState.mcNumberIds } },
          { driver: { mcNumberId: { in: mcState.mcNumberIds } } },
        ];
      } else if (mcNumberId) {
        // Single MC selected
        where.OR = [
          { mcNumberId: mcNumberId },
          { driver: { mcNumberId: mcNumberId } },
        ];
      } else if (mcAccess && mcAccess.length > 0) {
        // User has limited MC access
        where.OR = [
          { mcNumberId: { in: mcAccess } },
          { driver: { mcNumberId: { in: mcAccess } } },
        ];
      }
    }

    // If stats only, return aggregated data
    if (statsOnly) {
      const [total, active, inactive, usersByRole] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, isActive: true } }),
        prisma.user.count({ where: { ...where, isActive: false } }),
        prisma.user.groupBy({
          by: ['role'],
          where,
          _count: true,
        }),
      ]);

      const byRole: Record<string, number> = {};
      usersByRole.forEach((item) => {
        byRole[item.role] = item._count;
      });

      return NextResponse.json({
        success: true,
        data: {
          total,
          active,
          inactive,
          byRole,
        },
      });
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        mcNumberId: true,
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        driver: {
          select: {
            mcNumber: true,
          },
        },
        mcAccess: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Users list error:', error);
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

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only admins can create users',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Validate MC number exists (MC-based organization)
    if (validated.role !== 'CUSTOMER' && validated.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: validated.mcNumberId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_MC_NUMBER',
              message: 'MC number not found',
            },
          },
          { status: 400 }
        );
      }
    } else if (validated.role !== 'CUSTOMER' && !validated.mcNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'MC number is required for this role',
          },
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Prepare user data
    const userData: any = {
      ...validated,
      password: hashedPassword,
      companyId: session.user.companyId,
    };
    
    // For CUSTOMER role, don't require MC number
    if (validated.role === 'CUSTOMER') {
      const { mcNumberId, ...userDataWithoutMc } = userData;
      Object.assign(userData, userDataWithoutMc);
    }

    // Set mcAccess: empty array for admins (all access), or provided array, or default to [mcNumberId]
    if (validated.role === 'ADMIN') {
      userData.mcAccess = validated.mcAccess || []; // Empty array = access to all MCs
    } else {
      // For non-admins, use provided mcAccess or default to [mcNumberId]
      userData.mcAccess = validated.mcAccess || (validated.mcNumberId ? [validated.mcNumberId] : []);
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        mcNumberId: true,
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
        mcAccess: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 201 }
    );
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

    console.error('User creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

