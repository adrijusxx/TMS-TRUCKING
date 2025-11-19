import DriverList from '@/components/drivers/DriverList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function DriversPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Drivers', href: '/dashboard/drivers' }]} />
      <DriverList />
    </>
  );
}

