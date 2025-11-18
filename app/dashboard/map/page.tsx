import DashboardLayout from '@/components/layout/DashboardLayout';
import LiveMap from '@/components/map/LiveMap';

export default function MapPage() {
  return (
    <DashboardLayout>
      <LiveMap />
    </DashboardLayout>
  );
}
