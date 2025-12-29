import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations/auth';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = registerSchema.parse(body);

    // Check if user already exists
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

    // For registration, we ALWAYS create a new company for the new user.
    // They are signing up as a NEW tenant.
    let company = await prisma.company.create({
      data: {
        name: validated.companyName,
        dotNumber: validated.dotNumber,
        address: 'P.O. Box (Update in Settings)', // Placeholder until we add address fields
        city: 'Update in Settings',
        state: 'TX',
        zip: '00000',
        phone: validated.phone || '000-0000',
        email: validated.email,
        subscriptionStatus: 'FREE',
      },
    });

    // Initialize Subscription (Free Plan)
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: 'starter-free',
        status: 'FREE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
      },
    });

    // Create default MC number
    let mcNumber = await prisma.mcNumber.create({
      data: {
        companyId: company.id,
        number: validated.mcNumber,
        companyName: company.name,
        type: 'CARRIER',
        isDefault: true,
      },
    });

    // Create user as ADMIN (Company Owner)
    const userData = {
      email: validated.email,
      password: hashedPassword,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone && validated.phone.trim() !== '' ? validated.phone : null,
      role: 'ADMIN' as const, // First user is the Admin
      companyId: company.id,
      mcNumberId: mcNumber.id,
      mcAccess: [mcNumber.id],
    };

    const user = await prisma.user.create({
      data: userData as any,
    });

    // Send welcome email (asynchronously, don't block response)
    // We import dynamically to avoid circular dependency issues if any, though regular import is likely fine here
    try {
      const { EmailService } = await import('@/lib/services/EmailService');
      // Fire and forget - don't await this to keep registration fast
      EmailService.sendWelcomeEmail(user.email, user.firstName).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    } catch (emailError) {
      console.error('Error initiating email service:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
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

    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      },
      { status: 500 }
    );
  }
}

