import { Breadcrumb } from '@/components/ui/breadcrumb';
import InventoryList from '@/components/inventory/InventoryList';

export default function InventoryPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Inventory', href: '/dashboard/inventory' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <InventoryList />
      </div>
    </>
  );
}
