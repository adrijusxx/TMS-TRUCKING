'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, Plug, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/utils';

interface IntegrationStatus {
  provider: string;
  configured: boolean;
  connected?: boolean;
  isActive?: boolean;
  driverCount?: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastError?: string;
  realmId?: string | null;
  authUrl?: string | null;
}

async function fetchIntegrationStatus(): Promise<IntegrationStatus[]> {
  const response = await fetch(apiUrl('/api/integrations/status'));
  if (!response.ok) throw new Error('Failed to fetch integration status');
  const data = await response.json();
  return data.data || [];
}

async function syncSamsara(): Promise<any> {
  const response = await fetch(apiUrl('/api/integrations/samsara/sync'), {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync with Samsara');
  }
  return response.json();
}

async function syncQuickBooksExpenses(startDate?: string, endDate?: string): Promise<any> {
  const response = await fetch(apiUrl('/api/integrations/quickbooks/sync-expenses'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync expenses from QuickBooks');
  }
  return response.json();
}

export default function IntegrationsSettings() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isConnectingQuickBooks, setIsConnectingQuickBooks] = useState(false);
  const [expenseStartDate, setExpenseStartDate] = useState<string>('');
  const [expenseEndDate, setExpenseEndDate] = useState<string>('');

  // Check for QuickBooks connection success/error
  useEffect(() => {
    if (searchParams.get('quickbooks_connected') === 'true') {
      toast.success('QuickBooks connected successfully!');
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      // Clear the param
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (searchParams.get('error')) {
      toast.error(`QuickBooks connection failed: ${searchParams.get('error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, queryClient]);

  // Fetch integration status
  const { data: integrations, isLoading, error } = useQuery<IntegrationStatus[]>({
    queryKey: ['integration-status'],
    queryFn: fetchIntegrationStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const samsaraStatus = integrations?.find((i) => i.provider === 'SAMSARA');
  const quickbooksStatus = integrations?.find((i) => i.provider === 'QUICKBOOKS');
  const googleMapsStatus = integrations?.find((i) => i.provider === 'GOOGLE_MAPS');

  // Samsara sync mutation
  const samsaraSyncMutation = useMutation({
    mutationFn: syncSamsara,
    onSuccess: (data) => {
      toast.success(`Synced ${data.data?.syncedDrivers?.length || 0} driver(s) from Samsara`);
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync with Samsara');
    },
  });

  // QuickBooks expense sync mutation
  const qbExpenseSyncMutation = useMutation({
    mutationFn: ({ startDate, endDate }: { startDate?: string; endDate?: string }) =>
      syncQuickBooksExpenses(startDate, endDate),
    onSuccess: (data) => {
      toast.success(data.message || `Synced ${data.data?.syncedCount || 0} expense(s) from QuickBooks`);
      queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to sync expenses from QuickBooks');
    },
  });

  const handleQuickBooksConnect = () => {
    setIsConnectingQuickBooks(true);
    if (quickbooksStatus?.authUrl) {
      window.location.href = quickbooksStatus.authUrl;
    } else {
      window.location.href = '/api/integrations/quickbooks/authorize';
    }
  };

  const handleSyncExpenses = () => {
    qbExpenseSyncMutation.mutate({
      startDate: expenseStartDate || undefined,
      endDate: expenseEndDate || undefined,
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading integrations...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load integrations: {(error as Error).message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">Connect third-party services to enhance your TMS functionality</p>
      </div>

      {/* Samsara Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Samsara ELD Integration
              </CardTitle>
              <CardDescription>
                Sync driver HOS (Hours of Service) data and vehicle locations from Samsara
              </CardDescription>
            </div>
            {samsaraStatus?.connected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : samsaraStatus?.configured ? (
              <Badge variant="secondary">Configured</Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!samsaraStatus?.configured && (
            <Alert>
              <AlertDescription>
                Samsara API key not configured. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">SAMSARA_API_KEY</code> to your
                environment variables.
              </AlertDescription>
            </Alert>
          )}

          {samsaraStatus?.configured && !samsaraStatus?.connected && (
            <Alert variant="destructive">
              <AlertDescription>
                Unable to connect to Samsara API. Please verify your API key is correct.
              </AlertDescription>
            </Alert>
          )}

          {samsaraStatus?.connected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {samsaraStatus.driverCount || 0} driver(s) found in Samsara
                  </p>
                  {samsaraStatus.lastSyncAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sync: {new Date(samsaraStatus.lastSyncAt).toLocaleString()}
                      {samsaraStatus.lastSyncStatus && (
                        <span className={`ml-2 ${samsaraStatus.lastSyncStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          ({samsaraStatus.lastSyncStatus})
                        </span>
                      )}
                    </p>
                  )}
                  {samsaraStatus.lastError && (
                    <p className="text-xs text-red-600 mt-1">Error: {samsaraStatus.lastError}</p>
                  )}
                </div>
                <Button
                  onClick={() => samsaraSyncMutation.mutate()}
                  disabled={samsaraSyncMutation.isPending}
                  variant="outline"
                >
                  {samsaraSyncMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Automatic HOS data sync - Updates driver hours of service automatically</li>
              <li>Driver status updates - Real-time driver status from Samsara ELD</li>
              <li>Vehicle location tracking - Monitor vehicle locations</li>
              <li>Webhook support - Real-time updates via Samsara webhooks</li>
            </ul>
            <p className="mt-3">
              <strong>How to use:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Add your Samsara API key to environment variables</li>
              <li>Click &quot;Sync Now&quot; to manually sync driver data</li>
              <li>Set up webhooks in Samsara dashboard for real-time updates</li>
              <li>Driver HOS data will automatically appear in driver detail pages</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* QuickBooks Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                QuickBooks Integration
              </CardTitle>
              <CardDescription>
                Sync invoices to QuickBooks and import expenses
              </CardDescription>
            </div>
            {quickbooksStatus?.connected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : quickbooksStatus?.configured ? (
              <Badge variant="secondary">Not Connected</Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!quickbooksStatus?.configured && (
            <Alert>
              <AlertDescription>
                QuickBooks API credentials not configured. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">QUICKBOOKS_CLIENT_ID</code> and{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">QUICKBOOKS_CLIENT_SECRET</code> to your environment variables.
              </AlertDescription>
            </Alert>
          )}

          {quickbooksStatus?.configured && !quickbooksStatus?.connected && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Connect your QuickBooks account to start syncing invoices and expenses.
                </AlertDescription>
              </Alert>
              <Button onClick={handleQuickBooksConnect} disabled={isConnectingQuickBooks} variant="default">
                {isConnectingQuickBooks ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4 mr-2" />
                    Connect QuickBooks
                  </>
                )}
              </Button>
            </div>
          )}

          {quickbooksStatus?.connected && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">Connected to QuickBooks</p>
                  {quickbooksStatus.realmId && (
                    <p className="text-xs text-muted-foreground mt-1">Company ID: {quickbooksStatus.realmId}</p>
                  )}
                  {quickbooksStatus.lastSyncAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sync: {new Date(quickbooksStatus.lastSyncAt).toLocaleString()}
                      {quickbooksStatus.lastSyncStatus && (
                        <span className={`ml-2 ${quickbooksStatus.lastSyncStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          ({quickbooksStatus.lastSyncStatus})
                        </span>
                      )}
                    </p>
                  )}
                  {quickbooksStatus.lastError && (
                    <p className="text-xs text-red-600 mt-1">Error: {quickbooksStatus.lastError}</p>
                  )}
                </div>

                {/* Expense Sync */}
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Sync Expenses from QuickBooks</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Import expenses from QuickBooks Purchase transactions and link them to loads
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expense-start-date" className="text-xs">
                        Start Date (optional)
                      </Label>
                      <Input
                        id="expense-start-date"
                        type="date"
                        value={expenseStartDate}
                        onChange={(e) => setExpenseStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-end-date" className="text-xs">
                        End Date (optional)
                      </Label>
                      <Input
                        id="expense-end-date"
                        type="date"
                        value={expenseEndDate}
                        onChange={(e) => setExpenseEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSyncExpenses}
                    disabled={qbExpenseSyncMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    {qbExpenseSyncMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing Expenses...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Expenses (Last 30 Days)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Sync invoices to QuickBooks - Send invoices directly to QuickBooks</li>
              <li>Import expenses - Pull Purchase transactions from QuickBooks</li>
              <li>Two-way sync - Keep financial data in sync</li>
            </ul>
            <p className="mt-3">
              <strong>How to use:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click &quot;Connect QuickBooks&quot; and authorize access</li>
              <li>Go to invoice detail page and click &quot;Sync to QuickBooks&quot; button</li>
              <li>Use &quot;Sync Expenses&quot; to import expenses from QuickBooks</li>
              <li>Expenses will be automatically linked to matching loads</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Google Maps Integration</CardTitle>
              <CardDescription>Distance calculation and route planning</CardDescription>
            </div>
            {googleMapsStatus?.connected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleMapsStatus?.connected && (
            <Alert>
              <AlertDescription>
                Google Maps API key not configured. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">GOOGLE_MAPS_API_KEY</code> and{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Automatic mileage calculation - Uses Google Maps Distance Matrix API</li>
              <li>Multi-stop route planning - Optimizes routes for multiple stops</li>
              <li>Traffic-aware routing - Considers current traffic conditions</li>
              <li>Deadhead distance tracking - Calculates empty miles between stops</li>
            </ul>
            <p className="mt-3">
              <strong>How to use:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Mileage is automatically calculated when creating loads</li>
              <li>Click &quot;Calculate&quot; button in load form to recalculate</li>
              <li>Multi-stop loads automatically calculate loaded vs deadhead miles</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
