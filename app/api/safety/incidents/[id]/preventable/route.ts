import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const determination = await prisma.preventableDetermination.findUnique({
      where: { incidentId: id },
      include: {
        incident: {
          include: {
            driver: {
              include: {
                user: true
              }
            }
          }
        },
        votes: {
          include: {
            // Note: voterId is a string (User ID), would need to join with User table if needed
          }
        }
      }
    });

    if (!determination || determination.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Determination not found' }, { status: 404 });
    }

    return NextResponse.json({ determination });
  } catch (error) {
    console.error('Error fetching preventable determination:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preventable determination' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify incident exists and belongs to company
    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
      select: { companyId: true }
    });

    if (!incident || incident.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const determination = await prisma.preventableDetermination.upsert({
      where: { incidentId: id },
      update: {
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        reviewCommitteeMembers: body.reviewCommitteeMembers || [],
        determination: body.determination,
        justification: body.justification,
        driverScoreImpact: body.driverScoreImpact,
        ...(body.votes && {
          votes: {
            deleteMany: {},
            create: body.votes.map((vote: any) => ({
              voterId: vote.voterId,
              vote: vote.vote,
              justification: vote.justification
            }))
          }
        })
      },
      create: {
        companyId: session.user.companyId,
        incidentId: id,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        reviewCommitteeMembers: body.reviewCommitteeMembers || [],
        determination: body.determination,
        justification: body.justification,
        driverScoreImpact: body.driverScoreImpact,
        votes: {
          create: (body.votes || []).map((vote: any) => ({
            voterId: vote.voterId,
            vote: vote.vote,
            justification: vote.justification
          }))
        }
      },
      include: {
        incident: {
          include: {
            driver: {
              include: {
                user: true
              }
            }
          }
        },
        votes: true
      }
    });

    return NextResponse.json({ determination }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating preventable determination:', error);
    return NextResponse.json(
      { error: 'Failed to create/update preventable determination' },
      { status: 500 }
    );
  }
}

