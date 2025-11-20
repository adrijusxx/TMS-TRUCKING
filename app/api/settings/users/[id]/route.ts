import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Check if user is admin or updating their own profile
    const isAdmin = session.user.role === 'ADMIN';
    const isOwnProfile = session.user.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own profile or be an admin',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Verify user belongs to company
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    // Non-admins can't change role, active status, or MC number
    if (!isAdmin) {
      delete validated.role;
      delete validated.isActive;
      delete validated.mcNumberId;
    }

    const updateData: any = { ...validated };

    // Handle mcNumberId - if null, set to null; if undefined, don't change
    if (validated.mcNumberId === null) {
      updateData.mcNumberId = null;
    } else if (validated.mcNumberId === undefined) {
      delete updateData.mcNumberId;
    }

    // If user is a driver and mcNumberId is being set, also update driver.mcNumber
    if (validated.mcNumberId !== undefined && existingUser.role === 'DRIVER') {
      // Get the user's driver record
      const driver = await prisma.driver.findFirst({
        where: { userId: existingUser.id },
      });
      
      if (driver) {
        if (validated.mcNumberId) {
          // Get the MC number value
          const mcNumber = await prisma.mcNumber.findUnique({
            where: { id: validated.mcNumberId },
            select: { number: true },
          });
          
          if (mcNumber) {
            // Update driver's mcNumber
            await prisma.driver.update({
              where: { id: driver.id },
              data: { mcNumber: mcNumber.number },
            });
          }
        } else {
          // Clear driver's mcNumber if mcNumberId is null
          await prisma.driver.update({
            where: { id: driver.id },
            data: { mcNumber: null },
          });
        }
      }
    }

    // Hash password if provided
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        updatedAt: true,
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

    return NextResponse.json({
      success: true,
      data: user,
    });
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

    console.error('User update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            message: 'Only admins can delete users',
          },
        },
        { status: 403 }
      );
    }

    // Handle Next.js 15+ params which can be a Promise
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Can't delete yourself
    if (session.user.id === userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'You cannot delete your own account',
          },
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

