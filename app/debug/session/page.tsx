'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, LogOut, Database, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionDebugPage() {
  const { data: session, status } = useSession();
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/force-refresh');
      const data = await response.json();
      setDbData(data);
      
      if (data.success && data.data.mismatch) {
        toast.error('Session mismatch detected! Please log out and log back in.');
      } else if (data.success) {
        toast.success('Session matches database');
      }
    } catch (error) {
      toast.error('Failed to check database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      const response = await fetch('/api/debug/clear-session');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Session cleared. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to clear session');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Session Debug</h1>
        <p className="text-muted-foreground">
          Check your session status and database synchronization
        </p>
      </div>

      <div className="grid gap-6">
        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Session Status
            </CardTitle>
            <CardDescription>Current session information from NextAuth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={status === 'authenticated' ? 'default' : 'secondary'}>
                {status}
              </Badge>
            </div>
            
            {session?.user && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{session.user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="text-sm">{session.user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Role:</span>
                  <Badge variant={session.user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {session.user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">User ID:</span>
                  <span className="text-xs font-mono">{session.user.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Company ID:</span>
                  <span className="text-xs font-mono">{session.user.companyId}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Check
            </CardTitle>
            <CardDescription>Compare session with database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkDatabase} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Check Database
                </>
              )}
            </Button>

            {dbData?.success && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  {dbData.data.mismatch ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium text-yellow-500">Mismatch Detected!</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-500">Session Synced</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Session Data:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Role: <Badge variant="outline">{dbData.data.sessionData.role}</Badge></p>
                      <p>Email: {dbData.data.sessionData.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Database Data:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Role: <Badge variant="outline">{dbData.data.databaseData.role}</Badge></p>
                      <p>Email: {dbData.data.databaseData.email}</p>
                      <p>Active: {dbData.data.databaseData.isActive ? '✓' : '✗'}</p>
                    </div>
                  </div>
                </div>

                {dbData.data.mismatch && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {dbData.data.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Fix session issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out and Log Back In
            </Button>
            <Button onClick={clearSession} variant="destructive" className="w-full">
              <X className="h-4 w-4 mr-2" />
              Clear Session & Force Re-login
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              If you see a mismatch, log out and log back in to refresh your session
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





