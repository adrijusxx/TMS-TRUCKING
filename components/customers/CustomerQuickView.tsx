'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { CustomerType } from '@prisma/client';
import { Building2, Phone, Mail, MapPin, DollarSign, Package, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  type: CustomerType;
  city: string;
  state: string;
  phone: string;
  email: string;
  paymentTerms: number;
  totalLoads: number;
  totalRevenue: number;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function fetchCustomer(id: string) {
  const response = await fetch(`/api/customers/${id}`);
  if (!response.ok) throw new Error('Failed to fetch customer');
  return response.json();
}

interface CustomerQuickViewProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerQuickView({ customerId, open, onOpenChange }: CustomerQuickViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => fetchCustomer(customerId!),
    enabled: !!customerId && open,
  });

  const customer: Customer | undefined = data?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Customer Details
          </DialogTitle>
          <DialogDescription>Quick view of customer information</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error loading customer details
          </div>
        ) : !customer ? (
          <div className="text-center py-8 text-muted-foreground">
            Customer not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{customer.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Customer #{customer.customerNumber}
                </p>
              </div>
              <Badge variant="outline">
                {formatCustomerType(customer.type)}
              </Badge>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <p className="font-medium">
                {customer.city}, {customer.state}
              </p>
            </div>

            <Separator />

            {/* Payment Terms */}
            <div className="space-y-2">
              <h4 className="font-semibold">Payment Terms</h4>
              <p className="font-medium">{customer.paymentTerms} days</p>
            </div>

            <Separator />

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Total Loads
                </p>
                <p className="text-2xl font-bold">{customer.totalLoads}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Revenue
                </p>
                <p className="text-2xl font-bold">{formatCurrency(customer.totalRevenue)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {customerId && (
                <Link href={`/dashboard/customers/${customerId}`}>
                  <Button>
                    View Full Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

