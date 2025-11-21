import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;

    const reviews = await prisma.annualReview.findMany({
      where: {
        driverId,
        companyId: session.user.companyId
      },
      include: {
        documents: true,
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { reviewDate: 'desc' }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching annual reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annual reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driverId } = await params;
    const body = await request.json();

    // Get driver hire date to calculate due date
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { hireDate: true }
    });

    if (!driver || !driver.hireDate) {
      return NextResponse.json(
        { error: 'Driver hire date not found' },
        { status: 400 }
      );
    }

    // Calculate due date (annual from hire date)
    const reviewYear = body.reviewYear || new Date().getFullYear();
    const dueDate = new Date(driver.hireDate);
    dueDate.setFullYear(reviewYear);

    const review = await prisma.annualReview.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        dueDate,
        reviewYear,
        mvrReviewed: body.mvrReviewed || false,
        violationReviewed: body.violationReviewed || false,
        accidentReviewed: body.accidentReviewed || false,
        trainingCompleted: body.trainingCompleted || false,
        performanceDiscussed: body.performanceDiscussed || false,
        reviewerId: body.reviewerId || session.user.id,
        reviewNotes: body.reviewNotes,
        performanceNotes: body.performanceNotes,
        actionItems: body.actionItems,
        status: body.status || 'PENDING'
      },
      include: {
        documents: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating annual review:', error);
    return NextResponse.json(
      { error: 'Failed to create annual review' },
      { status: 500 }
    );
  }
}

