import DashboardLayout from '@/components/layout/DashboardLayout';
import InventoryList from '@/components/inventory/InventoryList';

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <InventoryList />
    </DashboardLayout>
  );
}
