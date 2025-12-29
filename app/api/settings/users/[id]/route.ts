import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'ACCOUNTANT', 'DRIVER', 'CUSTOMER', 'HR', 'SAFETY', 'FLEET']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  mcNumberId: z.string().min(1, 'MC number is required').optional(),
  mcAccess: z.array(z.string()).optional(), // Array of MC IDs user can access
});

export async function GET(
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

    // Check if user is admin or viewing their own profile
    const isAdmin = session.user.role === 'ADMIN';
    const isOwnProfile = session.user.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own profile or be an admin',
          },
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
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
        updatedAt: true,
        mcNumberId: true,
        tempPassword: true, // Include tempPassword for admin viewing
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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      },
      { status: 500 }
    );
  }
}

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

    // Verify user exists - filter by MC number only (MC-based organization)
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
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

    // Non-admins can't change role, active status, MC number, or MC access
    if (!isAdmin) {
      const { role, isActive, mcNumberId, mcAccess, ...validatedWithoutRestricted } = validated;
      Object.assign(validated, validatedWithoutRestricted);
    }

    // Validate email uniqueness if being updated
    if (validated.email && validated.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email address is already in use',
            },
          },
          { status: 409 }
        );
      }
    }

    // Validate MC number if being updated (for non-CUSTOMER roles)
    if (validated.mcNumberId !== undefined && existingUser.role !== 'CUSTOMER') {
      if (validated.mcNumberId) {
        // Validate MC number exists (MC-based organization)
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
      } else if (!validated.mcNumberId && (existingUser.role as string) !== 'CUSTOMER') {
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
    }

    const updateData: any = { ...validated };

    // Handle mcNumberId - if undefined or null, don't change (mcNumberId is required)
    if (validated.mcNumberId === undefined || validated.mcNumberId === null) {
      const { mcNumberId, ...updateDataWithoutMc } = updateData;
      Object.assign(updateData, updateDataWithoutMc);
    }

    // If user is a driver and mcNumberId is being set, also update driver.mcNumberId
    if (validated.mcNumberId !== undefined && existingUser.role === 'DRIVER') {
      // Get the user's driver record
      const driver = await prisma.driver.findFirst({
        where: { userId: existingUser.id },
      });
      
      if (driver && validated.mcNumberId) {
        // Update driver's mcNumberId to match user's mcNumberId
        await prisma.driver.update({
          where: { id: driver.id },
          data: { 
            mcNumberId: validated.mcNumberId,
          },
        });
      }
    }

    // Handle mcAccess update
    if (validated.mcAccess !== undefined) {
      if (existingUser.role === 'ADMIN') {
        // Admins: empty array = access to all MCs
        updateData.mcAccess = validated.mcAccess;
      } else {
        // Validate MC access (MC-based organization)
        if (validated.mcAccess.length > 0) {
          const validMcNumbers = await prisma.mcNumber.findMany({
            where: {
              id: { in: validated.mcAccess },
              deletedAt: null,
            },
            select: { id: true },
          });
          
          const validMcIds = validMcNumbers.map(mc => mc.id);
          const invalidIds = validated.mcAccess.filter(id => !validMcIds.includes(id));
          
          if (invalidIds.length > 0) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'INVALID_MC_ACCESS',
                  message: `Invalid MC number IDs: ${invalidIds.join(', ')}`,
                },
              },
              { status: 400 }
            );
          }
          
          updateData.mcAccess = validated.mcAccess;
        } else {
          // Empty array for non-admins means no access (use their mcNumberId as default)
          updateData.mcAccess = existingUser.mcNumberId ? [existingUser.mcNumberId] : [];
        }
      }
    }

    // Hash password if provided and store plaintext temporarily for admin viewing
    if (validated.password) {
      const plainPassword = validated.password; // Store before hashing
      updateData.password = await bcrypt.hash(validated.password, 10);
      // Store plaintext password temporarily for admin viewing (security risk, but user requested)
      updateData.tempPassword = plainPassword;
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
        tempPassword: true, // Include tempPassword for admin viewing
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

