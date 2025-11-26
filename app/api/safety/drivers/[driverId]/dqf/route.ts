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

    const dqf = await prisma.driverQualificationFile.findUnique({
      where: { driverId },
      include: {
        documents: {
          include: {
            document: true
          },
          orderBy: { documentType: 'asc' }
        },
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    if (!dqf) {
      // Create DQF if it doesn't exist
      const newDqf = await prisma.driverQualificationFile.create({
        data: {
          companyId: session.user.companyId,
          driverId,
          status: 'INCOMPLETE'
        },
        include: {
          documents: {
            include: {
              document: true
            }
          },
          driver: {
            include: {
              user: true
            }
          }
        }
      });

      return NextResponse.json({ dqf: newDqf });
    }

    return NextResponse.json({ dqf });
  } catch (error) {
    console.error('Error fetching DQF:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DQF' },
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

    // Ensure DQF exists
    let dqf = await prisma.driverQualificationFile.findUnique({
      where: { driverId }
    });

    if (!dqf) {
      dqf = await prisma.driverQualificationFile.create({
        data: {
          companyId: session.user.companyId,
          driverId,
          status: 'INCOMPLETE'
        }
      });
    }

    // Add document to DQF
    if (body.documentId && body.documentType) {
      const dqfDocument = await prisma.dQFDocument.upsert({
        where: {
          dqfId_documentType: {
            dqfId: dqf.id,
            documentType: body.documentType
          }
        },
        update: {
          documentId: body.documentId,
          status: body.status || 'COMPLETE',
          expirationDate: body.expirationDate && body.expirationDate.trim() !== '' 
            ? new Date(body.expirationDate) 
            : null,
          issueDate: body.issueDate && body.issueDate.trim() !== '' 
            ? new Date(body.issueDate) 
            : null
        },
        create: {
          dqfId: dqf.id,
          documentId: body.documentId,
          documentType: body.documentType,
          status: body.status || 'COMPLETE',
          expirationDate: body.expirationDate && body.expirationDate.trim() !== '' 
            ? new Date(body.expirationDate) 
            : null,
          issueDate: body.issueDate && body.issueDate.trim() !== '' 
            ? new Date(body.issueDate) 
            : null
        }
      });

      // Update DQF status based on documents
      const allDocuments = await prisma.dQFDocument.findMany({
        where: { dqfId: dqf.id }
      });

      const hasMissing = allDocuments.some(doc => doc.status === 'MISSING');
      const hasExpired = allDocuments.some(doc => doc.status === 'EXPIRED');
      const hasExpiring = allDocuments.some(doc => doc.status === 'EXPIRING');

      let newStatus = 'COMPLETE';
      if (hasExpired) newStatus = 'EXPIRED';
      else if (hasExpiring) newStatus = 'EXPIRING';
      else if (hasMissing) newStatus = 'INCOMPLETE';

      await prisma.driverQualificationFile.update({
        where: { id: dqf.id },
        data: { status: newStatus as any }
      });

      return NextResponse.json({ dqfDocument }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating DQF:', error);
    return NextResponse.json(
      { error: 'Failed to update DQF' },
      { status: 500 }
    );
  }
}

