'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building2,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
} from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Vendor {
  id: string;
  vendorNumber: string;
  name: string;
  type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  rating?: number | null;
  totalOrders: number;
  totalSpent: number;
  contacts: Array<{
    name: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

async function fetchVendors(params: {
  type?: string;
  search?: string;
  state?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.set('type', params.type);
  if (params.search) queryParams.set('search', params.search);
  if (params.state) queryParams.set('state', params.state);

  const response = await fetch(apiUrl(`/api/vendors?${queryParams.toString()}&limit=100`));
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
}

const serviceTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'REPAIR_SHOP', label: 'Repair Shop' },
  { value: 'TIRE_SHOP', label: 'Tire Shop' },
  { value: 'PARTS_VENDOR', label: 'Parts Vendor' },
  { value: 'SUPPLIER', label: 'Supplier' },
];

export default function BreakdownVendorDirectory() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['breakdownVendors', typeFilter, stateFilter, searchQuery],
    queryFn: () =>
      fetchVendors({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
      }),
  });

  const vendors: Vendor[] = data?.data?.vendors || [];

  const handleCallVendor = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleTextVendor = (phone: string) => {
    if (phone) {
      window.location.href = `sms:${phone}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading vendors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading vendors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mt-1">
          Find and contact service vendors for breakdown assistance
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      {vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => {
            const primaryContact = vendor.contacts.find((c) => c.isPrimary) || vendor.contacts[0];
            const phone = vendor.phone || primaryContact?.phone;

            return (
              <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {vendor.vendorNumber}
                      </CardDescription>
                    </div>
                    {vendor.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline">{vendor.type.replace(/_/g, ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Location */}
                  {(vendor.city || vendor.state) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        {vendor.address && <div>{vendor.address}</div>}
                        <div className="text-muted-foreground">
                          {vendor.city && `${vendor.city}, `}
                          {vendor.state} {vendor.zip}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{phone}</span>
                        <div className="ml-auto flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCallVendor(phone)}
                            title="Call"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTextVendor(phone)}
                            title="Text"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{vendor.totalOrders} orders</span>
                    </div>
                    {vendor.totalSpent > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(vendor.totalSpent)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

