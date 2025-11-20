'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubscriptionBilling() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription>Your current subscription and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Professional Plan</h3>
              <p className="text-sm text-muted-foreground">
                Active • Renews on January 1, 2025
              </p>
            </div>
            <Badge variant="default" className="text-sm">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium">Monthly Price</p>
              <p className="text-2xl font-bold">$99.00</p>
            </div>
            <div>
              <p className="text-sm font-medium">Next Billing Date</p>
              <p className="text-2xl font-bold">Jan 1, 2025</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline">
              View Invoice History
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Badge variant="outline">Default</Badge>
          </div>
          <div className="mt-4">
            <Button variant="outline">Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Invoice #INV-001</p>
                <p className="text-sm text-muted-foreground">December 1, 2024</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">$99.00</p>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Invoice #INV-002</p>
                <p className="text-sm text-muted-foreground">November 1, 2024</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">$99.00</p>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
