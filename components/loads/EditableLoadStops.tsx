'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Package, Clock, Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface StopItem {
  orderId?: string;
  item?: string;
  product?: string;
  pieces?: number;
  weight?: number;
  description?: string;
}

interface LoadStop {
  stopType: 'PICKUP' | 'DELIVERY';
  sequence: number;
  company?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  earliestArrival?: string;
  latestArrival?: string;
  contactName?: string;
  contactPhone?: string;
  items?: StopItem[];
  totalPieces?: number;
  totalWeight?: number;
  notes?: string;
  specialInstructions?: string;
}

interface EditableLoadStopsProps {
  stops: LoadStop[];
  onChange: (stops: LoadStop[]) => void;
  compact?: boolean; // If true, show compact table view
}

export default function EditableLoadStops({ stops, onChange, compact = false }: EditableLoadStopsProps) {
  const [editingStop, setEditingStop] = useState<number | null>(null);
  const [expandedStops, setExpandedStops] = useState<Set<number>>(new Set());
  
  const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);

  const updateStop = (stopSequence: number, updates: Partial<LoadStop>) => {
    const newStops = stops.map(stop => {
      if (stop.sequence === stopSequence) {
        return { ...stop, ...updates };
      }
      return stop;
    });
    // Re-sort by sequence
    newStops.sort((a, b) => a.sequence - b.sequence);
    onChange(newStops);
  };

  const deleteStop = (stopSequence: number) => {
    const newStops = stops.filter(s => s.sequence !== stopSequence);
    // Renumber sequences
    newStops.forEach((stop, i) => {
      stop.sequence = i + 1;
    });
    onChange(newStops);
  };

  const toggleExpand = (sequence: number) => {
    const newExpanded = new Set(expandedStops);
    if (newExpanded.has(sequence)) {
      newExpanded.delete(sequence);
    } else {
      newExpanded.add(sequence);
    }
    setExpandedStops(newExpanded);
  };

  // Compact table view for many stops
  if (compact && stops.length > 3) {
    const pickups = sortedStops.filter(s => s.stopType === 'PICKUP');
    const deliveries = sortedStops.filter(s => s.stopType === 'DELIVERY');

    return (
      <div className="space-y-4">
        {pickups.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pickup Stops ({pickups.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {pickups.map((stop, idx) => {
                  const isExpanded = expandedStops.has(stop.sequence);
                  const isEditing = editingStop === stop.sequence;
                  
                  return (
                    <Collapsible key={`pickup-${idx}-${stop.sequence}`} open={isExpanded} onOpenChange={() => toggleExpand(stop.sequence)}>
                      <div className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Stop {stop.sequence}</Badge>
                              <span className="font-medium text-sm truncate">{stop.company || stop.address}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {stop.city}, {stop.state} {stop.zip}
                            </div>
                            {stop.earliestArrival && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(stop.earliestArrival)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingStop(isEditing ? null : stop.sequence)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => deleteStop(stop.sequence)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Company</Label>
                                <Input
                                  value={stop.company || ''}
                                  onChange={(e) => updateStop(stop.sequence, { company: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Sequence</Label>
                                <Input
                                  type="number"
                                  value={stop.sequence}
                                  onChange={(e) => updateStop(stop.sequence, { sequence: parseInt(e.target.value) || 1 })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Address</Label>
                              <Input
                                value={stop.address}
                                onChange={(e) => updateStop(stop.sequence, { address: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">City</Label>
                                <Input
                                  value={stop.city}
                                  onChange={(e) => updateStop(stop.sequence, { city: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">State</Label>
                                <Input
                                  value={stop.state}
                                  onChange={(e) => updateStop(stop.sequence, { state: e.target.value.toUpperCase().slice(0, 2) })}
                                  maxLength={2}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">ZIP</Label>
                                <Input
                                  value={stop.zip}
                                  onChange={(e) => updateStop(stop.sequence, { zip: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Earliest Arrival</Label>
                                <Input
                                  type="datetime-local"
                                  value={stop.earliestArrival ? new Date(stop.earliestArrival).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => updateStop(stop.sequence, { earliestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Latest Arrival</Label>
                                <Input
                                  type="datetime-local"
                                  value={stop.latestArrival ? new Date(stop.latestArrival).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => updateStop(stop.sequence, { latestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
                              onClick={() => setEditingStop(null)}
                            >
                              Done
                            </Button>
                          </div>
                        )}

                        <CollapsibleContent className="mt-2 pt-2 border-t">
                          <div className="space-y-2 text-xs">
                            {stop.phone && <div>Phone: {stop.phone}</div>}
                            {(stop.totalPieces || stop.totalWeight) && (
                              <div>
                                {stop.totalPieces && `${stop.totalPieces} pieces`}
                                {stop.totalPieces && stop.totalWeight && ' • '}
                                {stop.totalWeight && `${stop.totalWeight} lbs`}
                              </div>
                            )}
                            {stop.notes && <div className="text-muted-foreground">{stop.notes}</div>}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {deliveries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Stops ({deliveries.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {deliveries.map((stop, idx) => {
                  const isExpanded = expandedStops.has(stop.sequence);
                  const isEditing = editingStop === stop.sequence;
                  
                  return (
                    <Collapsible key={`delivery-${idx}-${stop.sequence}`} open={isExpanded} onOpenChange={() => toggleExpand(stop.sequence)}>
                      <div className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Stop {stop.sequence}</Badge>
                              <span className="font-medium text-sm truncate">{stop.company || stop.address}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {stop.city}, {stop.state} {stop.zip}
                            </div>
                            {stop.latestArrival && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(stop.latestArrival)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingStop(isEditing ? null : stop.sequence)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => deleteStop(stop.sequence)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Company</Label>
                                <Input
                                  value={stop.company || ''}
                                  onChange={(e) => updateStop(stop.sequence, { company: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Sequence</Label>
                                <Input
                                  type="number"
                                  value={stop.sequence}
                                  onChange={(e) => updateStop(stop.sequence, { sequence: parseInt(e.target.value) || 1 })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Address</Label>
                              <Input
                                value={stop.address}
                                onChange={(e) => updateStop(stop.sequence, { address: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">City</Label>
                                <Input
                                  value={stop.city}
                                  onChange={(e) => updateStop(stop.sequence, { city: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">State</Label>
                                <Input
                                  value={stop.state}
                                  onChange={(e) => updateStop(stop.sequence, { state: e.target.value.toUpperCase().slice(0, 2) })}
                                  maxLength={2}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">ZIP</Label>
                                <Input
                                  value={stop.zip}
                                  onChange={(e) => updateStop(stop.sequence, { zip: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Earliest Arrival</Label>
                                <Input
                                  type="datetime-local"
                                  value={stop.earliestArrival ? new Date(stop.earliestArrival).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => updateStop(stop.sequence, { earliestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Latest Arrival</Label>
                                <Input
                                  type="datetime-local"
                                  value={stop.latestArrival ? new Date(stop.latestArrival).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => updateStop(stop.sequence, { latestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
                              onClick={() => setEditingStop(null)}
                            >
                              Done
                            </Button>
                          </div>
                        )}

                        <CollapsibleContent className="mt-2 pt-2 border-t">
                          <div className="space-y-2 text-xs">
                            {stop.phone && <div>Phone: {stop.phone}</div>}
                            {(stop.totalPieces || stop.totalWeight) && (
                              <div>
                                {stop.totalPieces && `${stop.totalPieces} pieces`}
                                {stop.totalPieces && stop.totalWeight && ' • '}
                                {stop.totalWeight && `${stop.totalWeight} lbs`}
                              </div>
                            )}
                            {stop.notes && <div className="text-muted-foreground">{stop.notes}</div>}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full detailed view for fewer stops (existing LoadStopsDisplay behavior)
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Click Edit on any stop to modify details
      </div>
      {sortedStops.map((stop, idx) => {
        const isEditing = editingStop === stop.sequence;
        
        return (
          <Card key={`stop-${idx}-${stop.sequence}-${stop.stopType}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Stop {stop.sequence}: {stop.stopType}</Badge>
                  <span className="font-medium">{stop.company || stop.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingStop(isEditing ? null : stop.sequence)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteStop(stop.sequence)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={stop.company || ''}
                        onChange={(e) => updateStop(stop.sequence, { company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sequence</Label>
                      <Input
                        type="number"
                        value={stop.sequence}
                        onChange={(e) => updateStop(stop.sequence, { sequence: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={stop.address}
                      onChange={(e) => updateStop(stop.sequence, { address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={stop.city}
                        onChange={(e) => updateStop(stop.sequence, { city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={stop.state}
                        onChange={(e) => updateStop(stop.sequence, { state: e.target.value.toUpperCase().slice(0, 2) })}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP</Label>
                      <Input
                        value={stop.zip}
                        onChange={(e) => updateStop(stop.sequence, { zip: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Earliest Arrival</Label>
                      <Input
                        type="datetime-local"
                        value={stop.earliestArrival ? new Date(stop.earliestArrival).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateStop(stop.sequence, { earliestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Latest Arrival</Label>
                      <Input
                        type="datetime-local"
                        value={stop.latestArrival ? new Date(stop.latestArrival).toISOString().slice(0, 16) : ''}
                        onChange={(e) => updateStop(stop.sequence, { latestArrival: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEditingStop(null)}
                  >
                    Done Editing
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{stop.address}, {stop.city}, {stop.state} {stop.zip}</span>
                  </div>
                  {stop.earliestArrival && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(stop.earliestArrival)} - {stop.latestArrival && formatDateTime(stop.latestArrival)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

