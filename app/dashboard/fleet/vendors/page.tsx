import BreakdownVendorDirectory from '@/components/fleet/BreakdownVendorDirectory';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetVendorsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Vendor Directory' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Directory</h1>
        </div>
        <BreakdownVendorDirectory />
      </div>
    </>
  );
}

