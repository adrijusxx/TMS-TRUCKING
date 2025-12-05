/**
 * Fleet Devices Page
 * 
 * Manage Samsara device sync and review pending devices.
 */

import { Metadata } from 'next';
import SamsaraDeviceQueue from '@/components/fleet/SamsaraDeviceQueue';
import FleetFaultSummary from '@/components/fleet/FleetFaultSummary';

export const metadata: Metadata = {
  title: 'Samsara Devices | Fleet Management',
  description: 'Manage Samsara device synchronization',
};

export default function FleetDevicesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Samsara Devices</h1>
          <p className="text-xs text-muted-foreground">
            Sync and manage Samsara-connected trucks and trailers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main queue - takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <SamsaraDeviceQueue />
        </div>

        {/* Fault summary sidebar */}
        <div className="space-y-4">
          <FleetFaultSummary />
        </div>
      </div>
    </div>
  );
}


