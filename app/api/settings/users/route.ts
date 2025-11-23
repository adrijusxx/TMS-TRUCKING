import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getCurrentMcNumber } from '@/lib/mc-number-filter';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']),
  mcNumberId: z.string().min(1, 'MC number is required'),
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

    // Check if MC number is selected
    const { mcNumberId, mcNumber } = await getCurrentMcNumber(session, request);

    const where: any = {
      companyId: session.user.companyId,
      deletedAt: null,
    };

    // Filter by role if specified
    if (roleFilter === 'DISPATCHER') {
      where.role = 'DISPATCHER';
      // If MC number is selected, filter dispatchers by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'ACCOUNTANT') {
      where.role = 'ACCOUNTANT';
      // If MC number is selected, filter accountants by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'FLEET') {
      where.role = 'FLEET';
      // If MC number is selected, filter fleet managers by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'ADMIN') {
      where.role = 'ADMIN';
      // If MC number is selected, filter admins by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'EMPLOYEES') {
      // Employees = ACCOUNTANT (excluding ADMIN, DISPATCHER, DRIVER)
      where.role = 'ACCOUNTANT';
      // If MC number is selected, filter employees by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'DRIVER') {
      where.role = 'DRIVER';
      // If MC number is selected, filter drivers by their driver.mcNumberId
      if (mcNumberId) {
        where.driver = {
          mcNumberId: mcNumberId,
        };
      }
    } else if (roleFilter === 'SAFETY') {
      // Safety Department: Users who are safety managers (have safetyManagedDrivers)
      where.safetyManagedDrivers = {
        some: {},
      };
    } else if (roleFilter === 'HR') {
      // HR Department: Users who are HR managers (have hrManagedDrivers)
      where.hrManagedDrivers = {
        some: {},
      };
    } else {
      // For all users, if MC number is selected, filter by mcNumberId (for dispatchers/employees) or driver.mcNumberId (for drivers)
      if (mcNumberId) {
        where.OR = [
          { mcNumberId: mcNumberId },
          { driver: { mcNumberId: mcNumberId } },
        ];
      }
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

    // Validate MC number exists and belongs to company (for non-CUSTOMER roles)
    if (validated.role !== 'CUSTOMER' && validated.mcNumberId) {
      const mcNumber = await prisma.mcNumber.findFirst({
        where: {
          id: validated.mcNumberId,
          companyId: session.user.companyId,
          deletedAt: null,
        },
      });

      if (!mcNumber) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_MC_NUMBER',
              message: 'MC number not found or does not belong to your company',
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
      delete userData.mcNumberId;
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

