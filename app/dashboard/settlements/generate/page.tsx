import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import GenerateSettlementForm from '@/components/settlements/GenerateSettlementForm';
import { PageShell } from '@/components/layout/PageShell';

export default async function GenerateSettlementPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  return (
    <PageShell title="Generate Settlement" description="Create a new driver settlement from delivered loads">
      <GenerateSettlementForm />
    </PageShell>
  );
}
