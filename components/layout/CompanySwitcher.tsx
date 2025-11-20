'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, ChevronUp, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface Company {
  id: string;
  name: string;
  isPrimary: boolean;
  role: string;
  isMcNumber?: boolean;
  mcNumberId?: string;
  mcNumber?: string;
  companyId?: string;
}

async function fetchCompanies() {
  const response = await fetch(apiUrl('/api/companies'));
  if (!response.ok) throw new Error('Failed to fetch companies');
  return response.json();
}

async function switchCompany(companyId: string) {
  const response = await fetch(apiUrl('/api/companies/switch'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to switch company');
  }
  return response.json();
}

export default function CompanySwitcher() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [mcViewMode, setMcViewMode] = useState<'current' | 'all' | string>('current');

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  const switchMutation = useMutation({
    mutationFn: switchCompany,
    onSuccess: async (response, companyId) => {
      const { companyId: actualCompanyId, mcNumberId, mcNumber, isMcNumber } = response.data || {};
      
      // Update session with new company and MC number
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          currentCompanyId: actualCompanyId || companyId,
          mcNumberId: mcNumberId || undefined,
          mcNumber: mcNumber || undefined,
        },
      });
      
      // Store MC number ID and value in localStorage for API access
      if (mcNumberId && mcNumber) {
        localStorage.setItem('currentMcNumberId', mcNumberId);
        localStorage.setItem('currentMcNumber', mcNumber);
      } else {
        localStorage.removeItem('currentMcNumberId');
        localStorage.removeItem('currentMcNumber');
      }
      
      // Update URL params - use the MC ID that was switched to
      const params = new URLSearchParams(searchParams.toString());
      
      if (isMcNumber && mcNumberId) {
        // Switching to a specific MC - set the MC ID in URL (remove 'all' if it was set)
        params.set('mc', mcNumberId);
        setMcViewMode(mcNumberId);
      } else {
        // Regular company switch - check if 'all' was selected
        const currentMcParam = searchParams.get('mc');
        if (currentMcParam === 'all' && isAdmin) {
          params.set('mc', 'all');
          setMcViewMode('all');
        } else {
          params.set('mc', 'current');
          setMcViewMode('current');
        }
      }
      
      // Update URL without full page reload
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      
      // Invalidate all queries to refresh data with new MC context (no page reload needed)
      queryClient.invalidateQueries();
      
      toast.success(isMcNumber ? 'MC Number switched successfully' : 'Company switched successfully');
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Handle MC view mode change (admin only - for "All MCs" toggle)
  const handleMcViewModeChange = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (mode === 'current') {
      params.delete('mc');
      setMcViewMode('current');
      // Set cookie to indicate current MC mode (will use session MC)
      document.cookie = `mcViewMode=current; path=/; max-age=31536000`; // 1 year
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Invalidate queries to refresh data with current MC (no page reload)
      queryClient.invalidateQueries();
    } else if (mode === 'all') {
      params.set('mc', 'all');
      setMcViewMode('all');
      // Set cookie to indicate "all MCs" mode
      document.cookie = `mcViewMode=all; path=/; max-age=31536000`; // 1 year
      // Clear MC number cookies so API knows to show all
      localStorage.removeItem('currentMcNumberId');
      localStorage.removeItem('currentMcNumber');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Invalidate queries to refresh data showing all MCs (no page reload)
      queryClient.invalidateQueries();
    } else {
      // Specific MC selected - switch to that MC and remove 'all' state
      params.set('mc', mode);
      setMcViewMode(mode);
      // Clear "all" mode cookie
      document.cookie = `mcViewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Switch to the MC number (updates session)
      switchMutation.mutate(mode);
      return;
    }
  };

  const companies: Company[] = data?.data?.companies || [];
  // Filter to show only MC numbers
  const mcNumbers = companies.filter((c) => c.isMcNumber);
  const currentMcNumberId = data?.data?.currentMcNumberId || (session?.user as any)?.mcNumberId;
  const currentCompanyId = currentMcNumberId 
    ? `mc:${currentMcNumberId}`
    : null;

  const currentCompany = mcNumbers.find((c) => c.id === currentCompanyId || (currentMcNumberId && c.mcNumberId === currentMcNumberId));

  // Check URL params for MC view mode (admin only)
  useEffect(() => {
    if (isAdmin) {
      const mcParam = searchParams.get('mc');
      if (mcParam === 'all') {
        setMcViewMode('all');
      } else if (mcParam && mcParam !== 'current' && mcParam.startsWith('c')) {
        // It's an MC ID (CUID starts with 'c')
        setMcViewMode(mcParam);
      } else {
        setMcViewMode('current');
      }
    } else {
      // Non-admin users always use current MC
      setMcViewMode('current');
    }
  }, [searchParams, isAdmin]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="p-4 border-t border-slate-800 dark:border-border">
      <div className="mb-2 px-2 text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
        MC Numbers
      </div>
      {mcNumbers.length === 0 ? (
        <Link href="/dashboard/mc-numbers">
          <Button
            variant="outline"
            className="w-full justify-center text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent border-slate-700 dark:border-border"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create MC Number
          </Button>
        </Link>
      ) : (
        <>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-slate-300 dark:text-foreground/70 hover:text-white dark:hover:text-foreground hover:bg-slate-800 dark:hover:bg-accent"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-left">
                    {isAdmin && mcViewMode === 'all' 
                      ? 'All MC Numbers' 
                      : currentCompany?.name || 'Select MC Number'}
                  </span>
                </div>
                <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 bg-slate-900 dark:bg-popover text-slate-100 dark:text-popover-foreground border-slate-800 dark:border-border"
            >
              <DropdownMenuLabel>
                {isAdmin ? 'MC Number View' : 'MC Number'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              
              {/* Admin-only: MC View Mode Toggle */}
              {isAdmin && (
                <>
                  <DropdownMenuRadioGroup 
                    value={mcViewMode} 
                    onValueChange={handleMcViewModeChange}
                  >
                    <DropdownMenuRadioItem 
                      value="current"
                      className="cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Current MC
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem 
                      value="all"
                      className="cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      All MC Numbers
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                  <DropdownMenuLabel>Switch to MC Number</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                </>
              )}
              
              {/* MC Number List */}
              {mcNumbers.map((mc) => {
                // MC is selected if:
                // 1. mcViewMode is set to this MC's ID (explicitly selected)
                // 2. This MC is the current MC and mcViewMode is 'current' (not 'all')
                const isSelected = 
                  mcViewMode === mc.id || 
                  (mc.id === currentCompanyId && mcViewMode === 'current');
                return (
                  <DropdownMenuItem
                    key={mc.id}
                    onClick={() => handleMcViewModeChange(mc.id)}
                    className={cn(
                      'flex items-center justify-between cursor-pointer',
                      isSelected
                        ? 'bg-slate-800 dark:bg-accent text-white dark:text-accent-foreground'
                        : 'text-slate-300 dark:text-popover-foreground/70 hover:bg-slate-800 dark:hover:bg-accent hover:text-white dark:hover:text-popover-foreground'
                    )}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{mc.name}</span>
                    </div>
                    {isSelected ? (
                      <Check className="h-4 w-4 flex-shrink-0 ml-2" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
              
              {/* Create MC Number - Admin only */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                  <Link href="/dashboard/mc-numbers">
                    <DropdownMenuItem className="text-slate-300 dark:text-popover-foreground/70 hover:bg-slate-800 dark:hover:bg-accent hover:text-white dark:hover:text-popover-foreground cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New MC Number
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
