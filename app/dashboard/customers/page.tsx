import { CustomersTableClient } from './CustomersTableClient';
import { PageShell } from '@/components/layout/PageShell';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  const customers = await prisma.customer.findMany({
    where: {
      companyId: session.user.companyId,
      deletedAt: null,
    },
    orderBy: {
      customerNumber: 'asc',
    },
  });

  const data = customers.map((customer) => ({
    id: customer.id,
    customerNumber: customer.customerNumber,
    name: customer.name,
    type: customer.type,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    phone: customer.phone,
    email: customer.email,
    warning: customer.warning,
    createdAt: customer.createdAt,
  }));

  return (
    <PageShell title="Customers" description="Manage customer accounts and contacts">
      <CustomersTableClient data={data} />
    </PageShell>
  );
}
