'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Check, X, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  isMcNumber?: boolean;
  mcNumberId?: string;
  mcNumber?: string;
}

async function fetchCompanies() {
  const response = await fetch(apiUrl('/api/companies'));
  if (!response.ok) throw new Error('Failed to fetch companies');
  return response.json();
}

async function switchToMultiMc(mcNumberIds: string[]) {
  const response = await fetch(apiUrl('/api/companies/switch-multi'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mcNumberIds }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to switch to multi-MC view');
  }
  return response.json();
}

interface MultiMcSelectorProps {
  trigger?: React.ReactNode;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function MultiMcSelector({ trigger, onSelectionChange }: MultiMcSelectorProps) {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [selectedMcIds, setSelectedMcIds] = useState<string[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const companies: Company[] = useMemo(() => data?.data?.companies || [], [data]);
  const mcNumbers = useMemo(() => companies.filter((c) => c.isMcNumber), [companies]);

  // Get current selected MCs from cookies or session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedIdsCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('selectedMcNumberIds='));
      
      if (selectedIdsCookie) {
        try {
          const ids = JSON.parse(decodeURIComponent(selectedIdsCookie.split('=')[1]));
          if (Array.isArray(ids) && ids.length > 0) {
            setSelectedMcIds(ids);
          }
        } catch {
          // Invalid cookie, ignore
        }
      }
    }
  }, []);

  const switchMutation = useMutation({
    mutationFn: switchToMultiMc,
    onSuccess: async (response) => {
      try {
        const { mcNumberIds } = response.data || {};
        
        // Update session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            mcNumberIds: mcNumberIds || [],
          },
        });

        // Update cookies
        if (mcNumberIds && mcNumberIds.length > 0) {
          document.cookie = `selectedMcNumberIds=${JSON.stringify(mcNumberIds)}; path=/; max-age=${60 * 60 * 24 * 30}`;
          document.cookie = `mcViewMode=multi; path=/; max-age=${60 * 60 * 24 * 30}`;
          // Clear single MC cookies
          document.cookie = `currentMcNumberId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `currentMcNumber=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } else {
          document.cookie = `selectedMcNumberIds=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `mcViewMode=current; path=/; max-age=${60 * 60 * 24 * 30}`;
        }

        // Remove MC param from URL if it exists (MC state managed via cookies)
        const params = new URLSearchParams(searchParams.toString());
        if (params.has('mc')) {
          params.delete('mc');
          const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
          router.replace(newUrl, { scroll: false });
        }

        // Invalidate queries
        queryClient.invalidateQueries();

        toast.success(
          mcNumberIds && mcNumberIds.length > 0
            ? `Viewing ${mcNumberIds.length} MC number(s)`
            : 'Switched to single MC view'
        );
        
        setOpen(false);
        onSelectionChange?.(mcNumberIds || []);
      } catch (error) {
        console.error('Error updating session:', error);
        toast.error('Failed to update session. Please refresh the page.');
      } finally {
        setIsSwitching(false);
      }
    },
    onError: (err: Error) => {
      console.error('Multi-MC switch error:', err);
      toast.error(err.message || 'Failed to switch to multi-MC view');
      setIsSwitching(false);
    },
    onMutate: () => {
      setIsSwitching(true);
    },
  });

  const handleToggleMc = useCallback((mcId: string) => {
    setSelectedMcIds((prev) => {
      if (prev.includes(mcId)) {
        return prev.filter((id) => id !== mcId);
      } else {
        return [...prev, mcId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMcIds.length === mcNumbers.length) {
      setSelectedMcIds([]);
    } else {
      setSelectedMcIds(mcNumbers.map((mc) => mc.mcNumberId || mc.id).filter(Boolean) as string[]);
    }
  }, [selectedMcIds.length, mcNumbers]);

  const handleApply = useCallback(() => {
    if (selectedMcIds.length === 0) {
      toast.error('Please select at least one MC number');
      return;
    }
    switchMutation.mutate(selectedMcIds);
  }, [selectedMcIds, switchMutation]);

  const handleClear = useCallback(() => {
    setSelectedMcIds([]);
    switchMutation.mutate([]);
  }, [switchMutation]);

  if (!isAdmin) {
    return null; // Only admins can use multi-select
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Building2 className="h-4 w-4 mr-2" />
      Select Multiple MCs
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Multiple MC Numbers</DialogTitle>
          <DialogDescription>
            Choose multiple MC numbers to view their combined data
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {selectedMcIds.length} of {mcNumbers.length} selected
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 text-xs"
              >
                {selectedMcIds.length === mcNumbers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {mcNumbers.map((mc) => {
                  const mcId = mc.mcNumberId || mc.id;
                  const isSelected = selectedMcIds.includes(mcId);
                  
                  return (
                    <div
                      key={mc.id}
                      className={cn(
                        'flex items-center space-x-3 p-2 rounded-md border cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-accent border-accent-foreground/20'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleToggleMc(mcId)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleMc(mcId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium truncate">{mc.name}</span>
                        </div>
                        {mc.mcNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            MC: {mc.mcNumber}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isSwitching || selectedMcIds.length === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSwitching}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={isSwitching || selectedMcIds.length === 0}
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Apply ({selectedMcIds.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

