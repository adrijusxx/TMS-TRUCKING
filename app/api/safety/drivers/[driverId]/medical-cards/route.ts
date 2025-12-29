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
    const { searchParams } = new URL(request.url);
    const expiring = searchParams.get('expiring') === 'true';

    const where: any = {
      driverId,
      companyId: session.user.companyId
    };

    if (expiring) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + 30);
      where.expirationDate = {
        lte: thresholdDate,
        gte: new Date()
      };
    }

    const medicalCards = await prisma.medicalCard.findMany({
      where,
      include: {
        document: true,
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { expirationDate: 'asc' }
    });

    return NextResponse.json({ medicalCards });
  } catch (error) {
    console.error('Error fetching medical cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical cards' },
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

    const medicalCard = await prisma.medicalCard.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        cardNumber: body.cardNumber,
        expirationDate: new Date(body.expirationDate),
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        medicalExaminerName: body.medicalExaminerName,
        medicalExaminerCertificateNumber: body.medicalExaminerCertificateNumber,
        waiverInformation: body.waiverInformation,
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

    return NextResponse.json({ medicalCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating medical card:', error);
    return NextResponse.json(
      { error: 'Failed to create medical card' },
      { status: 500 }
    );
  }
}

