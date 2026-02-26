'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DriverSelector from '@/components/safety/DriverSelector';
import AnnualReviewForm from '@/components/safety/drivers/AnnualReviewForm';

export default function AnnualReviewsPage() {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  return (
    <div className="space-y-4">
<Card>
          <CardHeader>
            <CardTitle>Manage Annual Reviews</CardTitle>
            <CardDescription>Select a driver to view and manage their annual reviews</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <DriverSelector
            value={selectedDriverId}
            onValueChange={setSelectedDriverId}
            label="Select Driver"
            placeholder="Choose a driver to manage their annual reviews"
          />
          {selectedDriverId && (
            <div className="mt-6">
              <AnnualReviewForm driverId={selectedDriverId} />
            </div>
          )}
        </CardContent>
        </Card>
      </div>
  );
}

