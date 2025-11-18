import DashboardLayout from '@/components/layout/DashboardLayout';
import LocationList from '@/components/locations/LocationList';

export default function LocationsPage() {
  return (
    <DashboardLayout>
      <LocationList />
    </DashboardLayout>
  );
}
