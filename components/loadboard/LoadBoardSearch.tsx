'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, DollarSign, Calendar, Truck } from 'lucide-react';
import { formatCurrency, formatDate, apiUrl } from '@/lib/utils';

async function searchLoadBoard(params: any) {
  const response = await fetch(apiUrl('/api/loadboard/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to search load board');
  }
  return response.json();
}

export default function LoadBoardSearch() {
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationState, setDestinationState] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [minRate, setMinRate] = useState('');

  const searchMutation = useMutation({
    mutationFn: searchLoadBoard,
  });

  const handleSearch = () => {
    searchMutation.mutate({
      originCity: originCity || undefined,
      originState: originState || undefined,
      destinationCity: destinationCity || undefined,
      destinationState: destinationState || undefined,
      equipmentType: equipmentType || undefined,
      minRate: minRate ? parseFloat(minRate) : undefined,
      page: 1,
      limit: 20,
    });
  };

  const results = searchMutation.data?.data || [];
  const meta = searchMutation.data?.meta;

  return (
    <div className="space-y-6">
      <div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Loads</CardTitle>
          <CardDescription>
            Find available loads matching your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originCity">Origin City</Label>
              <Input
                id="originCity"
                placeholder="Dallas"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originState">Origin State</Label>
              <Input
                id="originState"
                placeholder="TX"
                maxLength={2}
                value={originState}
                onChange={(e) => setOriginState(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCity">Destination City</Label>
              <Input
                id="destinationCity"
                placeholder="Houston"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationState">Destination State</Label>
              <Input
                id="destinationState"
                placeholder="TX"
                maxLength={2}
                value={destinationState}
                onChange={(e) => setDestinationState(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipmentType">Equipment Type</Label>
              <Select value={equipmentType || 'all'} onValueChange={(value) => setEquipmentType(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="DRY_VAN">Dry Van</SelectItem>
                  <SelectItem value="REEFER">Reefer</SelectItem>
                  <SelectItem value="FLATBED">Flatbed</SelectItem>
                  <SelectItem value="STEP_DECK">Step Deck</SelectItem>
                  <SelectItem value="LOWBOY">Lowboy</SelectItem>
                  <SelectItem value="TANKER">Tanker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minRate">Minimum Rate ($)</Label>
              <Input
                id="minRate"
                type="number"
                placeholder="1000"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="w-full mt-4"
          >
            <Search className="h-4 w-4 mr-2" />
            {searchMutation.isPending ? 'Searching...' : 'Search Load Board'}
          </Button>
        </CardContent>
      </Card>

      {searchMutation.error && (
        <Card>
          <CardContent className="pt-6">
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {searchMutation.error.message}
            </div>
          </CardContent>
        </Card>
      )}

      {meta && (
        <div className="text-sm text-muted-foreground">
          Searching: {meta.sources?.join(', ')} (Placeholder - API integration required)
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {results.length} load(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load #</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((load: any) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">
                        {load.loadNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {load.origin.city}, {load.origin.state} →{' '}
                            {load.destination.city}, {load.destination.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {load.equipmentType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{(load.route?.totalDistance || load.totalMiles || 0)} mi</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(load.rate)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {load.broker.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {load.broker.mcNumber}
                          </div>
                          {load.broker.rating && (
                            <div className="text-xs">
                              ⭐ {load.broker.rating}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(load.pickupDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{load.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Book Load
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {searchMutation.isSuccess && results.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No loads found matching your criteria
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

