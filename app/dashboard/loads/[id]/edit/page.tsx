import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import EditLoadForm from '@/components/loads/EditLoadForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function EditLoadPage({
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

  const load = await prisma.load.findFirst({
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
    },
  });

  if (!load) {
    notFound();
  }

  return (
    <>
      <Breadcrumb items={[
        { label: 'Load Management', href: '/dashboard/loads' },
        { label: `Load #${load.loadNumber}`, href: `/dashboard/loads/${loadId}` },
        { label: 'Edit' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Load</h1>
        </div>
        <EditLoadForm loadId={loadId} initialData={load} />
      </div>
    </>
  );
}
