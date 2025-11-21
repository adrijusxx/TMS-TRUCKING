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
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER']),
  mcNumberId: z.string().nullable().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
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
    } else if (roleFilter === 'EMPLOYEES') {
      // Employees = ADMIN, ACCOUNTANT (not DISPATCHER, not DRIVER)
      where.role = { in: ['ADMIN', 'ACCOUNTANT'] };
      // If MC number is selected, filter employees by their mcNumberId
      if (mcNumberId) {
        where.mcNumberId = mcNumberId;
      }
    } else if (roleFilter === 'DRIVER') {
      where.role = 'DRIVER';
      // If MC number is selected, filter drivers by their driver.mcNumber
      if (mcNumber) {
        where.driver = {
          mcNumber: mcNumber,
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
      // For all users, if MC number is selected, filter by mcNumberId (for dispatchers/employees) or driver.mcNumber (for drivers)
      if (mcNumberId) {
        where.OR = [
          { mcNumberId: mcNumberId },
          { driver: { mcNumber: mcNumber } },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Prepare user data
    const userData: any = {
      ...validated,
      password: hashedPassword,
      companyId: session.user.companyId,
    };
    
    // Remove mcNumberId from userData if it's null/empty (let it be undefined)
    if (!userData.mcNumberId) {
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

