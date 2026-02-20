'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Fuel, X, Navigation } from 'lucide-react';
import type { FuelSuggestion } from '@/lib/services/fuel/FuelStationProvider';

interface FuelNotificationBannerProps {
  suggestion: FuelSuggestion | null;
}

const DISMISS_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export default function FuelNotificationBanner({
  suggestion,
}: FuelNotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!suggestion) return;
    const key = `fuel-alert-dismissed-${suggestion.station.id}`;
    const stored = localStorage.getItem(key);
    if (stored && Date.now() - parseInt(stored, 10) < DISMISS_TTL_MS) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, [suggestion]);

  if (!suggestion || dismissed) return null;

  const handleDismiss = () => {
    const key = `fuel-alert-dismissed-${suggestion.station.id}`;
    localStorage.setItem(key, Date.now().toString());
    setDismissed(true);
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${suggestion.station.lat},${suggestion.station.lng}`;
    window.open(url, '_blank');
  };

  const urgencyStyles = {
    HIGH: 'bg-red-50 border-red-200 text-red-800',
    MEDIUM: 'bg-amber-50 border-amber-200 text-amber-800',
    LOW: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = suggestion.urgency === 'HIGH' ? AlertTriangle : Fuel;

  return (
    <div
      className={`rounded-lg border p-3 mx-4 mb-3 ${urgencyStyles[suggestion.urgency]}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{suggestion.reason}</p>
          {suggestion.station.dieselPrice != null && (
            <p className="text-xs mt-0.5 opacity-80">
              Diesel ${suggestion.station.dieselPrice.toFixed(2)}/gal at{' '}
              {suggestion.station.name}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs"
            onClick={handleNavigate}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Navigate
          </Button>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
