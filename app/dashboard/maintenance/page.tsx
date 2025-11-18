import DashboardLayout from '@/components/layout/DashboardLayout';
import MaintenanceList from '@/components/maintenance/MaintenanceList';

export default function MaintenancePage() {
  return (
    <DashboardLayout>
      <MaintenanceList />
    </DashboardLayout>
  );
}
