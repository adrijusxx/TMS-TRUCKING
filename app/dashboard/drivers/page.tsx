import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageTransition } from '@/components/ui/page-transition';
import { DriversTableClient } from './DriversTableClient';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DriversPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  // Check HR permissions
  const user = session.user as any;
  const canViewHR = session.user.role === 'ADMIN' || session.user.role === 'ACCOUNTANT' ||
    (Array.isArray(user.permissions) && user.permissions.includes('hr.view'));

  const drivers = await prisma.driver.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    select: {
      id: true,
      driverNumber: true,
      address1: true,
      address2: true,
      city: true,
      state: true,
      zipCode: true,
      notes: true,
      warnings: true,
      status: true,
      assignmentStatus: true,
      dispatchStatus: true,
      teamDriver: true,
      mcNumberId: true,
      createdAt: true,
      totalLoads: true,
      onTimePercentage: true,
      rating: true,
      // HR / compliance fields
      employeeStatus: true,
      driverType: true,
      hireDate: true,
      payRate: true,
      payType: true,
      payTo: true,
      licenseNumber: true,
      licenseExpiry: true,
      medicalCardExpiry: true,
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
    },
    orderBy: {
      driverNumber: 'asc',
    },
  });

  // Transform data
  const data = drivers.map((driver) => {
    // Base data visible to everyone with access to drivers
    const baseData = {
      id: driver.id,
      driverNumber: driver.driverNumber,
      firstName: driver.user?.firstName ?? '',
      lastName: driver.user?.lastName ?? '',
      email: driver.user?.email ?? '',
      phone: driver.user?.phone ?? null,
      address1: driver.address1,
      address2: driver.address2,
      city: driver.city,
      state: driver.state,
      zipCode: driver.zipCode,
      notes: driver.notes,
      warnings: driver.warnings,
      status: driver.status,
      assignmentStatus: driver.assignmentStatus,
      dispatchStatus: driver.dispatchStatus,
      teamDriver: driver.teamDriver,
      mcNumberId: driver.mcNumberId,
      mcNumber: driver.mcNumber,
      currentTruck: driver.currentTruck,
      currentTrailer: driver.currentTrailer,
      createdAt: driver.createdAt,
      user: driver.user,
      totalLoads: driver.totalLoads,
      onTimePercentage: driver.onTimePercentage,
      rating: driver.rating,
    };

    // HR data only visible to authorized roles
    if (canViewHR) {
      return {
        ...(baseData as any),
        employeeStatus: driver.employeeStatus,
        driverType: driver.driverType,
        hireDate: driver.hireDate,
        payRate: driver.payRate,
        payType: driver.payType,
        payTo: driver.payTo,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry,
        medicalCardExpiry: driver.medicalCardExpiry,
      };
    }

    return baseData;
  });

  return (
    <>
      <Breadcrumb items={[{ label: 'Drivers', href: '/dashboard/drivers' }]} />
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Drivers</h1>
          </div>
          <DriversTableClient data={data} />
        </div>
      </PageTransition>
    </>
  );
}

