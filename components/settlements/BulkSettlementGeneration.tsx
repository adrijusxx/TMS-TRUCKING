'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface GenerationResult {
  success: boolean;
  totalCompanies: number;
  totalDrivers: number;
  settlementsGenerated: number;
  errors: Array<{
    companyId: string;
    driverId?: string;
    error: string;
  }>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

async function triggerBulkSettlementGeneration(data: {
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<GenerationResult> {
  const response = await fetch(apiUrl('/api/automation/settlement-generation'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periodStart: data.periodStart?.toISOString(),
      periodEnd: data.periodEnd?.toISOString(),
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate settlements');
  }
  const json = await response.json();
  // API returns { success: boolean, data: GenerationResult }
  return json.data || json;
}

export default function BulkSettlementGeneration() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState<Date | undefined>(() => {
    // Default to last Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - 7); // Previous Monday
    return monday;
  });
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(() => {
    // Default to last Sunday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Last Sunday
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  });

  const generateMutation = useMutation({
    mutationFn: triggerBulkSettlementGeneration,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(
        `Successfully generated ${result.settlementsGenerated} settlement(s) for ${result.totalDrivers} driver(s)`
      );
      if (result.settlementsGenerated > 0) {
        router.push('/dashboard/settlements');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate settlements');
    },
  });

  const handleGenerate = () => {
    if (!periodStart || !periodEnd) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (periodStart >= periodEnd) {
      toast.error('Start date must be before end date');
      return;
    }
    generateMutation.mutate({ periodStart, periodEnd });
  };

  const result = generateMutation.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Settlement Generation</CardTitle>
        <CardDescription>
          Generate settlements for all active drivers for a specific pay period. This will process
          all drivers with completed loads in the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="periodStart">Pay Period Start *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="periodStart"
                type="date"
                value={periodStart ? periodStart.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    date.setHours(0, 0, 0, 0);
                    setPeriodStart(date);
                  } else {
                    setPeriodStart(undefined);
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="periodEnd">Pay Period End *</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd ? periodEnd.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    date.setHours(23, 59, 59, 999);
                    setPeriodEnd(date);
                  } else {
                    setPeriodEnd(undefined);
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                monday.setDate(monday.getDate() - 7);
                setPeriodStart(monday);
                const sunday = new Date(monday);
                sunday.setDate(sunday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                setPeriodEnd(sunday);
              }}
            >
              Last Week (Mon-Sun)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                monday.setDate(monday.getDate() - 14);
                setPeriodStart(monday);
                const sunday = new Date(monday);
                sunday.setDate(sunday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                setPeriodEnd(sunday);
              }}
            >
              Two Weeks Ago
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                firstDay.setHours(0, 0, 0, 0);
                setPeriodStart(firstDay);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                lastDay.setHours(23, 59, 59, 999);
                setPeriodEnd(lastDay);
              }}
            >
              Current Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                firstDay.setHours(0, 0, 0, 0);
                setPeriodStart(firstDay);
                const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                lastDay.setHours(23, 59, 59, 999);
                setPeriodEnd(lastDay);
              }}
            >
              Last Month
            </Button>
          </div>
        </div>

        {/* Selected Period Display */}
        {periodStart && periodEnd && (
          <Alert>
            <CalendarIcon className="h-4 w-4" />
            <AlertTitle>Selected Pay Period</AlertTitle>
            <AlertDescription>
              {periodStart.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              to{' '}
              {periodEnd.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              <br />
              <span className="text-sm text-muted-foreground">
                ({Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))}{' '}
                days)
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Result */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success ? 'Generation Complete' : 'Generation Completed with Errors'}
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-1 mt-2">
                <p>
                  <strong>Settlements Generated:</strong> {result.settlementsGenerated}
                </p>
                <p>
                  <strong>Total Drivers Processed:</strong> {result.totalDrivers}
                </p>
                <p>
                  <strong>Duration:</strong> {(result.duration / 1000).toFixed(2)} seconds
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-destructive">Errors ({result.errors.length}):</p>
                    <ul className="list-disc list-inside text-sm">
                      {result.errors.slice(0, 5).map((error: { companyId: string; driverId?: string; error: string }, idx: number) => (
                        <li key={idx}>
                          {error.driverId ? `Driver ${error.driverId}: ` : ''}
                          {error.error}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-muted-foreground">
                          ... and {result.errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !periodStart || !periodEnd}
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Settlements...
              </>
            ) : (
              'Generate Settlements for All Drivers'
            )}
          </Button>
        </div>

        {/* Warning */}
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Important</AlertTitle>
          <AlertDescription className="text-yellow-700">
            This will generate settlements for all active drivers who have completed loads in the
            selected period. Existing settlements for the same period will be skipped. The process
            may take several minutes for large fleets.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

