'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { showErrorWithCopy } from '@/lib/utils/error-reporting';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    showErrorWithCopy(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-destructive/30">500</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Something Went Wrong
          </h2>
          <p className="text-muted-foreground">
            An unexpected error occurred. You can try again or return to the
            dashboard.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="mt-2 rounded-md bg-muted p-3 text-left text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
