'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import CDLManager from '@/components/safety/drivers/CDLManager';

export default function CDLPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="space-y-4">
<Card>
          <CardHeader>
            <CardTitle>Manage CDL Records</CardTitle>
            <CardDescription>Select a driver to view and manage their CDL information</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their CDL records"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <CDLManager driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
  );
}

