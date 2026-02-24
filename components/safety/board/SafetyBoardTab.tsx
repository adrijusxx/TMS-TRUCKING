'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DriverComplianceTable from '@/components/safety/compliance/DriverComplianceTable';
import TruckComplianceBoard from './TruckComplianceBoard';
import TrailerComplianceBoard from './TrailerComplianceBoard';

type BoardView = 'driver' | 'truck' | 'trailer';

export default function SafetyBoardTab() {
  const [activeView, setActiveView] = useState<BoardView>('driver');

  const views: { key: BoardView; label: string }[] = [
    { key: 'driver', label: 'Driver' },
    { key: 'truck', label: 'Truck' },
    { key: 'trailer', label: 'Trailer' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {views.map((v) => (
          <Button
            key={v.key}
            variant={activeView === v.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView(v.key)}
          >
            {v.label}
          </Button>
        ))}
      </div>

      {activeView === 'driver' && <DriverComplianceTable />}
      {activeView === 'truck' && <TruckComplianceBoard />}
      {activeView === 'trailer' && <TrailerComplianceBoard />}
    </div>
  );
}
