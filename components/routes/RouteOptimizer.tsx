'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, apiUrl } from '@/lib/utils';
import { Route, MapPin, Zap, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface RouteOptimizerProps {
  selectedLoadIds: string[];
  onOptimized?: (sequence: string[]) => void;
}

async function optimizeRoute(data: {
  loadIds: string[];
  optimizationType: 'DISTANCE' | 'TIME' | 'COST';
  startLocation?: { city: string; state: string };
}) {
  const response = await fetch(apiUrl('/api/routes/optimize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to optimize route');
  }
  return response.json();
}

export default function RouteOptimizer({
  selectedLoadIds,
  onOptimized,
}: RouteOptimizerProps) {
  const [optimizationType, setOptimizationType] = useState<'DISTANCE' | 'TIME' | 'COST'>('DISTANCE');
  const [startCity, setStartCity] = useState('');
  const [startState, setStartState] = useState('');

  const optimizeMutation = useMutation({
    mutationFn: optimizeRoute,
    onSuccess: (data) => {
      toast.success('Route optimized successfully');
      if (onOptimized) {
        onOptimized(data.data.optimizedSequence);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to optimize route');
    },
  });

  const handleOptimize = () => {
    if (selectedLoadIds.length < 2) {
      toast.error('Please select at least 2 loads for optimization');
      return;
    }

    optimizeMutation.mutate({
      loadIds: selectedLoadIds,
      optimizationType,
      startLocation:
        startCity && startState
          ? { city: startCity, state: startState }
          : undefined,
    });
  };

  const result = optimizeMutation.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Route Optimizer
        </CardTitle>
        <CardDescription>
          Optimize route for {selectedLoadIds.length} selected load(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="optimizationType">Optimization Type</Label>
          <Select
            value={optimizationType}
            onValueChange={(v) => setOptimizationType(v as 'DISTANCE' | 'TIME' | 'COST')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISTANCE">Minimize Distance</SelectItem>
              <SelectItem value="TIME">Minimize Time</SelectItem>
              <SelectItem value="COST">Minimize Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startCity">Start City (Optional)</Label>
            <Input
              id="startCity"
              placeholder="Dallas"
              value={startCity}
              onChange={(e) => setStartCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startState">Start State (Optional)</Label>
            <Input
              id="startState"
              placeholder="TX"
              maxLength={2}
              value={startState}
              onChange={(e) => setStartState(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <Button
          onClick={handleOptimize}
          disabled={optimizeMutation.isPending || selectedLoadIds.length < 2}
          className="w-full"
        >
          <Route className="h-4 w-4 mr-2" />
          {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Route'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Optimization Results</span>
              <Badge variant="outline">
                {result.metrics.totalLoads} load(s)
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Distance</p>
                  <p className="font-medium">{result.metrics.totalDistance} mi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Time</p>
                  <p className="font-medium">{result.metrics.estimatedTime} hrs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Fuel Cost</p>
                  <p className="font-medium">
                    {formatCurrency(result.metrics.estimatedFuelCost)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Optimized Sequence</p>
              <div className="space-y-1">
                {result.waypoints.map((waypoint: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">#{idx + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {waypoint.type === 'pickup' ? 'Pickup' : 'Delivery'}
                    </Badge>
                    <span>
                      {waypoint.city}, {waypoint.state}
                    </span>
                    <span className="text-muted-foreground">
                      (Load: {result.loads.find((l: any) => l.id === waypoint.loadId)?.loadNumber || 'N/A'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {optimizeMutation.error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {optimizeMutation.error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

