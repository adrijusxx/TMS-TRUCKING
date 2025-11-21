'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Upload } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import DQFChecklist from './DQFChecklist';
import DQFDocumentUpload from './DQFDocumentUpload';

interface DQFData {
  id: string;
  status: string;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  documents: Array<{
    id: string;
    documentType: string;
    status: string;
    expirationDate: string | null;
    document: {
      id: string;
      title: string;
      fileName: string;
    };
  }>;
  driver: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

async function fetchDQF(driverId: string) {
  const response = await fetch(apiUrl(`/api/safety/drivers/${driverId}/dqf`));
  if (!response.ok) throw new Error('Failed to fetch DQF');
  return response.json() as Promise<{ dqf: DQFData }>;
}

interface DQFManagerProps {
  driverId: string;
}

export default function DQFManager({ driverId }: DQFManagerProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dqf', driverId],
    queryFn: () => fetchDQF(driverId)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading DQF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading DQF</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dqf', driverId] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const dqf = data?.dqf;

  if (!dqf) {
    return <div>DQF not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'INCOMPLETE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'EXPIRING':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Driver Qualification File</h2>
          <p className="text-muted-foreground">
            {dqf.driver.user.firstName} {dqf.driver.user.lastName}
          </p>
        </div>
        <Badge className={getStatusColor(dqf.status)}>
          {dqf.status}
        </Badge>
      </div>

      {/* Review Dates */}
      {(dqf.lastReviewDate || dqf.nextReviewDate) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dqf.lastReviewDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Review:</span>
                <span className="text-sm font-medium">{formatDate(dqf.lastReviewDate)}</span>
              </div>
            )}
            {dqf.nextReviewDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Review Due:</span>
                <span className="text-sm font-medium">{formatDate(dqf.nextReviewDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <DQFChecklist dqf={dqf} driverId={driverId} />

      {/* Document Upload */}
      <DQFDocumentUpload driverId={driverId} />
    </div>
  );
}

