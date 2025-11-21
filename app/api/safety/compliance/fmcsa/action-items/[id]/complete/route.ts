import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    // Verify action item belongs to company
    const actionItem = await prisma.complianceActionItem.findUnique({
      where: { id },
      include: {
        compliance: {
          select: { companyId: true }
        }
      }
    });

    if (!actionItem || actionItem.compliance.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const completed = await prisma.complianceActionItem.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: body.completionNotes
      }
    });

    return NextResponse.json({ actionItem: completed });
  } catch (error) {
    console.error('Error completing action item:', error);
    return NextResponse.json(
      { error: 'Failed to complete action item' },
      { status: 500 }
    );
  }
}

