import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import LoadDetail from '@/components/loads/LoadDetail';

export default async function LoadDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Handle Next.js 15+ params which can be a Promise
  const resolvedParams = await Promise.resolve(params);
  const loadId = resolvedParams.id;

  const [load, availableDrivers, availableTrucks] = await Promise.all([
    prisma.load.findFirst({
      where: {
        id: loadId,
        companyId: session.user.companyId,
        deletedAt: null,
      },
      include: {
        customer: true,
        driver: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        truck: true,
        stops: {
          orderBy: { sequence: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        documents: {
          where: { deletedAt: null },
        },
      },
    }),
    prisma.driver.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        currentTruck: {
          select: {
            id: true,
            truckNumber: true,
          },
        },
      },
      orderBy: { driverNumber: 'asc' },
    }),
        prisma.truck.findMany({
          where: {
            companyId: session.user.companyId,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            truckNumber: true,
            equipmentType: true,
          },
          orderBy: { truckNumber: 'asc' },
        }),
  ]);

  if (!load) {
    notFound();
  }

  return <LoadDetail load={load} availableDrivers={availableDrivers} availableTrucks={availableTrucks} />;
}

