'use client';

/**
 * Generate Settlements Button
 * 
 * Triggers background settlement generation via Inngest.
 * Shows real-time progress using polling.
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';

interface GenerateSettlementsButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  companyId?: string;
}

type JobStatus = 'idle' | 'running' | 'completed' | 'failed';

export function GenerateSettlementsButton({
  variant = 'default',
  size = 'sm',
  companyId,
}: GenerateSettlementsButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<JobStatus>('idle');
  const [period, setPeriod] = React.useState<'last_week' | 'custom'>('last_week');
  const [result, setResult] = React.useState<{
    settlementsGenerated: number;
    errors: number;
  } | null>(null);

  const handleGenerate = async () => {
    setStatus('running');
    setResult(null);

    try {
      // Trigger via API (which sends to Inngest)
      const response = await fetch(apiUrl('/api/settlements/trigger-generation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          period,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to trigger generation');
      }

      const data = await response.json();
      
      setStatus('completed');
      setResult({
        settlementsGenerated: data.data?.settlementsGenerated || 0,
        errors: data.data?.errors?.length || 0,
      });

      toast.success(
        `Generated ${data.data?.settlementsGenerated || 0} settlements`,
        {
          description: data.data?.errors?.length
            ? `${data.data.errors.length} errors occurred`
            : 'All settlements generated successfully',
        }
      );
    } catch (error) {
      setStatus('failed');
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Settlement generation failed', { description: message });
    }
  };

  const resetState = () => {
    setStatus('idle');
    setResult(null);
    setPeriod('last_week');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Zap className="h-4 w-4 mr-2" />
          Auto Generate
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Generate Settlements
          </DialogTitle>
          <DialogDescription>
            Automatically generate settlements for all drivers with completed
            loads in the selected period.
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="period">Settlement Period</Label>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as 'last_week' | 'custom')}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_week">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Week (Mon-Sun)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-1">This will:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Find all drivers with delivered loads</li>
                <li>Calculate gross pay, deductions, and net pay</li>
                <li>Create settlement records in DRAFT status</li>
                <li>Send notifications to drivers and accounting</li>
              </ul>
            </div>
          </div>
        )}

        {status === 'running' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Generating settlements in background...
            </p>
            <Badge variant="outline">
              This may take a few minutes for large fleets
            </Badge>
          </div>
        )}

        {status === 'completed' && result && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-semibold">
                {result.settlementsGenerated} Settlements Generated
              </p>
              {result.errors > 0 && (
                <p className="text-sm text-orange-500">
                  {result.errors} errors occurred
                </p>
              )}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground">
              Settlement generation failed. Check console for details.
            </p>
          </div>
        )}

        <DialogFooter>
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate}>
                <Zap className="h-4 w-4 mr-2" />
                Generate Now
              </Button>
            </>
          )}
          {(status === 'completed' || status === 'failed') && (
            <Button onClick={() => setOpen(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





