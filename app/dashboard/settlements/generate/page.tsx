import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import GenerateSettlementForm from '@/components/settlements/GenerateSettlementForm';

export default async function GenerateSettlementPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    redirect('/login');
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Settlements', href: '/dashboard/settlements' },
          { label: 'Generate Settlement' },
        ]}
      />
      <GenerateSettlementForm />
    </>
  );
}
























