import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const compliance = await prisma.fMCSACompliance.findUnique({
      where: { companyId: session.user.companyId },
      include: {
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 10
        },
        actionItems: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!compliance) {
      // Create default compliance record
      const newCompliance = await prisma.fMCSACompliance.create({
        data: {
          companyId: session.user.companyId,
          safetyRating: null
        },
        include: {
          reviews: true,
          actionItems: true
        }
      });
      return NextResponse.json({ compliance: newCompliance });
    }

    return NextResponse.json({ compliance });
  } catch (error) {
    console.error('Error fetching FMCSA compliance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FMCSA compliance' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const compliance = await prisma.fMCSACompliance.upsert({
      where: { companyId: session.user.companyId },
      update: {
        ...(body.safetyRating && { safetyRating: body.safetyRating }),
        ...(body.safetyRatingDate && { safetyRatingDate: new Date(body.safetyRatingDate) }),
        ...(body.safetyRatingReason && { safetyRatingReason: body.safetyRatingReason })
      },
      create: {
        companyId: session.user.companyId,
        safetyRating: body.safetyRating,
        safetyRatingDate: body.safetyRatingDate ? new Date(body.safetyRatingDate) : null,
        safetyRatingReason: body.safetyRatingReason
      },
      include: {
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 10
        },
        actionItems: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    return NextResponse.json({ compliance });
  } catch (error) {
    console.error('Error updating FMCSA compliance:', error);
    return NextResponse.json(
      { error: 'Failed to update FMCSA compliance' },
      { status: 500 }
    );
  }
}

