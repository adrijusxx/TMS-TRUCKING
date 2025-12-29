import { Breadcrumb } from '@/components/ui/breadcrumb';
import LiveMap from '@/components/map/LiveMap';

export default function MapPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Live Map', href: '/dashboard/map' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Live Map</h1>
        </div>
        <LiveMap />
      </div>
    </>
  );
}
