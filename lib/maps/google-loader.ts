import { getPublicEnv } from '@/lib/env-client';

const DEFAULT_LIBRARIES = ['places', 'geometry', 'drawing'] as const;
const SCRIPT_ID = 'google-maps-script';

let loadPromise: Promise<typeof window.google> | null = null;

function ensureBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded in the browser');
  }
}

function buildLibrariesParam(extraLibraries: string[]): string {
  const unique = new Set<string>([...DEFAULT_LIBRARIES, ...extraLibraries]);
  return Array.from(unique).join(',');
}

/**
 * Singleton loader to inject the Google Maps JavaScript API exactly once.
 * Multiple components can call this function and it will reuse the same promise.
 */
export async function loadGoogleMapsApi(extraLibraries: string[] = []): Promise<typeof window.google> {
  ensureBrowser();

  if (window.google && window.google.maps) {
    return window.google;
  }

  if (loadPromise) {
    return loadPromise;
  }

  // Try to get API key from environment or fetch from server
  let apiKey = getPublicEnv('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');

  // If not available at build time, try to fetch from integration status API
  if (!apiKey) {
    try {
      const response = await fetch('/api/integrations/status');
      const data = await response.json();
      const googleMapsIntegration = data.data?.find((integration: any) => integration.provider === 'GOOGLE_MAPS');
      if (!googleMapsIntegration?.configured) {
        throw new Error('Google Maps API key not configured');
      }
      // Note: We can't get the actual key from the API for security reasons
      // This is just to check if it's configured
      throw new Error('Google Maps API key not available at build time. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in GitHub Actions.');
    } catch (error) {
      throw new Error('Google Maps API key not configured');
    }
  }

  loadPromise = new Promise((resolve, reject) => {
    const handleLoad = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        loadPromise = null;
        reject(new Error('Google Maps API loaded but window.google is undefined'));
      }
    };

    const handleError = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${buildLibrariesParam(extraLibraries)}`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}

