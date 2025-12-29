'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import LoadDetail from './LoadDetail';

interface LoadDetailDialogProps {
  loadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function fetchLoadWithDetails(id: string) {
  const response = await fetch(apiUrl(`/api/loads/${id}`));
  if (!response.ok) throw new Error('Failed to fetch load');
  return response.json();
}

async function fetchAvailableDrivers() {
  const response = await fetch(apiUrl('/api/drivers?status=AVAILABLE&limit=100'));
  if (!response.ok) throw new Error('Failed to fetch drivers');
  return response.json();
}

async function fetchAvailableTrucks() {
  const response = await fetch(apiUrl('/api/trucks?status=AVAILABLE&limit=100'));
  if (!response.ok) throw new Error('Failed to fetch trucks');
  return response.json();
}

export default function LoadDetailDialog({ loadId, open, onOpenChange }: LoadDetailDialogProps) {
  const { data: loadData, isLoading: isLoadingLoad, error: loadError } = useQuery({
    queryKey: ['load', loadId],
    queryFn: () => fetchLoadWithDetails(loadId!),
    enabled: !!loadId && open,
  });

  const { data: driversData } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: fetchAvailableDrivers,
    enabled: open,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['available-trucks'],
    queryFn: fetchAvailableTrucks,
    enabled: open,
  });

  const load = loadData?.data;
  const availableDrivers = driversData?.data || [];
  const availableTrucks = trucksData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] !w-[98vw] max-h-[95vh] overflow-hidden flex flex-col p-0 sm:!max-w-[98vw]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Load Details</DialogTitle>
          <DialogDescription>View and manage load information</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingLoad ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : loadError ? (
            <div className="text-center py-12 text-destructive">
              Error loading load details
            </div>
          ) : !load ? (
            <div className="text-center py-12 text-muted-foreground">
              Load not found
            </div>
          ) : (
            <LoadDetail 
              load={load} 
              availableDrivers={availableDrivers}
              availableTrucks={availableTrucks}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

