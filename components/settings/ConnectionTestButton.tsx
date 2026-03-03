'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

type Provider = 'SAMSARA' | 'QUICKBOOKS' | 'TELEGRAM' | 'NETSAPIENS';

interface ConnectionTestResult {
  success: boolean;
  connected: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface ConnectionTestButtonProps {
  provider: Provider;
  mcNumberId?: string;
  apiToken?: string;
  size?: 'xs' | 'sm' | 'default';
  onComplete?: (result: ConnectionTestResult) => void;
  className?: string;
}

// ============================================
// Component
// ============================================

export default function ConnectionTestButton({
  provider,
  mcNumberId,
  apiToken,
  size = 'sm',
  onComplete,
  className,
}: ConnectionTestButtonProps) {
  const [state, setState] = useState<'idle' | 'testing' | 'success' | 'failure'>('idle');
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    setState('testing');
    setResult(null);

    try {
      const body: Record<string, string> = { provider };
      if (mcNumberId) body.mcNumberId = mcNumberId;
      if (apiToken) body.apiToken = apiToken;

      const res = await fetch('/api/settings/integrations/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: ConnectionTestResult = await res.json();
      setResult(data);
      setState(data.connected ? 'success' : 'failure');
      onComplete?.(data);
    } catch (err) {
      const errorResult: ConnectionTestResult = {
        success: false,
        connected: false,
        message: err instanceof Error ? err.message : 'Network error',
      };
      setResult(errorResult);
      setState('failure');
      onComplete?.(errorResult);
    }

    // Auto-reset after 8 seconds
    setTimeout(() => {
      setState('idle');
      setResult(null);
    }, 8000);
  };

  const buttonSize = size === 'xs' ? 'sm' : size;

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={handleTest}
        disabled={state === 'testing'}
        className={cn(
          size === 'xs' && 'h-7 text-xs px-2',
          state === 'success' && 'border-green-500 text-green-600 dark:text-green-400',
          state === 'failure' && 'border-red-500 text-red-600 dark:text-red-400'
        )}
      >
        {state === 'testing' && (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            Testing...
          </>
        )}
        {state === 'idle' && (
          <>
            <Plug className="h-3.5 w-3.5 mr-1" />
            Test
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Connected
          </>
        )}
        {state === 'failure' && (
          <>
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Failed
          </>
        )}
      </Button>

      {/* Result Details */}
      {result && (state === 'success' || state === 'failure') && (
        <TestResultDetails result={result} state={state} />
      )}
    </div>
  );
}

// ============================================
// Result Details
// ============================================

function TestResultDetails({
  result,
  state,
}: {
  result: ConnectionTestResult;
  state: 'success' | 'failure';
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-xs space-y-1',
        state === 'success' && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
        state === 'failure' && 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
      )}
    >
      <p className="font-medium">{result.message}</p>

      {result.details && Object.keys(result.details).length > 0 && (
        <div className="text-muted-foreground space-y-0.5">
          {Object.entries(result.details).map(([key, value]) => (
            <p key={key}>
              <span className="capitalize">{formatDetailKey(key)}</span>:{' '}
              {formatDetailValue(value)}
            </p>
          ))}
        </div>
      )}

      {state === 'success' && !!result.details?.testedAt && (
        <Badge variant="success" size="xs">Verified</Badge>
      )}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatDetailKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}
