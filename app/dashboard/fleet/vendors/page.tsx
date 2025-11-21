import BreakdownVendorDirectory from '@/components/fleet/BreakdownVendorDirectory';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function FleetVendorsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Vendor Directory', href: '/dashboard/fleet/vendors' },
        ]}
      />
      <BreakdownVendorDirectory />
    </>
  );
}

