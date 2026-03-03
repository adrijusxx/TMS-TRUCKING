import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IncidentInvestigationManager } from '@/lib/managers/IncidentInvestigationManager';
import { AppError } from '@/lib/errors/AppError';

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
    const investigation = await IncidentInvestigationManager.getByIncidentId(id);
    return NextResponse.json({ investigation });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
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
    const { action } = body;

    let investigation;

    if (action === 'start') {
      investigation = await IncidentInvestigationManager.startInvestigation({
        incidentId: id,
        investigatorId: body.investigatorId || session.user.id,
        companyId: session.user.companyId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      });
    } else if (action === 'complete') {
      investigation = await IncidentInvestigationManager.completeInvestigation({
        incidentId: id,
        rootCause: body.rootCause,
        correctiveActions: body.correctiveActions,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
        findings: body.findings,
        recommendations: body.recommendations,
        contributingFactors: body.contributingFactors,
      });
    } else if (action === 'hold') {
      investigation = await IncidentInvestigationManager.putOnHold(id, body.reason);
    } else {
      // Default: update progress (legacy compat with existing InvestigationWorkflow component)
      investigation = await IncidentInvestigationManager.updateProgress({
        incidentId: id,
        driverInterviewed: body.driverInterviewed,
        eldDataReviewed: body.eldDataReviewed,
        vehicleExamined: body.vehicleExamined,
        photosReviewed: body.photosReviewed,
        witnessStatementsReviewed: body.witnessStatementsReviewed,
        policeReportReviewed: body.policeReportReviewed,
        contributingFactors: body.contributingFactors,
        rootCause: body.rootCause,
        findings: body.findings,
        correctiveActions: body.correctiveActions,
        recommendations: body.recommendations,
      });
    }

    return NextResponse.json({ investigation }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }
    console.error('Error updating investigation:', error);
    return NextResponse.json(
      { error: 'Failed to update investigation' },
      { status: 500 }
    );
  }
}
