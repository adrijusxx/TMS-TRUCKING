'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerType } from '@prisma/client';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Package,
  User,
} from 'lucide-react';

interface CustomerDetailProps {
  customer: any;
}

function formatCustomerType(type: CustomerType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function CustomerDetail({ customer }: CustomerDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              Customer #{customer.customerNumber}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          {formatCustomerType(customer.type)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{customer.address}</p>
                  <p className="text-sm">
                    {customer.city}, {customer.state} {customer.zip}
                  </p>
                </div>
              </div>
            </div>
            {customer.billingAddress && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Billing Address</p>
                <p className="font-medium">{customer.billingAddress}</p>
                <p className="text-sm">
                  {customer.billingCity}, {customer.billingState}{' '}
                  {customer.billingZip}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Payment Terms</p>
              <p className="text-2xl font-bold">{customer.paymentTerms} days</p>
            </div>
            {customer.creditLimit && (
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(customer.creditLimit)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(customer.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Loads</p>
              <p className="text-xl font-semibold">{customer.totalLoads}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        {customer.contacts && customer.contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.contacts.map((contact: any) => (
                  <div key={contact.id} className="pb-3 border-b last:border-0">
                    <p className="font-medium">
                      {contact.name}
                      {contact.isPrimary && (
                        <Badge variant="outline" className="ml-2">
                          Primary
                        </Badge>
                      )}
                    </p>
                    {contact.title && (
                      <p className="text-sm text-muted-foreground">
                        {contact.title}
                      </p>
                    )}
                    <p className="text-sm">{contact.email}</p>
                    <p className="text-sm">{contact.phone}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Loads */}
        {customer.loads && customer.loads.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Loads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.loads.map((load: any) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/dashboard/loads/${load.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {load.loadNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {load.pickupCity}, {load.pickupState} → {load.deliveryCity},{' '}
                        {load.deliveryState}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pickup: {formatDate(load.pickupDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(load.revenue)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {load.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

