'use client';

import { useQuery } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

async function fetchFMCSAActionItems() {
  const response = await fetch(apiUrl('/api/safety/compliance/fmcsa/action-items'));
  if (!response.ok) {
    throw new Error('Failed to fetch FMCSA action items');
  }
  return response.json();
}

export default function FMCSAPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fmcsa-action-items'],
    queryFn: fetchFMCSAActionItems,
  });

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[
          { label: 'Safety Department', href: '/dashboard/safety' },
          { label: 'Compliance', href: '/dashboard/safety/compliance' },
          { label: 'FMCSA' }
        ]} />
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading FMCSA compliance data...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb items={[
          { label: 'Safety Department', href: '/dashboard/safety' },
          { label: 'Compliance', href: '/dashboard/safety/compliance' },
          { label: 'FMCSA' }
        ]} />
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              Unable to load FMCSA compliance information. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  const actionItems = data?.actionItems || [];

  return (
    <>
      <Breadcrumb items={[
        { label: 'Safety Department', href: '/dashboard/safety' },
        { label: 'Compliance', href: '/dashboard/safety/compliance' },
        { label: 'FMCSA' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            FMCSA Compliance
          </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionItems.filter((item: any) => item.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {actionItems.filter((item: any) => item.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {actionItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">All Clear!</p>
              <p className="text-sm text-muted-foreground">
                No pending FMCSA compliance action items at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>
              FMCSA compliance requirements and corrective actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          item.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : item.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.dueDate && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}

