/**
 * Next.js Instrumentation Hook
 * 
 * This file runs once when the Next.js server starts, before any requests are handled.
 * This is the ideal place to initialize AWS Secrets Manager secrets.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (server-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Use relative path for better TypeScript resolution in dynamic imports
      const { initializeSecrets } = await import('./lib/secrets/initialize');
      await initializeSecrets();
      console.log('[Instrumentation] Secrets initialization completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Instrumentation] Failed to initialize secrets:', errorMessage);
      // Don't throw - let the application start and handle missing secrets gracefully
      // Individual routes/services will handle missing secrets appropriately
    }
  }
}

