export interface PublicEnv {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
    NEXT_PUBLIC_BASE_PATH?: string;
    NEXT_PUBLIC_GOOGLE_MAPS_PUBLIC_API_KEY?: string; // From start script
}

declare global {
    interface Window {
        __ENV?: PublicEnv;
    }
}

/**
 * Get a public environment variable.
 * Prioritizes window.__ENV (runtime injection) over process.env (build time).
 */
export function getPublicEnv(key: keyof PublicEnv): string | undefined {
    if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key]) {
        return window.__ENV[key];
    }

    // Fallback to process.env
    // Note: Next.js will only inline this if we explicitly write process.env.KEY
    // effectively, we are relying on the fact that if this code runs on server, process.env is present.
    // If it runs on client and __ENV is missing, it returns undefined (unless inlined by webpack).
    // To avoid webpack inlining the "undefined" value during build for everything, 
    // we access process.env in a way that might be preserved or we just accept the fallback.
    // Actually, for this pattern to work best, we should return the value if present.

    return process.env[key];
}
