'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Fuel, Clock } from 'lucide-react';
import { formatCurrency, apiUrl } from '@/lib/utils';

async function calculateRoute(data: {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  loadId?: string;
}) {
  const response = await fetch(apiUrl('/api/routes/calculate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to calculate route');
  }
  return response.json();
}

interface RouteCalculatorProps {
  loadId?: string;
  pickupCity?: string;
  pickupState?: string;
  deliveryCity?: string;
  deliveryState?: string;
}

export default function RouteCalculator({
  loadId,
  pickupCity,
  pickupState,
  deliveryCity,
  deliveryState,
}: RouteCalculatorProps) {
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');

  const calculateMutation = useMutation({
    mutationFn: calculateRoute,
  });

  const handleCalculate = () => {
    if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
      alert('Please enter all coordinates');
      return;
    }

    calculateMutation.mutate({
      pickupLat: parseFloat(pickupLat),
      pickupLng: parseFloat(pickupLng),
      deliveryLat: parseFloat(deliveryLat),
      deliveryLng: parseFloat(deliveryLng),
      loadId,
    });
  };

  const result = calculateMutation.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Route Calculator
        </CardTitle>
        <CardDescription>
          Calculate distance, time, and fuel cost for a route
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickupLat">Pickup Latitude</Label>
            <Input
              id="pickupLat"
              type="number"
              step="any"
              placeholder="32.7767"
              value={pickupLat}
              onChange={(e) => setPickupLat(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupLng">Pickup Longitude</Label>
            <Input
              id="pickupLng"
              type="number"
              step="any"
              placeholder="-96.7970"
              value={pickupLng}
              onChange={(e) => setPickupLng(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryLat">Delivery Latitude</Label>
            <Input
              id="deliveryLat"
              type="number"
              step="any"
              placeholder="29.7604"
              value={deliveryLat}
              onChange={(e) => setDeliveryLat(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryLng">Delivery Longitude</Label>
            <Input
              id="deliveryLng"
              type="number"
              step="any"
              placeholder="-95.3698"
              value={deliveryLng}
              onChange={(e) => setDeliveryLng(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full"
        >
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Route'}
        </Button>

        {calculateMutation.error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {calculateMutation.error.message}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Distance</span>
              </div>
              <span className="text-lg font-bold">{result.distance} miles</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estimated Time</span>
              </div>
              <span className="text-lg font-bold">
                {Math.floor(result.estimatedTime / 60)}h{' '}
                {result.estimatedTime % 60}m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estimated Fuel Cost</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(result.fuelCost)}
              </span>
            </div>
          </div>
        )}

        {pickupCity && deliveryCity && (
          <div className="text-sm text-muted-foreground">
            <p>
              Tip: Use Google Maps to find coordinates for {pickupCity},{' '}
              {pickupState} and {deliveryCity}, {deliveryState}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

