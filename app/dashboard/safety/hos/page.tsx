'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import HOSDashboard from '@/components/safety/drivers/HOSDashboard';

export default function HOSPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="space-y-4">
<Card>
          <CardHeader>
            <CardTitle>HOS Monitoring</CardTitle>
            <CardDescription>Select a driver to view their HOS records and violations</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to view their HOS records"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <HOSDashboard driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
  );
}

