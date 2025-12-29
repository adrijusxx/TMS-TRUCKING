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

    const cdlRecord = await prisma.cDLRecord.findUnique({
      where: { driverId },
      include: {
        document: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ cdlRecord });
  } catch (error) {
    console.error('Error fetching CDL record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CDL record' },
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

    const cdlRecord = await prisma.cDLRecord.upsert({
      where: { driverId },
      update: {
        cdlNumber: body.cdlNumber,
        expirationDate: new Date(body.expirationDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        issueState: body.issueState,
        licenseClass: body.licenseClass,
        endorsements: body.endorsements || [],
        restrictions: body.restrictions || [],
        documentId: body.documentId
      },
      create: {
        companyId: session.user.companyId,
        driverId,
        cdlNumber: body.cdlNumber,
        expirationDate: new Date(body.expirationDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        issueState: body.issueState,
        licenseClass: body.licenseClass,
        endorsements: body.endorsements || [],
        restrictions: body.restrictions || [],
        documentId: body.documentId
      },
      include: {
        document: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({ cdlRecord }, { status: 201 });
  } catch (error) {
    console.error('Error updating CDL record:', error);
    return NextResponse.json(
      { error: 'Failed to update CDL record' },
      { status: 500 }
    );
  }
}

