import TruckListNew from '@/components/trucks/TruckListNew';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function TrucksPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Trucks', href: '/dashboard/trucks' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trucks</h1>
        </div>
        <TruckListNew />
      </div>
    </>
  );
}

