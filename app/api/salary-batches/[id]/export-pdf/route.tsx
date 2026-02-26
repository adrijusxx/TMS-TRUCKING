import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { SalaryBatchPDF } from '@/lib/pdf/SalaryBatchPDF';

export const dynamic = 'force-dynamic';

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

    const batch = await prisma.salaryBatch.findUnique({
      where: { id, companyId: session.user.companyId },
      include: {
        settlements: {
          include: {
            driver: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                currentTruck: { select: { truckNumber: true } },
              },
            },
            deductionItems: true,
          },
          orderBy: { settlementNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true, address: true, city: true, state: true, zip: true },
    });

    // Fetch load dates for all settlements
    const allLoadIds = batch.settlements.flatMap((s) => s.loadIds || []);
    const loads = allLoadIds.length > 0
      ? await prisma.load.findMany({
          where: { id: { in: allLoadIds } },
          select: { id: true, pickupDate: true, deliveryDate: true, loadNumber: true, revenue: true, driverPay: true },
        })
      : [];
    const loadMap = new Map(loads.map((l) => [l.id, l]));

    const enrichedSettlements = batch.settlements.map((s) => {
      const sLoadIds = s.loadIds || [];
      let earliestPickup: Date | null = null;
      let latestDelivery: Date | null = null;
      for (const lid of sLoadIds) {
        const load = loadMap.get(lid);
        if (!load) continue;
        if (load.pickupDate && (!earliestPickup || load.pickupDate < earliestPickup)) earliestPickup = load.pickupDate;
        if (load.deliveryDate && (!latestDelivery || load.deliveryDate > latestDelivery)) latestDelivery = load.deliveryDate;
      }
      return { ...s, pickupDate: earliestPickup, deliveryDate: latestDelivery };
    });

    const pdfBuffer = await renderToBuffer(
      <SalaryBatchPDF batch={{ ...batch, settlements: enrichedSettlements }} company={company} />
    );

    let pdfArray: Uint8Array;
    if (pdfBuffer instanceof Buffer) {
      pdfArray = new Uint8Array(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength));
    } else if (pdfBuffer instanceof Uint8Array) {
      pdfArray = pdfBuffer;
    } else {
      pdfArray = new Uint8Array(await pdfBuffer);
    }

    const filename = `salary-batch-${batch.batchNumber}.pdf`;

    return new NextResponse(pdfArray.buffer.slice(0) as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfArray.length.toString(),
      },
    });
  } catch (error) {
    console.error('[SalaryBatch] Export PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
