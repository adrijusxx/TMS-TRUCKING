/**
 * Retry utility for API calls with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error) return false;
    if (error.message?.includes('network') || error.message?.includes('timeout')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    return false;
  },
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if we've exhausted retries or error doesn't meet retry condition
      if (attempt === opts.maxRetries || !opts.retryCondition(error)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < opts.maxRetries) {
        await sleep(Math.min(delay, opts.maxDelay));
        delay *= opts.backoffMultiplier;
      }
    }
  }

  throw lastError;
}

/**
 * Retry with custom error handling
 */
async function retryWithErrorHandling<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  onRetry?: (error: any, attempt: number) => void
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt < opts.maxRetries && opts.retryCondition(error)) {
        if (onRetry) {
          onRetry(error, attempt + 1);
        }
        await sleep(Math.min(delay, opts.maxDelay));
        delay *= opts.backoffMultiplier;
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

