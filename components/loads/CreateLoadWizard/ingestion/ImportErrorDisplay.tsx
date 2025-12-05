'use client';

import { Button } from '@/components/ui/button';
import { FileText, RefreshCw } from 'lucide-react';

interface ImportErrorDisplayProps {
  error: Error | unknown;
  onRetry: () => void;
}

export function ImportErrorDisplay({ error, onRetry }: ImportErrorDisplayProps) {
  const errorMessage =
    error instanceof Error ? error.message : 'An unknown error occurred';

  return (
    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
      <div className="flex items-center gap-2 text-destructive">
        <FileText className="h-4 w-4" />
        <p className="text-sm font-medium">Import Failed</p>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-3"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}





