'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface LocationState {
  location: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | undefined;
  longitude: number | undefined;
  locationLoading: boolean;
}

interface UseBreakdownLocationReturn extends LocationState {
  setLocation: (v: string) => void;
  setAddress: (v: string) => void;
  setCity: (v: string) => void;
  setState: (v: string) => void;
  setZip: (v: string) => void;
  getCurrentLocation: () => void;
}

export function useBreakdownLocation(): UseBreakdownLocationReturn {
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationLoading, setLocationLoading] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<void> => {
    const coordLocation = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setLocation(coordLocation);

    try {
      const response = await fetch(apiUrl(`/api/geocoding/reverse?lat=${lat}&lon=${lng}`));
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        if (addr.road) setAddress(`${addr.house_number || ''} ${addr.road}`.trim());
        if (addr.city || addr.town || addr.village) setCity(addr.city || addr.town || addr.village);
        if (addr.state) setState(addr.state);
        if (addr.postcode) setZip(addr.postcode);

        const locationParts = [];
        if (addr.road) locationParts.push(addr.road);
        if (addr.city || addr.town || addr.village) locationParts.push(addr.city || addr.town || addr.village);
        if (addr.state) locationParts.push(addr.state);
        if (locationParts.length > 0) setLocation(locationParts.join(', '));
      }
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates:', error);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);

    const timeoutId = setTimeout(() => {
      setLocationLoading(false);
      toast.error('Location request is taking too long. You can enter location manually.');
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        await reverseGeocode(lat, lng);
        toast.success('Location captured automatically');
        setLocationLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. You can enter location manually below.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. You can enter location manually below.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. You can enter location manually below.';
            break;
        }
        toast.error(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  // Auto-get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location, address, city, state, zip,
    latitude, longitude, locationLoading,
    setLocation, setAddress, setCity, setState, setZip,
    getCurrentLocation,
  };
}
