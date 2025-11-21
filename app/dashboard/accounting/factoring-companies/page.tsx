import { auth } from '@/app/api/auth/[...nextauth]/route';
import FactoringCompanyList from '@/components/factoring/FactoringCompanyList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function FactoringCompaniesPage() {
  const session = await auth();

  if (!session?.user?.companyId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Accounting', href: '/dashboard/accounting' },
          { label: 'Factoring', href: '/dashboard/accounting/factoring' },
          { label: 'Factoring Companies', href: '/dashboard/accounting/factoring-companies' },
        ]}
      />
      <FactoringCompanyList />
    </div>
  );
}

