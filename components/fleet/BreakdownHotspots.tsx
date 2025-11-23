'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
} from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';

interface Hotspot {
  location: string;
  city?: string;
  state?: string;
  count: number;
  breakdowns: Array<{
    id: string;
    breakdownNumber: string;
    reportedAt: string;
    breakdownType: string;
    priority: string;
  }>;
  latitude?: number;
  longitude?: number;
}

interface HotspotStats {
  totalLocations: number;
  topHotspot: Hotspot | null;
  byState: Record<string, number>;
  byCity: Record<string, number>;
  byTimeOfDay: Record<string, number>;
}

async function fetchBreakdownHotspots(params: {
  startDate?: string;
  endDate?: string;
  minCount?: number;
  state?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.minCount) queryParams.set('minCount', params.minCount.toString());
  if (params.state) queryParams.set('state', params.state);

  const response = await fetch(apiUrl(`/api/fleet/breakdowns/hotspots?${queryParams.toString()}`));
  if (!response.ok) throw new Error('Failed to fetch breakdown hotspots');
  return response.json();
}

export default function BreakdownHotspots() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [minCountFilter, setMinCountFilter] = useState<string>('2');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['breakdownHotspots', dateRange, minCountFilter, stateFilter],
    queryFn: () =>
      fetchBreakdownHotspots({
        startDate: dateRange.start,
        endDate: dateRange.end,
        minCount: parseFloat(minCountFilter) > 0 ? parseInt(minCountFilter) : undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
      }),
  });

  const hotspots: Hotspot[] = data?.data?.hotspots || [];
  const stats: HotspotStats = data?.data?.stats || {
    totalLocations: 0,
    topHotspot: null,
    byState: {},
    byCity: {},
    byTimeOfDay: {},
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading breakdown hotspots</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mt-1">
          Geographic analysis of where breakdowns commonly occur
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <div className="text-xs text-muted-foreground mt-1">Unique breakdown locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Top Hotspot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topHotspot ? (
              <>
                <div className="text-lg font-bold">{stats.topHotspot.location}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stats.topHotspot.count} breakdown{stats.topHotspot.count !== 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hotspots Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotspots.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Locations with {minCountFilter}+ breakdowns
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Breakdowns</Label>
              <Input
                type="number"
                placeholder="2"
                value={minCountFilter}
                onChange={(e) => setMinCountFilter(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>State Filter</Label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Object.keys(stats.byState)
                    .sort()
                    .map((state) => (
                      <SelectItem key={state} value={state}>
                        {state} ({stats.byState[state]})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top States */}
      {Object.keys(stats.byState).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdowns by State</CardTitle>
            <CardDescription>Total breakdowns per state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byState)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium">{state}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">{count} breakdowns</div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotspots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Hotspots</CardTitle>
          <CardDescription>
            Locations with multiple breakdowns - sorted by frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading hotspots...</div>
          ) : hotspots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hotspots found</p>
              <p className="text-sm mt-1">Try adjusting your filters or date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>City/State</TableHead>
                    <TableHead>Breakdowns</TableHead>
                    <TableHead>Last Breakdown</TableHead>
                    <TableHead>Types</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotspots.map((hotspot, index) => (
                    <TableRow key={`${hotspot.location}-${hotspot.city}-${hotspot.state}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Badge className="bg-red-500 text-white">
                              #{index + 1} Hotspot
                            </Badge>
                          )}
                          <div>
                            <div className="font-medium">{hotspot.location}</div>
                            {hotspot.latitude && hotspot.longitude && (
                              <div className="text-xs text-muted-foreground">
                                {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(hotspot.city || hotspot.state) && (
                          <div>
                            {hotspot.city && <div>{hotspot.city}</div>}
                            {hotspot.state && (
                              <div className="text-sm text-muted-foreground">{hotspot.state}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-lg">
                            {hotspot.count}
                          </Badge>
                          <span className="text-sm text-muted-foreground">breakdowns</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hotspot.breakdowns.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(hotspot.breakdowns[0].reportedAt)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            new Set(hotspot.breakdowns.map((b) => b.breakdownType))
                          )
                            .slice(0, 3)
                            .map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type.replace(/_/g, ' ').slice(0, 15)}
                              </Badge>
                            ))}
                          {Array.from(new Set(hotspot.breakdowns.map((b) => b.breakdownType)))
                            .length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{Array.from(new Set(hotspot.breakdowns.map((b) => b.breakdownType))).length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/fleet/breakdowns/history?location=${encodeURIComponent(hotspot.location)}`}
                        >
                          <Button variant="ghost" size="sm">
                            View Breakdowns
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Hotspot Map</CardTitle>
          <CardDescription>Geographic visualization of breakdown locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-lg flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">Map visualization coming soon</p>
              <p className="text-sm text-muted-foreground">
                This will show a heat map of breakdown locations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

