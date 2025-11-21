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

    const investigation = await prisma.investigation.findUnique({
      where: { incidentId: id },
      include: {
        incident: {
          include: {
            driver: {
              include: {
                user: true
              }
            },
            truck: true
          }
        },
        documents: true
      }
    });

    return NextResponse.json({ investigation });
  } catch (error) {
    console.error('Error fetching investigation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investigation' },
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

    // Check if incident exists and belongs to company
    const incident = await prisma.safetyIncident.findUnique({
      where: { id },
      select: { companyId: true }
    });

    if (!incident || incident.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const investigation = await prisma.investigation.upsert({
      where: { incidentId: id },
      update: {
        investigatorId: body.investigatorId || session.user.id,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        driverInterviewed: body.driverInterviewed || false,
        eldDataReviewed: body.eldDataReviewed || false,
        vehicleExamined: body.vehicleExamined || false,
        photosReviewed: body.photosReviewed || false,
        witnessStatementsReviewed: body.witnessStatementsReviewed || false,
        policeReportReviewed: body.policeReportReviewed || false,
        contributingFactors: body.contributingFactors,
        rootCause: body.rootCause,
        findings: body.findings,
        correctiveActions: body.correctiveActions,
        recommendations: body.recommendations,
        trainingScheduled: body.trainingScheduled || false,
        trainingId: body.trainingId,
        status: body.status || 'PENDING'
      },
      create: {
        companyId: session.user.companyId,
        incidentId: id,
        investigatorId: body.investigatorId || session.user.id,
        assignedDate: body.assignedDate ? new Date(body.assignedDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        driverInterviewed: body.driverInterviewed || false,
        eldDataReviewed: body.eldDataReviewed || false,
        vehicleExamined: body.vehicleExamined || false,
        photosReviewed: body.photosReviewed || false,
        witnessStatementsReviewed: body.witnessStatementsReviewed || false,
        policeReportReviewed: body.policeReportReviewed || false,
        contributingFactors: body.contributingFactors,
        rootCause: body.rootCause,
        findings: body.findings,
        correctiveActions: body.correctiveActions,
        recommendations: body.recommendations,
        trainingScheduled: body.trainingScheduled || false,
        trainingId: body.trainingId,
        status: 'PENDING'
      },
      include: {
        incident: {
          include: {
            driver: {
              include: {
                user: true
              }
            },
            truck: true
          }
        },
        documents: true
      }
    });

    // Update incident investigation status
    await prisma.safetyIncident.update({
      where: { id },
      data: {
        investigationStatus: investigation.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'
      }
    });

    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating investigation:', error);
    return NextResponse.json(
      { error: 'Failed to create/update investigation' },
      { status: 500 }
    );
  }
}

