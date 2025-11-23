'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, apiUrl } from '@/lib/utils';
import { Plus, Split, User, Truck, MapPin, Calendar, Route } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LoadSegment {
  id: string;
  sequence: number;
  driverId?: string | null;
  truckId?: string | null;
  startLocation?: string | null;
  endLocation?: string | null;
  startCity?: string | null;
  startState?: string | null;
  endCity?: string | null;
  endState?: string | null;
  segmentMiles: number;
  loadedMiles?: number | null;
  emptyMiles?: number | null;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  isAutoCreated: boolean;
  driver?: {
    id: string;
    driverNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  truck?: {
    id: string;
    truckNumber: string;
  } | null;
}

interface LoadSegmentsProps {
  loadId: string;
  segments: LoadSegment[];
  availableDrivers?: any[];
  availableTrucks?: any[];
  canEdit?: boolean;
}

export default function LoadSegments({
  loadId,
  segments: initialSegments,
  availableDrivers = [],
  availableTrucks = [],
  canEdit = true,
}: LoadSegmentsProps) {
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitData, setSplitData] = useState({
    newDriverId: '',
    newTruckId: '',
    splitLocation: '',
    splitDate: new Date().toISOString().split('T')[0],
    splitMiles: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  // Fetch segments
  const { data: segmentsData, refetch } = useQuery({
    queryKey: ['load-segments', loadId],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/loads/${loadId}/split`));
      if (!response.ok) throw new Error('Failed to fetch segments');
      const result = await response.json();
      return result.data || [];
    },
    initialData: initialSegments,
  });

  const segments = segmentsData || initialSegments;

  const splitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(apiUrl(`/api/loads/${loadId}/split`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to split load');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Load split successfully');
      setShowSplitDialog(false);
      setSplitData({
        newDriverId: '',
        newTruckId: '',
        splitLocation: '',
        splitDate: new Date().toISOString().split('T')[0],
        splitMiles: '',
        notes: '',
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['load', loadId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to split load');
    },
  });

  const handleSplit = () => {
    if (!splitData.newDriverId && !splitData.newTruckId) {
      toast.error('Please select a new driver or truck');
      return;
    }

    // Convert date to ISO datetime string
    const splitDateTime = splitData.splitDate 
      ? new Date(splitData.splitDate + 'T00:00:00').toISOString()
      : new Date().toISOString();

    splitMutation.mutate({
      newDriverId: splitData.newDriverId || undefined,
      newTruckId: splitData.newTruckId || undefined,
      splitLocation: splitData.splitLocation || undefined,
      splitDate: splitDateTime,
      splitMiles: splitData.splitMiles ? parseFloat(splitData.splitMiles) : undefined,
      notes: splitData.notes || undefined,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Load Segments
              </CardTitle>
              <CardDescription>
                Track load splits when drivers or trucks change during transit
              </CardDescription>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSplitDialog(true)}
              >
                <Split className="h-4 w-4 mr-2" />
                Split Load
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {segments && segments.length > 0 ? (
            <div className="space-y-4">
              {segments.map((segment: LoadSegment, index: number) => (
                <div
                  key={segment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Segment {segment.sequence}</Badge>
                      {segment.isAutoCreated && (
                        <Badge variant="secondary" className="text-xs">
                          Auto-created
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(segment.startDate)}
                      {segment.endDate && ` - ${formatDate(segment.endDate)}`}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Driver */}
                    {segment.driver && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Driver</p>
                          <p className="font-medium">
                            {segment.driver.user.firstName} {segment.driver.user.lastName}
                            <span className="text-muted-foreground ml-1">
                              (#{segment.driver.driverNumber})
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Truck */}
                    {segment.truck && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Truck</p>
                          <p className="font-medium">
                            #{segment.truck.truckNumber}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {(segment.startLocation || segment.endLocation) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Route</p>
                          <p className="text-sm">
                            {segment.startLocation || `${segment.startCity}, ${segment.startState}`}
                            {segment.endLocation && (
                              <>
                                {' → '}
                                {segment.endLocation || `${segment.endCity}, ${segment.endState}`}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Miles */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Miles</p>
                      <div className="flex gap-2 text-sm">
                        <span className="font-medium">{segment.segmentMiles.toFixed(1)}</span>
                        {segment.loadedMiles !== null && segment.loadedMiles !== undefined && (
                          <span className="text-muted-foreground">
                            ({segment.loadedMiles.toFixed(1)} loaded)
                          </span>
                        )}
                        {segment.emptyMiles !== null && segment.emptyMiles !== undefined && segment.emptyMiles > 0 && (
                          <span className="text-muted-foreground">
                            ({segment.emptyMiles.toFixed(1)} empty)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {segment.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{segment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No segments created yet</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowSplitDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Segment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Split Load Dialog */}
      <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Load</DialogTitle>
            <DialogDescription>
              Split this load to assign a different driver or truck. This will create a new segment
              for accounting purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newDriver">New Driver (Optional)</Label>
                <Select
                  value={splitData.newDriverId || 'none'}
                  onValueChange={(value) =>
                    setSplitData({ ...splitData, newDriverId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="newDriver">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.user.firstName} {driver.user.lastName} (#{driver.driverNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="newTruck">New Truck (Optional)</Label>
                <Select
                  value={splitData.newTruckId || 'none'}
                  onValueChange={(value) =>
                    setSplitData({ ...splitData, newTruckId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="newTruck">
                    <SelectValue placeholder="Select truck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableTrucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        #{truck.truckNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="splitLocation">Split Location</Label>
              <Input
                id="splitLocation"
                placeholder="City, State"
                value={splitData.splitLocation}
                onChange={(e) =>
                  setSplitData({ ...splitData, splitLocation: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="splitDate">Split Date</Label>
                <Input
                  id="splitDate"
                  type="date"
                  value={splitData.splitDate}
                  onChange={(e) =>
                    setSplitData({ ...splitData, splitDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="splitMiles">Miles at Split Point (Optional)</Label>
                <Input
                  id="splitMiles"
                  type="number"
                  step="0.1"
                  placeholder="Auto-calculated if empty"
                  value={splitData.splitMiles}
                  onChange={(e) =>
                    setSplitData({ ...splitData, splitMiles: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes about this split"
                value={splitData.notes}
                onChange={(e) =>
                  setSplitData({ ...splitData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSplitDialog(false)}
              disabled={splitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSplit}
              disabled={splitMutation.isPending || (!splitData.newDriverId && !splitData.newTruckId)}
            >
              {splitMutation.isPending ? 'Splitting...' : 'Split Load'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

