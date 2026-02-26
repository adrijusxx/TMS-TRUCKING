'use client';

import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';

interface NavigationButtonsProps {
  address: string;
  city: string;
  state: string;
  label: string;
}

function buildGoogleMapsUrl(address: string, city: string, state: string): string {
  const destination = encodeURIComponent(`${address}, ${city}, ${state}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

function buildWazeUrl(address: string, city: string, state: string): string {
  const query = encodeURIComponent(`${address}, ${city}, ${state}`);
  return `https://waze.com/ul?q=${query}&navigate=yes`;
}

export default function NavigationButtons({
  address,
  city,
  state,
  label,
}: NavigationButtonsProps) {
  const fullAddress = [address, city, state].filter(Boolean).join(', ');
  if (!city && !address) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={() => window.open(buildGoogleMapsUrl(address, city, state), '_blank')}
        >
          <Navigation className="h-4 w-4 mr-1" />
          Google Maps
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={() => window.open(buildWazeUrl(address, city, state), '_blank')}
        >
          <MapPin className="h-4 w-4 mr-1" />
          Waze
        </Button>
      </div>
    </div>
  );
}
