import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Download, CheckCircle2, Star } from 'lucide-react';

export default function MarketplacePage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Apps & Marketplace', href: '/dashboard/apps/marketplace' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Apps & Marketplace</h1>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QuickBooks Integration</CardTitle>
              <Badge variant="default">Popular</Badge>
            </div>
            <CardDescription>
              Sync invoices and payments with QuickBooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 mb-4">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.8</span>
              <span className="text-sm text-muted-foreground">(234)</span>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Samsara ELD</CardTitle>
              <Badge variant="outline">Free</Badge>
            </div>
            <CardDescription>
              Electronic Logging Device integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 mb-4">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.6</span>
              <span className="text-sm text-muted-foreground">(189)</span>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Google Maps Routing</CardTitle>
              <Badge variant="outline">Free</Badge>
            </div>
            <CardDescription>
              Enhanced routing and navigation features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 mb-4">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.7</span>
              <span className="text-sm text-muted-foreground">(156)</span>
            </div>
            <Button className="w-full" variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Installed
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
