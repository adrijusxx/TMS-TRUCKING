import CommunicationHub from '@/components/fleet/CommunicationHub';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Fleet Department', href: '/dashboard/fleet/breakdowns' },
          { label: 'Communication Hub', href: '/dashboard/fleet/communications' },
        ]}
      />
      <CommunicationHub />
    </div>
  );
}

