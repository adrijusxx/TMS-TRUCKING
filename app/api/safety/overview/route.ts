import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isUpcomingBirthday(birthDate: Date, today: Date, daysAhead: number): boolean {
  const thisYear = today.getFullYear();
  const bday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
  if (bday < today) bday.setFullYear(thisYear + 1);
  const diffDays = Math.ceil((bday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= daysAhead;
}

function getExpiryBucket(expiryDate: Date, now: Date): string | null {
  if (expiryDate < now) return 'expired';
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return 'dueSoon';
  if (diffDays <= 90) return 'upcoming';
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());

    const [
      driversWithBirthdays,
      courtDates,
      tasksByDriver,
      totalTasks,
      openClaims,
      recentInspections,
      driversForExpiry,
      accidentHistory,
    ] = await Promise.all([
      prisma.driver.findMany({
        where: { companyId, deletedAt: null, employeeStatus: 'ACTIVE', birthDate: { not: null } },
        select: { id: true, birthDate: true, user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.citation.findMany({
        where: { companyId, deletedAt: null, courtDate: { gte: today, lte: in30Days } },
        select: {
          id: true, citationNumber: true, courtDate: true, courtLocation: true,
          driver: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { courtDate: 'asc' },
      }),
      prisma.safetyTask.groupBy({
        by: ['driverId'],
        _count: true,
        where: { companyId, deletedAt: null, driverId: { not: null } },
      }),
      prisma.safetyTask.count({ where: { companyId, deletedAt: null } }),
      prisma.insuranceClaim.count({ where: { companyId, deletedAt: null, status: { not: 'CLOSED' } } }),
      prisma.roadsideInspection.count({
        where: { companyId, inspectionDate: { gte: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.driver.findMany({
        where: { companyId, deletedAt: null, employeeStatus: 'ACTIVE' },
        select: { id: true, licenseExpiry: true, medicalCardExpiry: true },
      }),
      prisma.safetyIncident.findMany({
        where: { companyId, deletedAt: null, date: { gte: threeYearsAgo } },
        select: { id: true, dotReportable: true },
      }),
    ]);

    // Birthday filter
    const birthdays = driversWithBirthdays
      .filter((d) => d.birthDate && isUpcomingBirthday(d.birthDate, today, 7))
      .map((d) => ({
        id: d.id,
        firstName: d.user?.firstName ?? null,
        lastName: d.user?.lastName ?? null,
        birthDate: d.birthDate,
      }));

    // Tasks per driver with names
    const driverIds = tasksByDriver.filter((g) => g.driverId).map((g) => g.driverId as string);
    const driverNames = driverIds.length
      ? await prisma.driver.findMany({
          where: { id: { in: driverIds } },
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        })
      : [];
    const nameMap = new Map(driverNames.map((d) => [d.id, d.user]));
    const tasksPerDriver = tasksByDriver
      .filter((g) => g.driverId)
      .map((g) => ({
        driverId: g.driverId,
        firstName: nameMap.get(g.driverId as string)?.firstName ?? null,
        lastName: nameMap.get(g.driverId as string)?.lastName ?? null,
        count: g._count,
      }))
      .sort((a, b) => b.count - a.count);

    // Document expiry
    const documentExpiry = { expired: 0, dueSoon: 0, upcoming: 0 };
    for (const driver of driversForExpiry) {
      for (const date of [driver.licenseExpiry, driver.medicalCardExpiry]) {
        if (!date) continue;
        const bucket = getExpiryBucket(date, now);
        if (bucket) documentExpiry[bucket as keyof typeof documentExpiry]++;
      }
    }

    // Accident history
    const dotReportable = accidentHistory.filter((i) => i.dotReportable).length;

    return NextResponse.json({
      birthdays,
      courtDates,
      tasksPerDriver,
      complianceReport: { totalSafetyTasks: totalTasks, openInsuranceClaims: openClaims, recentInspections },
      documentExpiry,
      accidentHistory: {
        total: accidentHistory.length,
        dotReportable,
        nonReportable: accidentHistory.length - dotReportable,
        periodYears: 3,
      },
    });
  } catch (error) {
    console.error('Error fetching safety overview:', error);
    return NextResponse.json({ error: 'Failed to fetch safety overview data' }, { status: 500 });
  }
}
