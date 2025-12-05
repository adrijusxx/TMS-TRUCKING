/**
 * Fleet Devices Page (Unified)
 * 
 * Manage Samsara device sync and review pending devices.
 * Combines table view (with bulk actions) and smart sections view.
 */

import { Metadata } from 'next';
import { UnifiedDeviceQueue } from '@/components/fleet/UnifiedDeviceQueue';

export const metadata: Metadata = {
  title: 'Samsara Devices | Fleet Management',
  description: 'Manage Samsara device synchronization',
};

export default function FleetDevicesPage() {
  return <UnifiedDeviceQueue />;
}


