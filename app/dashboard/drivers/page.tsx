import DriverListWithTabs from '@/components/drivers/DriverListWithTabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DriversPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Drivers', href: '/dashboard/drivers' }]} />
      <DriverListWithTabs />
    </>
  );
}

