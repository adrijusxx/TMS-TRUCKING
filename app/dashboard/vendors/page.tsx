import { Breadcrumb } from '@/components/ui/breadcrumb';
import VendorList from '@/components/vendors/VendorList';

export default function VendorsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Vendors', href: '/dashboard/vendors' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
        </div>
        <VendorList />
      </div>
    </>
  );
}
