/**
 * Error Reporting Utility
 * Provides consistent error reporting with copy-to-clipboard functionality
 */

import { toast } from 'sonner';

export interface ErrorReport {
  message: string;
  stack?: string;
  code?: string;
  name?: string;
  details?: any;
  context?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

/**
 * Format error details into a copyable text format
 */
export function formatErrorForCopy(error: ErrorReport): string {
  return `
Error Report - ${error.timestamp}
================================

${error.context ? `Context: ${error.context}\n` : ''}
Error Message:
${error.message}

${error.code ? `Error Code: ${error.code}\n` : ''}
${error.name ? `Error Name: ${error.name}\n` : ''}
${error.filename ? `File: ${error.filename}\n` : ''}
${error.lineno !== undefined ? `Line: ${error.lineno}\n` : ''}
${error.colno !== undefined ? `Column: ${error.colno}\n` : ''}
${error.url ? `URL: ${error.url}\n` : ''}
${error.stack ? `Stack Trace:\n${error.stack}\n` : ''}
${error.details ? `Details:\n${JSON.stringify(error.details, null, 2)}\n` : ''}

User Agent: ${error.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A')}
Page: ${error.url || (typeof window !== 'undefined' ? window.location.href : 'N/A')}
Timestamp: ${error.timestamp}
  `.trim();
}

/**
 * Copy error text to clipboard
 */
export function copyErrorToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success('Error details copied to clipboard!');
          resolve();
        })
        .catch((err) => {
          // Fallback for older browsers
          try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (success) {
              toast.success('Error details copied to clipboard!');
              resolve();
            } else {
              toast.error('Failed to copy error details');
              reject(new Error('Copy command failed'));
            }
          } catch (fallbackErr) {
            toast.error('Failed to copy error details');
            reject(fallbackErr);
          }
        });
    } else {
      reject(new Error('Clipboard API not available'));
    }
  });
}

/**
 * Show error toast with copy functionality
 */
export function showErrorWithCopy(
  error: Error | string | any,
  context?: string,
  options?: {
    duration?: number;
    description?: string;
  }
) {
  const errorObj = error instanceof Error 
    ? error 
    : typeof error === 'string' 
      ? new Error(error)
      : error?.error instanceof Error
        ? error.error
        : new Error(error?.message || String(error) || 'Unknown error');

  const errorReport: ErrorReport = {
    message: errorObj.message || 'Unknown error',
    stack: errorObj.stack,
    code: errorObj.code || error?.code,
    name: errorObj.name || error?.name,
    filename: (errorObj as any).filename || error?.filename,
    lineno: (errorObj as any).lineno || error?.lineno,
    colno: (errorObj as any).colno || error?.colno,
    details: error,
    context,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  const errorText = formatErrorForCopy(errorReport);

  toast.error(errorReport.message, {
    duration: options?.duration || 10000,
    description: options?.description || 'An error occurred. Click to copy error details.',
    action: {
      label: 'Copy Error',
      onClick: () => copyErrorToClipboard(errorText),
    },
    actionButtonStyle: {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  });

  // Also log to console for debugging
  console.error(`[${context || 'Error'}]`, error);
}

