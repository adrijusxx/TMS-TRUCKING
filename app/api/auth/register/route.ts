import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { registerSchema } from '@/lib/validations/auth';
import { TurnstileService } from '@/lib/services/TurnstileService';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Turnstile CAPTCHA (if token provided)
    if (body.turnstileToken) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      const turnstileResult = await TurnstileService.verify(body.turnstileToken, ip);

      if (!turnstileResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CAPTCHA_FAILED',
              message: turnstileResult.message || 'CAPTCHA verification failed',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validated = registerSchema.parse(body);

    // Normalize email to lowercase (auth queries use lowercase)
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // Check if DOT number already registered
    const existingCompany = await prisma.company.findFirst({
      where: { dotNumber: validated.dotNumber },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A company with this DOT number is already registered',
          },
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Determine subscription based on plan (from Step 4)
    const plan = body.plan as string | undefined;
    console.log('[Register] Plan selected:', plan); // DEBUG LOG

    const isOwnerOperator = plan === 'owner_operator';
    const subscriptionStatus = isOwnerOperator ? 'OWNER_OPERATOR' : 'TRIALING';
    const truckLimit = isOwnerOperator ? 1 : 999;
    const trialEndsAt = isOwnerOperator ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // ...

    // Process Imports (Best effort - ignore errors to prevent stalling registration)
    // We only process core assets that don't have complex dependencies
    const importedData = body.importedData as Record<string, any[]> | undefined;

    if (importedData) {
      console.log('[Register] Processing imports:', Object.keys(importedData)); // DEBUG LOG
      // ...
    } else {
      console.log('[Register] No imported data found in request body'); // DEBUG LOG
    }

    // For registration, we ALWAYS create a new company for the new user.
    // They are signing up as a NEW tenant.
    let company = await prisma.company.create({
      data: {
        name: validated.companyName,
        dotNumber: validated.dotNumber,
        address: 'P.O. Box (Update in Settings)',
        city: 'Update in Settings',
        state: 'TX',
        zip: '00000',
        phone: validated.phone || '000-0000',
        email: validated.email,
        subscriptionStatus: subscriptionStatus,
        truckLimit: truckLimit,
        trialEndsAt: trialEndsAt,
        onboardingComplete: true,
        isReadOnly: false,
      },
    });

    // Initialize Subscription
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: isOwnerOperator ? 'owner-operator-free' : 'pro-trial-14day',
        status: subscriptionStatus,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt || new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
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
      email: normalizedEmail, // Use normalized email for consistent lookup
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

    // Note: Data imports are now done post-login via the TMS import functionality
    // This simplifies registration and avoids complex schema issues during onboarding

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

