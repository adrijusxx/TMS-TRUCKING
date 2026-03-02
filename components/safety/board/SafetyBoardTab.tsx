'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import DriverComplianceTable from '@/components/safety/compliance/DriverComplianceTable';
import VehicleComplianceBoard from './VehicleComplianceBoard';

type BoardView = 'driver' | 'vehicles';

export default function SafetyBoardTab() {
  const { can } = usePermissions();
  const isDispatcher = can('safety.cdl.view') && !can('safety.view');
  const [activeView, setActiveView] = useState<BoardView>('driver');

  return (
    <div className="space-y-4">
      {!isDispatcher && (
        <div className="flex items-center gap-2">
          <Button
            variant={activeView === 'driver' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('driver')}
          >
            Driver
          </Button>
          <Button
            variant={activeView === 'vehicles' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('vehicles')}
          >
            Vehicles
          </Button>
        </div>
      )}

      {activeView === 'driver' && <DriverComplianceTable dispatcherMode={isDispatcher} />}
      {activeView === 'vehicles' && !isDispatcher && <VehicleComplianceBoard />}
    </div>
  );
}
