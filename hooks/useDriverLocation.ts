'use client';

import { useState, useEffect, useCallback } from 'react';

interface DriverLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface UseDriverLocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

export function useDriverLocation(options?: UseDriverLocationOptions) {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location permission denied',
      2: 'Location unavailable',
      3: 'Location request timed out',
    };
    setError(messages[err.code] || 'Unknown location error');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setIsLoading(false);
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      maximumAge: options?.maximumAge ?? 30000,
      timeout: options?.timeout ?? 10000,
    };

    if (options?.watch) {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }, [options?.watch, options?.enableHighAccuracy, options?.maximumAge, options?.timeout, handleSuccess, handleError]);

  return { location, isLoading, error };
}
