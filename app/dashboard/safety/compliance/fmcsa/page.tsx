import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Shield } from 'lucide-react';
import { FMCSATableClient } from './FMCSATableClient';

export default function FMCSAPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Compliance', href: '/dashboard/safety/compliance' },
        { label: 'FMCSA' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            FMCSA Compliance
          </h1>
        </div>
        <FMCSATableClient />
      </div>
    </>
  );
}

