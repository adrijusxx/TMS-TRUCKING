'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Loader2, Truck } from 'lucide-react';

interface BulkMcAssignmentBannerProps {
  currentMcNumberId: string | null;
}

interface TrucksWithoutMcData {
  trucksWithoutMc: Array<{
    id: string;
    truckNumber: string;
    make?: string;
    model?: string;
  }>;
  counts: {
    withoutMc: number;
    total: number;
    withMc: number;
  };
}

export function BulkMcAssignmentBanner({ currentMcNumberId }: BulkMcAssignmentBannerProps) {
  const [data, setData] = useState<TrucksWithoutMcData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTrucksWithoutMc();
  }, []);

  const fetchTrucksWithoutMc = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trucks/bulk-assign-mc');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch trucks without MC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!currentMcNumberId) {
      alert('Please select an MC Number from the top dropdown first.');
      return;
    }

    try {
      setAssigning(true);
      const response = await fetch('/api/trucks/bulk-assign-mc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcNumberId: currentMcNumberId,
          assignAll: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        // Refresh data after 2 seconds
        setTimeout(() => {
          fetchTrucksWithoutMc();
          setSuccess(false);
        }, 2000);
      } else {
        alert(`Failed to assign MC: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Bulk assign failed:', error);
      alert('Failed to assign MC. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  // Don't show if loading or no trucks without MC
  if (loading) return null;
  if (!data || data.counts.withoutMc === 0) return null;

  return (
    <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {data.counts.withoutMc} Trucks Without MC Number
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                These trucks were synced from Samsara but have no MC Number assigned. 
                They won't appear in truck selection dropdowns until assigned.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-orange-700 dark:text-orange-300">
                  {data.counts.withMc} with MC
                </Badge>
                <Badge variant="destructive">
                  {data.counts.withoutMc} without MC
                </Badge>
                <Badge variant="secondary">
                  {data.counts.total} total
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {success ? (
              <Button size="sm" variant="outline" disabled className="text-green-600">
                <Check className="h-4 w-4 mr-2" />
                Assigned!
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={handleBulkAssign}
                disabled={assigning || !currentMcNumberId}
                title={!currentMcNumberId ? 'Select an MC from the top dropdown first' : `Assign all ${data.counts.withoutMc} trucks to current MC`}
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Assign All to Current MC
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

