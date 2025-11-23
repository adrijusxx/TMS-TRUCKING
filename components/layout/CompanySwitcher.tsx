'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Building2, Check, ChevronUp, Plus, Loader2 } from 'lucide-react';
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

export default function CompanySwitcher() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin } = usePermissions();
  const [open, setOpen] = useState(false);
  const [mcViewMode, setMcViewMode] = useState<'current' | 'all' | 'multi' | string>('current');
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedMcIds, setSelectedMcIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Debounced query invalidation to prevent excessive re-renders
  const debouncedInvalidate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          queryClient.invalidateQueries();
        }, 300); // 300ms debounce
      };
    })(),
    [queryClient]
  );

  const switchMutation = useMutation({
    mutationFn: switchCompany,
    onSuccess: async (response, companyId) => {
      try {
        console.log('[CompanySwitcher] switchMutation onSuccess:', { response, companyId });
        const { companyId: actualCompanyId, mcNumberId, mcNumber, isMcNumber } = response.data || {};
        console.log('[CompanySwitcher] Extracted from response:', { actualCompanyId, mcNumberId, mcNumber, isMcNumber });
        
        // Update session with new company and MC number (single source of truth)
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            currentCompanyId: actualCompanyId || companyId,
            mcNumberId: mcNumberId || undefined,
            mcNumber: mcNumber || undefined,
          },
        });
        
        // Update URL params - use the MC ID that was switched to
        const params = new URLSearchParams(searchParams.toString());
        
        if (isMcNumber && mcNumberId) {
          // Switching to a specific MC - set the MC ID in URL (remove 'all' if it was set)
          const mcParam = `mc:${mcNumberId}`;
          params.set('mc', mcParam);
          console.log('[CompanySwitcher] Setting mcViewMode to:', mcParam);
          setMcViewMode(mcParam);
          setIsInitialized(true); // Mark as initialized so selection persists
          // Set cookie for API routes
          document.cookie = `currentMcNumberId=${mcNumberId}; path=/; max-age=${60 * 60 * 24 * 30}`;
          if (mcNumber) {
            document.cookie = `currentMcNumber=${encodeURIComponent(mcNumber)}; path=/; max-age=${60 * 60 * 24 * 30}`;
          }
        } else {
          // Regular company switch - check if 'all' was selected
          const currentMcParam = searchParams.get('mc');
          if (currentMcParam === 'all' && isAdmin) {
            params.set('mc', 'all');
            console.log('[CompanySwitcher] Setting mcViewMode to: all');
            setMcViewMode('all');
            document.cookie = `mcViewMode=all; path=/; max-age=${60 * 60 * 24 * 30}`;
            document.cookie = `currentMcNumberId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `currentMcNumber=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          } else {
            params.set('mc', 'all');
            console.log('[CompanySwitcher] Setting mcViewMode to: all (fallback)');
            setMcViewMode('all');
          }
        }
        
        // Update URL without full page reload
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        
        // Debounced query invalidation to prevent excessive re-renders
        debouncedInvalidate();
        
        toast.success(isMcNumber ? `Switched to MC ${mcNumber}` : 'Company switched successfully');
        setOpen(false);
      } catch (error) {
        console.error('[CompanySwitcher] Error updating session:', error);
        toast.error('Failed to update session. Please refresh the page.');
      } finally {
        setIsSwitching(false);
      }
    },
    onError: (err: Error) => {
      console.error('[CompanySwitcher] MC switch error:', err);
      toast.error(err.message || 'Failed to switch MC number');
      setIsSwitching(false);
    },
    onMutate: (companyId) => {
      console.log('[CompanySwitcher] switchMutation onMutate:', { companyId });
      setIsSwitching(true);
    },
  });

  // Handle MC view mode change (admin only - for "All MCs" toggle)
  const handleMcViewModeChange = useCallback((mode: string) => {
    console.log('[CompanySwitcher] handleMcViewModeChange called:', { mode, isSwitching });
    if (isSwitching) return; // Prevent multiple simultaneous switches
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (mode === 'all') {
      console.log('[CompanySwitcher] Switching to "all" mode');
      params.set('mc', 'all');
      setMcViewMode('all');
      setIsInitialized(true); // Mark as initialized
      // Set cookie to indicate "all MCs" mode
      document.cookie = `mcViewMode=all; path=/; max-age=${60 * 60 * 24 * 30}`;
      // Clear MC number cookies so API knows to show all
      document.cookie = `currentMcNumberId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `currentMcNumber=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Debounced query invalidation
      debouncedInvalidate();
    } else {
      // Specific MC selected - switch to that MC and remove 'all' state
      console.log('[CompanySwitcher] Switching to specific MC:', { mode });
      params.set('mc', mode);
      setMcViewMode(mode);
      setIsInitialized(true); // Mark as initialized so we preserve this selection
      console.log('[CompanySwitcher] Set mcViewMode to:', mode);
      // Clear "all" mode cookie
      document.cookie = `mcViewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      // Switch to the MC number (updates session)
      console.log('[CompanySwitcher] Calling switchMutation with:', mode);
      switchMutation.mutate(mode);
      return;
    }
  }, [isSwitching, searchParams, pathname, router, debouncedInvalidate, switchMutation]);

  const companies: Company[] = useMemo(() => data?.data?.companies || [], [data]);
  // Filter to show only MC numbers
  const mcNumbers = useMemo(() => companies.filter((c) => c.isMcNumber), [companies]);
  const currentMcNumberId = useMemo(
    () => data?.data?.currentMcNumberId || (session?.user as any)?.mcNumberId,
    [data, session]
  );
  const currentCompanyId = useMemo(
    () => (currentMcNumberId ? `mc:${currentMcNumberId}` : null),
    [currentMcNumberId]
  );

  // Determine the currently selected/active MC
  const currentCompany = useMemo(() => {
    console.log('[CompanySwitcher] Computing currentCompany:', {
      mcViewMode,
      currentCompanyId,
      currentMcNumberId,
      mcNumbersCount: mcNumbers.length,
      mcNumbers: mcNumbers.map(mc => ({ id: mc.id, mcNumberId: mc.mcNumberId, name: mc.name }))
    });
    
    // If in multi-select mode, don't show a single "current" MC
    if (mcViewMode === 'multi' || mcViewMode === 'all') {
      console.log('[CompanySwitcher] Multi/All mode - returning null');
      return null;
    }
    
    // If a specific MC is selected (mcViewMode is an MC ID)
    if (mcViewMode && mcViewMode !== 'current' && mcViewMode.startsWith('mc:')) {
      const mcId = mcViewMode.replace('mc:', '');
      const found = mcNumbers.find((c) => c.id === mcViewMode || c.mcNumberId === mcId);
      console.log('[CompanySwitcher] Found MC by mcViewMode:', { mcViewMode, mcId, found: found ? found.name : 'NOT FOUND' });
      return found;
    }
    
    // Fall back to session/cookie MC
    const fallback = mcNumbers.find((c) => c.id === currentCompanyId || (currentMcNumberId && c.mcNumberId === currentMcNumberId));
    console.log('[CompanySwitcher] Using fallback (session/cookie):', { currentCompanyId, currentMcNumberId, found: fallback ? fallback.name : 'NOT FOUND' });
    return fallback;
  }, [mcNumbers, currentCompanyId, currentMcNumberId, mcViewMode]);

  // Get display text for button
  const buttonDisplayText = useMemo(() => {
    console.log('[CompanySwitcher] Computing buttonDisplayText:', {
      isSwitching,
      isAdmin,
      mcViewMode,
      selectedMcIdsLength: selectedMcIds.length,
      currentCompany: currentCompany ? currentCompany.name : 'null'
    });
    
    if (isSwitching) return 'Switching...';
    if (isAdmin && mcViewMode === 'all') return 'All MC Numbers';
    if (isAdmin && mcViewMode === 'multi' && selectedMcIds.length > 0) {
      return `${selectedMcIds.length} MC Number(s) Selected`;
    }
    if (currentCompany) {
      // Extract MC number from name for cleaner display
      const mcNumberMatch = currentCompany.name.match(/\(MC\s+([^)]+)\)/);
      if (mcNumberMatch) {
        const companyName = currentCompany.name.replace(/\s*\(MC\s+[^)]+\)\s*$/, '').trim();
        const displayText = `${companyName} (MC ${mcNumberMatch[1]})`;
        console.log('[CompanySwitcher] Button display text:', displayText);
        return displayText;
      }
      console.log('[CompanySwitcher] Button display text (no MC match):', currentCompany.name);
      return currentCompany.name;
    }
    console.log('[CompanySwitcher] Button display text: Select MC Number');
    return 'Select MC Number';
  }, [isSwitching, isAdmin, mcViewMode, selectedMcIds.length, currentCompany]);

  // Get current multi-select state from cookies
  useEffect(() => {
    if (typeof window !== 'undefined' && isAdmin) {
      const selectedIdsCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('selectedMcNumberIds='));
      
      if (selectedIdsCookie) {
        try {
          const ids = JSON.parse(decodeURIComponent(selectedIdsCookie.split('=')[1]));
          if (Array.isArray(ids) && ids.length > 0) {
            setSelectedMcIds(ids);
            setMcViewMode('multi');
          }
        } catch {
          // Invalid cookie, ignore
        }
      }
    }
  }, [isAdmin]);

  // Multi-select mutation
  const multiSelectMutation = useMutation({
    mutationFn: switchToMultiMc,
    onSuccess: async (response) => {
      try {
        const { mcNumberIds } = response.data || {};
        
        // Update URL params
        const params = new URLSearchParams(searchParams.toString());
        if (mcNumberIds && mcNumberIds.length > 0) {
          params.set('mc', 'multi');
          setMcViewMode('multi');
          setSelectedMcIds(mcNumberIds);
        } else {
          params.delete('mc');
          setMcViewMode('current');
          setSelectedMcIds([]);
        }
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        
        // Invalidate queries
        debouncedInvalidate();
        
        toast.success(
          mcNumberIds && mcNumberIds.length > 0
            ? `Viewing ${mcNumberIds.length} MC number(s)`
            : 'Switched to single MC view'
        );
      } catch (error) {
        console.error('Error updating multi-select:', error);
      } finally {
        setIsSwitching(false);
      }
    },
    onError: (err: Error) => {
      console.error('Multi-MC switch error:', err);
      toast.error(err.message || 'Failed to switch to multi-MC view');
      setIsSwitching(false);
    },
    onMutate: (companyId) => {
      console.log('[CompanySwitcher] switchMutation onMutate:', { companyId });
      setIsSwitching(true);
    },
  });

  // Handle checkbox toggle for multi-select
  const handleToggleMc = useCallback((mcId: string) => {
    const newSelected = selectedMcIds.includes(mcId)
      ? selectedMcIds.filter((id) => id !== mcId)
      : [...selectedMcIds, mcId];
    
    setSelectedMcIds(newSelected);
    
    // Apply multi-select immediately
    if (newSelected.length > 0) {
      multiSelectMutation.mutate(newSelected);
    } else {
      // Clear multi-select - switch to all MCs view
      multiSelectMutation.mutate([]);
      handleMcViewModeChange('all');
    }
  }, [selectedMcIds, multiSelectMutation, handleMcViewModeChange]);

  // Handle single MC click (switch to that MC, clear multi-select)
  const handleMcClick = useCallback((mcSwitchId: string) => {
    console.log('[CompanySwitcher] handleMcClick called:', { mcSwitchId });
    // Clear multi-select first
    setSelectedMcIds([]);
    // mcSwitchId should already have 'mc:' prefix from API
    // Switch to single MC
    console.log('[CompanySwitcher] Calling handleMcViewModeChange with:', mcSwitchId);
    handleMcViewModeChange(mcSwitchId);
  }, [handleMcViewModeChange]);

  // Handle select all for multi-select
  const handleSelectAll = useCallback(() => {
    // Use mcNumberId (raw ID) for multi-select API
    const allMcIds = mcNumbers
      .map((mc) => mc.mcNumberId || mc.id.replace('mc:', ''))
      .filter(Boolean) as string[];
    if (selectedMcIds.length === allMcIds.length) {
      // Deselect all - switch to all MCs view
      setSelectedMcIds([]);
      multiSelectMutation.mutate([]);
      handleMcViewModeChange('all');
    } else {
      // Select all
      setSelectedMcIds(allMcIds);
      multiSelectMutation.mutate(allMcIds);
    }
  }, [selectedMcIds.length, mcNumbers, multiSelectMutation, handleMcViewModeChange]);

  // Check URL params for MC view mode - preserve selection across navigation
  useEffect(() => {
    if (isAdmin) {
      const mcParam = searchParams.get('mc');
      console.log('[CompanySwitcher] URL param check (admin):', { mcParam, currentMcViewMode: mcViewMode, isInitialized });
      
      // If URL has mc param, use it
      if (mcParam === 'all') {
        if (mcViewMode !== 'all') {
          console.log('[CompanySwitcher] Setting mcViewMode to: all (from URL)');
          setMcViewMode('all');
          setIsInitialized(true);
        }
      } else if (mcParam === 'multi') {
        if (mcViewMode !== 'multi') {
          console.log('[CompanySwitcher] Setting mcViewMode to: multi (from URL)');
          setMcViewMode('multi');
          setIsInitialized(true);
        }
      } else if (mcParam && mcParam.startsWith('mc:')) {
        // It's an MC ID with prefix
        if (mcViewMode !== mcParam) {
          console.log('[CompanySwitcher] Setting mcViewMode to:', mcParam, '(from URL)');
          setMcViewMode(mcParam);
          setIsInitialized(true);
        }
      } else if (mcParam && mcParam.startsWith('c')) {
        // It's an MC ID (CUID starts with 'c') - add prefix
        const mcParamWithPrefix = `mc:${mcParam}`;
        if (mcViewMode !== mcParamWithPrefix) {
          console.log('[CompanySwitcher] Setting mcViewMode to:', mcParamWithPrefix, '(from URL)');
          setMcViewMode(mcParamWithPrefix);
          setIsInitialized(true);
        }
      } else if (!mcParam && isInitialized && mcViewMode && mcViewMode !== 'all' && mcViewMode !== 'multi' && mcViewMode.startsWith('mc:')) {
        // No URL param but we have a selected MC - preserve it and update URL
        console.log('[CompanySwitcher] No mc param in URL, preserving current mcViewMode and updating URL:', mcViewMode);
        // Update URL to reflect current selection
        const params = new URLSearchParams(searchParams.toString());
        params.set('mc', mcViewMode);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else if (!mcParam && !isInitialized) {
        // First load - check cookies/session for last selected MC
        const cookieMcId = document.cookie
          .split('; ')
          .find((row) => row.startsWith('currentMcNumberId='))
          ?.split('=')[1];
        
        if (cookieMcId) {
          const mcParamFromCookie = `mc:${cookieMcId}`;
          console.log('[CompanySwitcher] First load, using from cookie:', mcParamFromCookie);
          setMcViewMode(mcParamFromCookie);
          setIsInitialized(true);
          // Update URL to reflect cookie value
          const params = new URLSearchParams(searchParams.toString());
          params.set('mc', mcParamFromCookie);
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        } else {
          // Last resort - default to all
          console.log('[CompanySwitcher] First load, no cookie, defaulting to: all');
          setMcViewMode('all');
          setIsInitialized(true);
        }
      }
    } else {
      // Non-admin users use current MC from session
      const mcParam = searchParams.get('mc');
      console.log('[CompanySwitcher] URL param check (non-admin):', { mcParam, currentMcViewMode: mcViewMode });
      if (mcParam && mcParam.startsWith('mc:')) {
        if (mcViewMode !== mcParam) {
          console.log('[CompanySwitcher] Setting mcViewMode to:', mcParam);
          setMcViewMode(mcParam);
        }
      } else if (!mcParam && mcViewMode && mcViewMode.startsWith('mc:')) {
        // Preserve current selection and update URL
        console.log('[CompanySwitcher] No mc param, preserving current mcViewMode and updating URL:', mcViewMode);
        const params = new URLSearchParams(searchParams.toString());
        params.set('mc', mcViewMode);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } else if (!mcParam && (!mcViewMode || mcViewMode === 'current')) {
        console.log('[CompanySwitcher] No mc param, using current from session');
        setMcViewMode('current');
      }
    }
  }, [searchParams, isAdmin, pathname, router]);

  // Debug: Log mcViewMode changes
  useEffect(() => {
    console.log('[CompanySwitcher] mcViewMode changed to:', mcViewMode);
  }, [mcViewMode]);

  return (
    <div className="p-4 border-t border-slate-800 dark:border-border">
      <div className="mb-2 px-2 text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">
        MC Numbers
      </div>
      {isLoading ? (
        <Button
          variant="ghost"
          className="w-full justify-center text-slate-300 dark:text-foreground/70 cursor-wait"
          disabled
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading MC Numbers...
        </Button>
      ) : mcNumbers.length === 0 ? (
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
                disabled={isSwitching}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {isSwitching ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="truncate text-left font-medium">
                    {buttonDisplayText}
                  </span>
                </div>
                <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-72 bg-slate-900 dark:bg-popover text-slate-100 dark:text-popover-foreground border-slate-800 dark:border-border"
            >
              {/* Header */}
              <div className="px-2 py-2">
                <DropdownMenuLabel className="text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider px-0">
                  {isAdmin ? 'MC Number View' : 'MC Number'}
                </DropdownMenuLabel>
                {currentCompany && (
                  <div className="mt-1 px-2 py-1.5 bg-slate-800/50 dark:bg-accent/20 rounded-md">
                    <div className="text-xs text-slate-300 dark:text-muted-foreground">Current:</div>
                    <div className="text-sm font-medium text-white dark:text-foreground mt-0.5">
                      {currentCompany.name}
                    </div>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-800" />
              
              {/* Admin-only: MC View Mode Toggle */}
              {isAdmin && (
                <>
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-slate-400 dark:text-muted-foreground mb-1.5 px-2">
                      View Mode
                    </div>
                    <DropdownMenuRadioGroup 
                      value={mcViewMode === 'current' ? 'all' : mcViewMode} 
                      onValueChange={(value) => {
                        if (value === 'all') {
                          handleMcViewModeChange('all');
                        }
                      }}
                    >
                      <DropdownMenuRadioItem 
                        value="all"
                        className="cursor-pointer px-2"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        <span>All MC Numbers</span>
                        {mcViewMode === 'all' && (
                          <Check className="h-4 w-4 ml-auto" />
                        )}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                  
                  {/* Multi-select controls */}
                  {mcViewMode === 'multi' && selectedMcIds.length > 0 && (
                    <>
                      <div className="px-2 py-2">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs text-slate-400 dark:text-muted-foreground">
                            {selectedMcIds.length} of {mcNumbers.length} selected
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSelectAll}
                            className="h-7 text-xs px-2"
                          >
                            {selectedMcIds.length === mcNumbers.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                    </>
                  )}
                  
                  <div className="px-2 py-1.5">
                    <DropdownMenuLabel className="text-xs font-semibold text-slate-400 dark:text-muted-foreground uppercase tracking-wider px-2">
                      Select MC Number
                    </DropdownMenuLabel>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-800 dark:bg-border" />
                </>
              )}
              
              {/* MC Number List with Checkboxes */}
              <div className="max-h-64 overflow-y-auto">
                {mcNumbers.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-slate-400 dark:text-muted-foreground">
                    No MC numbers available
                  </div>
                ) : (
                  mcNumbers.map((mc) => {
                    // Use mcNumberId for multi-select (raw ID), mc.id for single switch (prefixed)
                    const mcNumberId = mc.mcNumberId || mc.id.replace('mc:', '');
                    const mcSwitchId = mc.id; // Already has 'mc:' prefix from API
                    
                    // MC is selected if:
                    // 1. In multi-select mode and in selectedMcIds array
                    // 2. mcViewMode is set to this MC's ID (single select)
                    const isMultiSelected = mcViewMode === 'multi' && selectedMcIds.includes(mcNumberId);
                    const isSingleSelected = 
                      mcViewMode === mcSwitchId &&
                      mcViewMode !== 'multi' && mcViewMode !== 'all';
                    const isSelected = isMultiSelected || isSingleSelected;
                    
                    // Extract MC number from name (format: "Company Name (MC 123456)")
                    const mcNumberMatch = mc.name.match(/\(MC\s+([^)]+)\)/);
                    const mcNumberDisplay = mcNumberMatch ? mcNumberMatch[1] : '';
                    const companyNameDisplay = mc.name.replace(/\s*\(MC\s+[^)]+\)\s*$/, '').trim();
                    
                    return (
                      <DropdownMenuItem
                        key={mc.id}
                        onSelect={(e) => {
                          e.preventDefault();
                          // Prevent default dropdown close behavior
                        }}
                        className={cn(
                          'flex items-center justify-between cursor-pointer px-2 py-2.5',
                          isSelected
                            ? 'bg-blue-600/20 dark:bg-blue-500/20 border-l-2 border-blue-500'
                            : 'hover:bg-slate-800 dark:hover:bg-accent'
                        )}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {isAdmin && (
                            <Checkbox
                              checked={isMultiSelected}
                              onCheckedChange={() => handleToggleMc(mcNumberId)}
                              onClick={(e) => e.stopPropagation()}
                              className="mr-2"
                            />
                          )}
                          <Building2 className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isSelected ? "text-blue-400" : "text-slate-400"
                          )} />
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              console.log('[CompanySwitcher] MC name/div clicked:', { 
                                mcSwitchId, 
                                mcNumberId, 
                                mcName: mc.name,
                                isAdmin,
                                currentMcViewMode: mcViewMode
                              });
                              if (isAdmin) {
                                handleMcClick(mcSwitchId);
                              } else {
                                handleMcViewModeChange(mcSwitchId);
                              }
                            }}
                          >
                            <div className={cn(
                              "text-sm font-medium truncate",
                              isSelected ? "text-white dark:text-foreground" : "text-slate-200 dark:text-popover-foreground/90"
                            )}>
                              {companyNameDisplay}
                            </div>
                            {mcNumberDisplay && (
                              <div className="text-xs text-slate-400 dark:text-muted-foreground mt-0.5">
                                MC {mcNumberDisplay}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSingleSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 ml-2 text-blue-400" />
                        )}
                        {isMultiSelected && !isSingleSelected && (
                          <div className="h-4 w-4 flex-shrink-0 ml-2 rounded-full bg-blue-500 border-2 border-blue-400" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
              
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
