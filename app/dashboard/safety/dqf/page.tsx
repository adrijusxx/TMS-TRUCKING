'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import DQFManager from '@/components/safety/dqf/DQFManager';

export default function DQFPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="space-y-4">
<Card>
          <CardHeader>
            <CardTitle>Manage DQF</CardTitle>
            <CardDescription>Select a driver to view and manage their qualification files</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their DQF"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <DQFManager driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
  );
}

