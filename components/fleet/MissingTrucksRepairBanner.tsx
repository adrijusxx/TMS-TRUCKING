'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Loader2, Wrench, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MissingTrucksRepairBannerProps {
  currentMcNumberId: string | null;
  onRepairComplete?: () => void;
}

interface RepairDiagnostics {
  summary: {
    linkedDevices: number;
    existingTrucks: number;
    validLinks: number;
    missingTrucks: number;
    duplicates: number;
    trucksWithoutMc: number;
  };
  missingTrucks: Array<{
    id: string;
    name: string;
    vin?: string;
    make?: string;
    model?: string;
  }>;
}

export function MissingTrucksRepairBanner({ currentMcNumberId, onRepairComplete }: MissingTrucksRepairBannerProps) {
  const [data, setData] = useState<RepairDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [repairResult, setRepairResult] = useState<{ created: number; linked: number } | null>(null);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const url = currentMcNumberId
        ? `/api/fleet/device-queue/repair?mcNumberId=${currentMcNumberId}`
        : '/api/fleet/device-queue/repair';
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch repair diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    if (!currentMcNumberId) {
      toast.warning('Please select an MC Number from the top dropdown first. The new trucks will be assigned to that MC.');
      return;
    }

    try {
      setRepairing(true);
      const response = await fetch('/api/fleet/device-queue/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'repair',
          mcNumberId: currentMcNumberId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRepairResult(result.data);
        setSuccess(true);
        toast.success(`Created ${result.data.created} trucks, linked ${result.data.linked} devices`);
        // Refresh data after 3 seconds
        setTimeout(() => {
          fetchDiagnostics();
          setSuccess(false);
          setRepairResult(null);
          onRepairComplete?.();
        }, 3000);
      } else {
        toast.error(`Repair failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Repair failed:', error);
      toast.error('Repair failed. Please try again.');
    } finally {
      setRepairing(false);
    }
  };

  // Don't show if loading
  if (loading) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="p-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking for missing trucks...
        </div>
      </Card>
    );
  }

  // Don't show if no missing trucks
  if (!data || data.summary.missingTrucks === 0) return null;

  const discrepancy = data.summary.linkedDevices - data.summary.existingTrucks;

  return (
    <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {data.summary.missingTrucks} Missing Trucks Detected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                You have {data.summary.linkedDevices} linked Samsara devices but only {data.summary.existingTrucks} trucks in TMS.
                {discrepancy > 0 && ` That's ${discrepancy} trucks missing!`}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {currentMcNumberId
                  ? 'Click "Create Missing Trucks" to fix this. New trucks will be assigned to your current MC.'
                  : '⚠️ First, select a specific MC from the dropdown above (not "All MCs"), then click "Create Missing Trucks".'
                }
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-red-700 dark:text-red-300 border-red-300">
                  {data.summary.linkedDevices} linked devices
                </Badge>
                <Badge variant="destructive">
                  {data.summary.missingTrucks} missing trucks
                </Badge>
                <Badge variant="secondary">
                  {data.summary.existingTrucks} existing trucks
                </Badge>
                {data.summary.duplicates > 0 && (
                  <Badge variant="outline" className="text-yellow-700">
                    {data.summary.duplicates} potential duplicates
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchDiagnostics}
              disabled={repairing}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {success && repairResult ? (
              <Button size="sm" variant="outline" disabled className="text-green-600">
                <Check className="h-4 w-4 mr-2" />
                Created {repairResult.created}, Linked {repairResult.linked}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRepair}
                disabled={repairing || !currentMcNumberId}
                title={!currentMcNumberId ? 'Select an MC from the top dropdown first' : `Create ${data.summary.missingTrucks} missing trucks`}
              >
                {repairing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Create Missing Trucks
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

