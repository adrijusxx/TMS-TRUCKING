import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {
      companyId: session.user.companyId
    };

    if (status) {
      where.status = status;
    }

    const submissions = await prisma.dataQSubmission.findMany({
      where,
      include: {
        violation: {
          include: {
            inspection: {
              include: {
                driver: {
                  include: {
                    user: true
                  }
                },
                truck: true
              }
            }
          }
        }
      },
      orderBy: { submissionDate: 'desc' }
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching DataQ submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DataQ submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const submission = await prisma.dataQSubmission.create({
      data: {
        companyId: session.user.companyId,
        violationId: body.violationId,
        submissionDate: new Date(),
        fmcsatrackingNumber: body.fmcsatrackingNumber,
        violationChallenged: body.violationChallenged,
        reasonForChallenge: body.reasonForChallenge,
        supportingDocumentIds: body.supportingDocumentIds || [],
        status: 'PENDING'
      },
      include: {
        violation: {
          include: {
            inspection: true
          }
        }
      }
    });

    // Update violation status
    if (body.violationId) {
      await prisma.roadsideViolation.update({
        where: { id: body.violationId },
        data: {
          dataQSubmitted: true,
          dataQSubmissionId: submission.id,
          dataQStatus: 'PENDING'
        }
      });
    }

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('Error creating DataQ submission:', error);
    return NextResponse.json(
      { error: 'Failed to create DataQ submission' },
      { status: 500 }
    );
  }
}

