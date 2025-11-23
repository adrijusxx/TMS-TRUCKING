import CommunicationHub from '@/components/fleet/CommunicationHub';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function CommunicationsPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Fleet Department', href: '/dashboard/fleet' },
          { label: 'Communication Hub' },
        ]}
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Communication Hub</h1>
        </div>
        <CommunicationHub />
      </div>
    </>
  );
}

