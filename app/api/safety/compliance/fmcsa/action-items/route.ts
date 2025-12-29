import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get or create compliance record
    let compliance = await prisma.fMCSACompliance.findUnique({
      where: { companyId: session.user.companyId }
    });

    if (!compliance) {
      compliance = await prisma.fMCSACompliance.create({
        data: { companyId: session.user.companyId }
      });
    }

    const actionItem = await prisma.complianceActionItem.create({
      data: {
        complianceId: compliance.id,
        actionItem: body.actionItem,
        priority: body.priority,
        assignedTo: body.assignedTo,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ actionItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating action item:', error);
    return NextResponse.json(
      { error: 'Failed to create action item' },
      { status: 500 }
    );
  }
}

