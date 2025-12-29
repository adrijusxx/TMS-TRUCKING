'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Package, Search } from 'lucide-react';

export default function TrackingPage() {
  const router = useRouter();
  const [loadNumber, setLoadNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadNumber.trim()) {
      setError('Please enter a load number');
      return;
    }
    setError(null);
    router.push(`/tracking/${loadNumber.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Track Your Shipment
          </CardTitle>
          <CardDescription>
            Enter your load number to track your shipment in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="loadNumber">Load Number</Label>
              <Input
                id="loadNumber"
                placeholder="Enter load number (e.g., LOAD-001)"
                value={loadNumber}
                onChange={(e) => {
                  setLoadNumber(e.target.value);
                  setError(null);
                }}
                className="text-lg"
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Search className="h-4 w-4 mr-2" />
              Track Shipment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

