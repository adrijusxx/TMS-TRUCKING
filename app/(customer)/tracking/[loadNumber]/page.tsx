import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CustomerTrackingView from '@/components/customer/CustomerTrackingView';

export default async function CustomerTrackingPage({
  params,
}: {
  params: { loadNumber: string };
}) {
  // Find load by load number (no auth required for public tracking)
  const load = await prisma.load.findFirst({
    where: {
      loadNumber: params.loadNumber,
      deletedAt: null,
    },
    include: {
      customer: {
        select: {
          name: true,
          customerNumber: true,
        },
      },
      driver: {
        select: {
          driverNumber: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      truck: {
        select: {
          truckNumber: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      documents: {
        where: {
          type: { in: ['BOL', 'POD'] },
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
          fileName: true,
          fileUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!load) {
    notFound();
  }

  return <CustomerTrackingView load={load} />;
}

