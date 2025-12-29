'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, Bug, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorFeedbackToastProps {
  title: string;
  message: string;
  details?: string;
  errorCode?: string;
  timestamp?: string;
}

/**
 * Error feedback toast component with copy functionality
 */
export function ErrorFeedbackToast({
  title,
  message,
  details,
  errorCode,
  timestamp,
}: ErrorFeedbackToastProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fullErrorText = [
    `Error: ${title}`,
    `Message: ${message}`,
    errorCode && `Code: ${errorCode}`,
    timestamp && `Time: ${timestamp}`,
    details && `\nDetails:\n${details}`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullErrorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = fullErrorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm text-muted-foreground truncate">{message}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy error for reporting"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          {details && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Hide details' : 'Show details'}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {errorCode && (
        <p className="text-xs text-muted-foreground mt-1">Code: {errorCode}</p>
      )}

      {expanded && details && (
        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono max-h-32 overflow-auto">
          <pre className="whitespace-pre-wrap break-all">{details}</pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Click copy icon to report this error
      </p>
    </div>
  );
}

/**
 * Show an error toast with feedback/copy capability
 */
export function showErrorFeedback(
  title: string,
  message: string,
  options?: {
    details?: string;
    errorCode?: string;
    duration?: number;
  }
) {
  const timestamp = new Date().toISOString();

  toast.error(
    <ErrorFeedbackToast
      title={title}
      message={message}
      details={options?.details}
      errorCode={options?.errorCode}
      timestamp={timestamp}
    />,
    {
      duration: options?.duration ?? 10000, // 10 seconds default for errors
      closeButton: true,
    }
  );
}

/**
 * Global error handler for API responses
 */
export async function handleApiError(
  response: Response,
  fallbackMessage = 'An error occurred'
): Promise<never> {
  let errorMessage = fallbackMessage;
  let errorCode: string | undefined;
  let errorDetails: string | undefined;

  try {
    const error = await response.json();
    errorMessage = error.error?.message || error.message || fallbackMessage;
    errorCode = error.error?.code;

    // Include validation details if present
    if (error.error?.details && Array.isArray(error.error.details)) {
      errorDetails = error.error.details
        .map((d: { path?: string[]; message?: string }) => 
          `${d.path?.join('.') || 'field'}: ${d.message}`
        )
        .join('\n');
    }
  } catch {
    // Response wasn't JSON
    errorMessage = `${fallbackMessage} (${response.status})`;
  }

  showErrorFeedback(
    `API Error (${response.status})`,
    errorMessage,
    { errorCode, details: errorDetails }
  );

  throw new Error(errorMessage);
}

/**
 * Wrapper to catch and display errors from async operations
 */
export async function withErrorFeedback<T>(
  operation: () => Promise<T>,
  errorTitle = 'Operation Failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const details = error instanceof Error ? error.stack : undefined;

    showErrorFeedback(errorTitle, message, { details });
    throw error;
  }
}





