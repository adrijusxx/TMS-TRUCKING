import { Breadcrumb } from '@/components/ui/breadcrumb';
import { DriversTableClient } from './DriversTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DriversPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const drivers = await prisma.driver.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      mcNumber: {
        select: {
          id: true,
          number: true,
        },
      },
    },
    orderBy: {
      driverNumber: 'asc',
    },
  });

  // Transform data to match the expected format
  const data = drivers.map((driver) => ({
    id: driver.id,
    driverNumber: driver.driverNumber,
    firstName: driver.user.firstName,
    lastName: driver.user.lastName,
    email: driver.user.email,
    phone: driver.user.phone,
    address1: driver.address1,
    address2: driver.address2,
    city: driver.city,
    state: driver.state,
    zipCode: driver.zipCode,
    notes: null, // Driver notes would come from DriverComment or warnings field
    status: driver.status,
    employeeStatus: driver.employeeStatus,
    assignmentStatus: driver.assignmentStatus,
    mcNumberId: driver.mcNumberId,
    mcNumber: driver.mcNumber,
    createdAt: driver.createdAt,
    user: driver.user,
  }));

  return (
    <>
      <Breadcrumb items={[{ label: 'Drivers', href: '/dashboard/drivers' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Drivers</h1>
        </div>
        <DriversTableClient data={data} />
      </div>
    </>
  );
}

