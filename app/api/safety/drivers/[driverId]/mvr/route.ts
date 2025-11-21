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

    const mvrRecords = await prisma.mVRRecord.findMany({
      where: {
        driverId,
        companyId: session.user.companyId
      },
      include: {
        document: true,
        violations: {
          orderBy: { violationDate: 'desc' }
        },
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { pullDate: 'desc' }
    });

    return NextResponse.json({ mvrRecords });
  } catch (error) {
    console.error('Error fetching MVR records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MVR records' },
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

    // Calculate next pull due date (annual from pull date)
    const pullDate = new Date(body.pullDate);
    const nextPullDueDate = new Date(pullDate);
    nextPullDueDate.setFullYear(nextPullDueDate.getFullYear() + 1);

    const mvrRecord = await prisma.mVRRecord.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        pullDate,
        state: body.state,
        nextPullDueDate,
        documentId: body.documentId,
        violations: {
          create: (body.violations || []).map((violation: any) => ({
            violationCode: violation.violationCode,
            violationDescription: violation.violationDescription,
            violationDate: new Date(violation.violationDate),
            state: violation.state,
            points: violation.points,
            isNew: violation.isNew || false
          }))
        }
      },
      include: {
        document: true,
        violations: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ mvrRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating MVR record:', error);
    return NextResponse.json(
      { error: 'Failed to create MVR record' },
      { status: 500 }
    );
  }
}

