'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, CheckCircle2, Check } from 'lucide-react';
import { apiUrl, cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface McNumber {
  id: string;
  number: string;
  companyName: string;
  isDefault: boolean;
}

interface McViewSelectorProps {
  className?: string;
}

async function fetchMcNumbers() {
  const response = await fetch(apiUrl('/api/mc-numbers?limit=1000'));
  if (!response.ok) throw new Error('Failed to fetch MC numbers');
  return response.json();
}

async function setMcView(mcNumberId: string | null, mcNumberIds: string[] = []) {
  const response = await fetch(apiUrl('/api/mc-numbers/set-view'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mcNumberId, mcNumberIds }),
  });
  if (!response.ok) throw new Error('Failed to set MC view');
  return response.json();
}

export default function McViewSelector({ className }: McViewSelectorProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMcIds, setSelectedMcIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentMcId, setCurrentMcId] = useState<string | null>(null);
  const [currentMcNumber, setCurrentMcNumber] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'filtered' | 'assigned'>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';
  const userMcAccess = (session?.user as any)?.mcAccess || [];
  
  // Read current MC state from cookies on mount and when cookies change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const cookieMcId = getCookie('currentMcNumberId');
    const cookieMcNumber = getCookie('currentMcNumber');
    const cookieViewMode = getCookie('mcViewMode') as 'all' | 'filtered' | 'assigned' | null;
    const cookieSelectedIds = getCookie('selectedMcNumberIds');

    if (cookieMcId) {
      setCurrentMcId(cookieMcId);
      if (cookieMcNumber) {
        setCurrentMcNumber(decodeURIComponent(cookieMcNumber));
      }
    } else {
      // Fallback to session
      setCurrentMcId((session?.user as any)?.mcNumberId || null);
      setCurrentMcNumber((session?.user as any)?.mcNumber || null);
    }

    if (cookieSelectedIds) {
      try {
        const ids = JSON.parse(decodeURIComponent(cookieSelectedIds));
        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedMcIds(ids);
          setViewMode('filtered');
        }
      } catch {
        // Invalid cookie
      }
    }
    
    if (cookieViewMode) {
      setViewMode(cookieViewMode);
    } else if (cookieMcId) {
      setViewMode('filtered');
    } else if (isAdmin) {
      setViewMode('all');
    } else {
      setViewMode('assigned');
    }
  }, [session, isAdmin]);

  const { data, isLoading } = useQuery({
    queryKey: ['mc-numbers'],
    queryFn: fetchMcNumbers,
    enabled: status === 'authenticated',
  });

  const mcNumbers: McNumber[] = data?.data || [];

  // For employees, show their assigned MC(s) as read-only info
  if (!isAdmin) {
    const assignedMcs = mcNumbers.filter(mc => 
      userMcAccess.includes(mc.id) || mc.id === currentMcId
    );

    if (isLoading) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-1">
          {assignedMcs.length > 0 ? (
            assignedMcs.map(mc => (
              <Badge key={mc.id} variant="secondary" className="text-xs">
                MC {mc.number}
              </Badge>
            ))
          ) : currentMcNumber ? (
            <Badge variant="secondary" className="text-xs">
              MC {currentMcNumber}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">No MC assigned</span>
          )}
        </div>
      </div>
    );
  }

  // Handle "All MCs" selection
  const handleViewAllMcs = async () => {
    setIsUpdating(true);
    try {
      await setMcView(null, []);
      setCurrentMcId(null);
      setCurrentMcNumber(null);
      setSelectedMcIds([]);
      setViewMode('all');
      queryClient.invalidateQueries();
      router.refresh();
      setDropdownOpen(false);
      toast.success('Viewing all MCs');
    } catch (error) {
      toast.error('Failed to update MC view');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle single MC selection
  const handleSelectSingleMc = async (mcId: string) => {
    setIsUpdating(true);
    try {
      await setMcView(mcId, []);
      const mc = mcNumbers.find(m => m.id === mcId);
      setCurrentMcId(mcId);
      setCurrentMcNumber(mc?.number || null);
      setSelectedMcIds([]);
      setViewMode('filtered');
      queryClient.invalidateQueries();
      router.refresh();
      setDropdownOpen(false);
      toast.success(`Viewing MC ${mc?.number || mcId}`);
    } catch (error) {
      toast.error('Failed to update MC view');
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle MC selection - handles both single and multi-select
  const toggleMcSelection = async (mcId: string) => {
    const isCurrentlySelected = selectedMcIds.includes(mcId) || currentMcId === mcId;
    
    // If this MC is currently selected and it's the only one, deselect it (go to "All")
    if (isCurrentlySelected && selectedMcIds.length === 0 && currentMcId === mcId) {
      await handleViewAllMcs();
      return;
    }
    
    // If this MC is selected in multi-select, remove it
    if (selectedMcIds.includes(mcId)) {
      const newSelected = selectedMcIds.filter(id => id !== mcId);
      
      if (newSelected.length === 0) {
        // No MCs left, switch to "All MCs"
        await handleViewAllMcs();
        return;
      }
      
      // Update multi-select
      setIsUpdating(true);
      try {
        await setMcView(null, newSelected);
        setSelectedMcIds(newSelected);
        setCurrentMcId(null);
        setCurrentMcNumber(null);
        setViewMode('filtered');
        queryClient.invalidateQueries();
        router.refresh();
        toast.success(`Viewing ${newSelected.length} MC${newSelected.length > 1 ? 's' : ''}`);
      } catch (error) {
        toast.error('Failed to update MC view');
      } finally {
        setIsUpdating(false);
      }
      return;
    }
    
    // If we have a single MC selected, switch to multi-select mode
    if (currentMcId && currentMcId !== mcId && selectedMcIds.length === 0) {
      const newSelected = [currentMcId, mcId];
      setIsUpdating(true);
      try {
        await setMcView(null, newSelected);
        setSelectedMcIds(newSelected);
        setCurrentMcId(null);
        setCurrentMcNumber(null);
        setViewMode('filtered');
        queryClient.invalidateQueries();
        router.refresh();
        toast.success(`Viewing ${newSelected.length} MCs`);
      } catch (error) {
        toast.error('Failed to update MC view');
      } finally {
        setIsUpdating(false);
      }
      return;
    }
    
    // If we're in multi-select mode, add this MC
    if (selectedMcIds.length > 0) {
      const newSelected = [...selectedMcIds, mcId];
      setIsUpdating(true);
      try {
        await setMcView(null, newSelected);
        setSelectedMcIds(newSelected);
        setCurrentMcId(null);
        setCurrentMcNumber(null);
        setViewMode('filtered');
        queryClient.invalidateQueries();
        router.refresh();
        toast.success(`Viewing ${newSelected.length} MCs`);
      } catch (error) {
        toast.error('Failed to update MC view');
      } finally {
        setIsUpdating(false);
      }
      return;
    }
    
    // Otherwise, select this single MC
    await handleSelectSingleMc(mcId);
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const viewingAll = viewMode === 'all';
  const viewingMultiple = selectedMcIds.length > 0;
  const currentMc = mcNumbers.find(mc => mc.id === currentMcId);

  // Get display text for trigger
  const getDisplayText = () => {
    if (isUpdating) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </span>
      );
    }
    if (viewingAll) {
      return (
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3" />
          All MCs
        </span>
      );
    }
    if (viewingMultiple) {
      return (
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3" />
          {selectedMcIds.length} MC{selectedMcIds.length > 1 ? 's' : ''}
        </span>
      );
    }
    if (currentMc) {
      return <span>MC {currentMc.number}</span>;
    }
    return 'Select MC';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Building2 className="h-4 w-4 text-muted-foreground" />
      
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center justify-between w-[200px] h-9 px-3 py-2 text-sm',
              'bg-background border border-input rounded-md',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
            disabled={isUpdating}
          >
            {getDisplayText()}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[250px]" align="start">
          <DropdownMenuLabel>Select MC Number</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* All MCs option */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleViewAllMcs();
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {viewingAll ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <CheckCircle2 className="h-4 w-4" />
              <span className={viewingAll ? 'font-medium' : ''}>All MCs</span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* MC list with checkboxes */}
          <div className="max-h-[300px] overflow-y-auto">
            {mcNumbers.map((mc) => {
              const isSelected = selectedMcIds.includes(mc.id);
              const isSingleSelected = currentMcId === mc.id && !viewingAll && !viewingMultiple;
              const isChecked = isSelected || isSingleSelected;
              
              return (
                <DropdownMenuItem
                  key={mc.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    // Clicking anywhere on the item toggles it
                    toggleMcSelection(mc.id);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Checkbox
                      checked={isChecked}
                      disabled
                      className="mr-2 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={isChecked ? 'font-medium' : ''}>
                          MC {mc.number}
                        </span>
                        {isChecked && (
                          <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {mc.companyName}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

