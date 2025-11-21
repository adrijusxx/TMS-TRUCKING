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
    const testType = searchParams.get('testType');
    const year = searchParams.get('year');

    const where: any = {
      driverId,
      companyId: session.user.companyId
    };

    if (testType) {
      where.testType = testType;
    }

    if (year) {
      const yearInt = parseInt(year);
      where.testDate = {
        gte: new Date(yearInt, 0, 1),
        lt: new Date(yearInt + 1, 0, 1)
      };
    }

    const tests = await prisma.drugAlcoholTest.findMany({
      where,
      include: {
        document: true,
        driver: {
          include: {
            user: true
          }
        }
      },
      orderBy: { testDate: 'desc' }
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Error fetching drug tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drug tests' },
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

    const test = await prisma.drugAlcoholTest.create({
      data: {
        companyId: session.user.companyId,
        driverId,
        testType: body.testType,
        testDate: new Date(body.testDate),
        result: body.result,
        isRandom: body.isRandom || false,
        randomSelectionId: body.randomSelectionId,
        labName: body.labName,
        labAddress: body.labAddress,
        labPhone: body.labPhone,
        labReportNumber: body.labReportNumber,
        collectionSiteName: body.collectionSiteName,
        collectionSiteAddress: body.collectionSiteAddress,
        mroName: body.mroName,
        mroPhone: body.mroPhone,
        notes: body.notes,
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

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Error creating drug test:', error);
    return NextResponse.json(
      { error: 'Failed to create drug test' },
      { status: 500 }
    );
  }
}

