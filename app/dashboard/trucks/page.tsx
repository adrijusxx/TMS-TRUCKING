import TruckList from '@/components/trucks/TruckList';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function TrucksPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Trucks', href: '/dashboard/trucks' }]} />
      <TruckList />
    </>
  );
}

