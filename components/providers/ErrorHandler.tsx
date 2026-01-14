'use client';

import { useEffect } from 'react';
import { showErrorWithCopy } from '@/lib/utils/error-reporting';

export function ErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();

      const error = event.reason;
      showErrorWithCopy(error, 'Unhandled Promise Rejection', {
        description: 'An unexpected error occurred. Click to copy error details.',
      });
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      // Ignore benign ResizeObserver error
      if (event.message === 'ResizeObserver loop completed with undelivered notifications.') {
        return;
      }

      const error = event.error || new Error(event.message);
      // Add additional context from ErrorEvent
      if (event.filename) {
        (error as any).filename = event.filename;
        (error as any).lineno = event.lineno;
        (error as any).colno = event.colno;
      }

      showErrorWithCopy(error, 'Uncaught JavaScript Error', {
        description: 'A JavaScript error occurred. Click to copy error details.',
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}

