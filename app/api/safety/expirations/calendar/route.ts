import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface CalendarEvent {
  id: string;
  type: 'MEDICAL_CARD' | 'CDL' | 'TRAINING' | 'INSURANCE' | 'MVR';
  label: string;
  driverName?: string;
  driverId?: string;
  expirationDate: Date;
  urgency: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING';
}

function getUrgency(date: Date): CalendarEvent['urgency'] {
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'EXPIRED';
  if (days <= 7) return 'CRITICAL';
  if (days <= 30) return 'WARNING';
  return 'UPCOMING';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 3));

    const events: CalendarEvent[] = [];
    const companyFilter = { companyId: session.user.companyId, deletedAt: null };

    if (!filterType || filterType === 'MEDICAL_CARD') {
      const medCards = await prisma.medicalCard.findMany({
        where: {
          driver: { ...companyFilter },
          expirationDate: { gte: start, lte: end },
        },
        include: {
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
      });
      for (const card of medCards) {
        events.push({
          id: card.id,
          type: 'MEDICAL_CARD',
          label: 'Medical Card',
          driverName: `${card.driver.user?.firstName ?? ''} ${card.driver.user?.lastName ?? ''}`,
          driverId: card.driver.id,
          expirationDate: card.expirationDate,
          urgency: getUrgency(card.expirationDate),
        });
      }
    }

    if (!filterType || filterType === 'CDL') {
      const cdls = await prisma.cDLRecord.findMany({
        where: {
          driver: { ...companyFilter },
          expirationDate: { gte: start, lte: end },
          deletedAt: null,
        },
        include: {
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
      });
      for (const cdl of cdls) {
        events.push({
          id: cdl.id,
          type: 'CDL',
          label: 'CDL',
          driverName: `${cdl.driver.user?.firstName ?? ''} ${cdl.driver.user?.lastName ?? ''}`,
          driverId: cdl.driver.id,
          expirationDate: cdl.expirationDate,
          urgency: getUrgency(cdl.expirationDate),
        });
      }
    }

    if (!filterType || filterType === 'TRAINING') {
      const trainings = await prisma.safetyTraining.findMany({
        where: {
          driver: { ...companyFilter },
          expiryDate: { gte: start, lte: end, not: null },
          deletedAt: null,
        },
        include: {
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
      });
      for (const t of trainings) {
        if (!t.expiryDate) continue;
        events.push({
          id: t.id,
          type: 'TRAINING',
          label: t.trainingName,
          driverName: `${t.driver.user?.firstName ?? ''} ${t.driver.user?.lastName ?? ''}`,
          driverId: t.driver.id,
          expirationDate: t.expiryDate,
          urgency: getUrgency(t.expiryDate),
        });
      }
    }

    if (!filterType || filterType === 'INSURANCE') {
      const policies = await prisma.insurancePolicy.findMany({
        where: {
          companyId: session.user.companyId,
          renewalDate: { gte: start, lte: end },
          deletedAt: null,
        },
      });
      for (const p of policies) {
        events.push({
          id: p.id,
          type: 'INSURANCE',
          label: `${p.policyType} - ${p.policyNumber}`,
          expirationDate: p.renewalDate,
          urgency: getUrgency(p.renewalDate),
        });
      }
    }

    events.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('Error fetching expiration calendar:', error);
    return NextResponse.json({ error: 'Failed to fetch expiration calendar' }, { status: 500 });
  }
}
