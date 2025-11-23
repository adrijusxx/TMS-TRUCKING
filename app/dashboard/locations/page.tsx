import { Breadcrumb } from '@/components/ui/breadcrumb';
import LocationList from '@/components/locations/LocationList';

export default function LocationsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Locations', href: '/dashboard/locations' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
        </div>
        <LocationList />
      </div>
    </>
  );
}
