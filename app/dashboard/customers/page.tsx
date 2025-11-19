import CustomerList from '@/components/customers/CustomerList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function CustomersPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Customers', href: '/dashboard/customers' }]} />
      <CustomerList />
    </>
  );
}

