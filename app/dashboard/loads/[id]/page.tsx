import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import LoadDetail from '@/components/loads/LoadDetail';
import { Breadcrumb } from '@/components/ui/breadcrumb';

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
        customer: {
          select: {
            id: true,
            name: true,
            customerNumber: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            creditLimit: true,
            creditHold: true,
            paymentTerms: true,
            mcNumber: true,
          },
        },
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
        coDriver: {
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
        trailer: {
          select: {
            id: true,
            trailerNumber: true,
          },
        },
        dispatcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mcNumber: {
          select: {
            id: true,
            number: true,
            companyName: true,
          },
        },
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
        segments: {
          orderBy: { sequence: 'asc' },
          include: {
            driver: {
              select: {
                id: true,
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
                id: true,
                truckNumber: true,
              },
            },
          },
        },
        rateConfirmation: {
          select: {
            id: true,
            rateConfNumber: true,
            baseRate: true,
            fuelSurcharge: true,
            accessorialCharges: true,
            totalRate: true,
            paymentTerms: true,
            paymentMethod: true,
            notes: true,
          },
        },
        driverAdvances: {
          orderBy: { requestDate: 'desc' },
          select: {
            id: true,
            amount: true,
            requestDate: true,
            paidAt: true,
            notes: true,
          },
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

  return (
    <>
      <Breadcrumb items={[
        { label: 'Load Management', href: '/dashboard/loads' },
        { label: `Load #${load.loadNumber}` }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Load Details</h1>
        </div>
        <LoadDetail load={load} availableDrivers={availableDrivers} availableTrucks={availableTrucks} />
      </div>
    </>
  );
}

