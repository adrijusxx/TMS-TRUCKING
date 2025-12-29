import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import DriverEditForm from '@/components/drivers/DriverEditForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function DriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const driver = await prisma.driver.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },
      currentTruck: {
        select: {
          id: true,
          truckNumber: true,
        },
      },
      currentTrailer: {
        select: {
          id: true,
          trailerNumber: true,
        },
      },
      assignedDispatcher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      hrManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      safetyManager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      truckHistory: {
        include: {
          truck: {
            select: {
              id: true,
              truckNumber: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 50,
      },
      trailerHistory: {
        include: {
          trailer: {
            select: {
              id: true,
              trailerNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      comments: {
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      company: {
        select: {
          id: true,
          name: true,
          mcNumber: true,
        },
      },
    },
  });

  if (!driver) {
    notFound();
  }

  // Get available trucks, trailers, and users for dropdowns
  const [trucks, trailers, dispatchers, users] = await Promise.all([
    prisma.truck.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        truckNumber: true,
      },
      orderBy: { truckNumber: 'asc' },
    }),
    prisma.trailer.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        trailerNumber: true,
      },
      orderBy: { trailerNumber: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        role: 'DISPATCHER',
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { firstName: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { firstName: 'asc' },
    }),
  ]);

  return (
    <>
      <Breadcrumb items={[
        { label: 'Drivers', href: '/dashboard/drivers' },
        { label: `${driver.user.firstName} ${driver.user.lastName}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{driver.user.firstName} {driver.user.lastName}</h1>
        </div>
        <DriverEditForm
          driver={driver}
          trucks={trucks}
          trailers={trailers}
          dispatchers={dispatchers}
          users={users}
        />
      </div>
    </>
  );
}
