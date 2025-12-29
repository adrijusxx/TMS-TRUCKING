import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getAuthenticatedSession,
  createErrorResponse,
  createSuccessResponse,
  driverWithDocumentInclude,
  isErrorResponse,
} from '@/lib/api/safety/route-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const authResult = await getAuthenticatedSession();
    if (isErrorResponse(authResult)) {
      return authResult.response;
    }

    const { companyId } = authResult;
    const { driverId } = await params;

    const mvrRecords = await prisma.mVRRecord.findMany({
      where: {
        driverId,
        companyId,
      },
      include: {
        ...driverWithDocumentInclude,
        violations: {
          orderBy: { violationDate: 'desc' },
        },
      },
      orderBy: { pullDate: 'desc' },
    });

    return createSuccessResponse({ mvrRecords });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch MVR records');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const authResult = await getAuthenticatedSession();
    if (isErrorResponse(authResult)) {
      return authResult.response;
    }

    const { companyId } = authResult;
    const { driverId } = await params;
    const body = await request.json();

    // Calculate next pull due date (annual from pull date)
    const pullDate = new Date(body.pullDate);
    const nextPullDueDate = new Date(pullDate);
    nextPullDueDate.setFullYear(nextPullDueDate.getFullYear() + 1);

    const mvrRecord = await prisma.mVRRecord.create({
      data: {
        companyId,
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
            isNew: violation.isNew || false,
          })),
        },
      },
      include: {
        ...driverWithDocumentInclude,
        violations: true,
      },
    });

    return createSuccessResponse({ mvrRecord }, 201);
  } catch (error) {
    return createErrorResponse(error, 'Failed to create MVR record');
  }
}

