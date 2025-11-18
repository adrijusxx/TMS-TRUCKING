import DashboardLayout from '@/components/layout/DashboardLayout';
import InspectionList from '@/components/inspections/InspectionList';

export default function InspectionsPage() {
  return (
    <DashboardLayout>
      <InspectionList />
    </DashboardLayout>
  );
}
