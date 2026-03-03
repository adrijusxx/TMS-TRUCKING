import { CustomersTableClient } from './CustomersTableClient';
import { PageShell } from '@/components/layout/PageShell';

export default function CustomersPage() {
  return (
    <PageShell title="Customers" description="Manage customer accounts and contacts">
      <CustomersTableClient />
    </PageShell>
  );
}
