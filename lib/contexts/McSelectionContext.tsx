'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils';

export interface McOption {
  id: string;
  mcNumberId: string;
  name: string;
  mcNumber: string;
  isMcNumber: boolean;
}

interface McSelectionContextType {
  selectedMcId: string | null; // null = "All Companies"
  selectedMc: McOption | null;
  mcOptions: McOption[];
  isLoading: boolean;
  isRefreshing: boolean; // True when queries are refetching after MC change
  setSelectedMc: (mcId: string | null) => void;
  refreshData: () => void;
}

const McSelectionContext = createContext<McSelectionContextType | undefined>(undefined);

interface McSelectionProviderProps {
  children: ReactNode;
}

async function fetchMcOptions() {
  const response = await fetch(apiUrl('/api/companies'));
  if (!response.ok) throw new Error('Failed to fetch MC options');
  const data = await response.json();
  const companies = data?.data?.companies || [];
  
  // Filter and format MC numbers
  return companies
    .filter((c: any) => c.isMcNumber)
    .map((c: any) => ({
      id: c.id,
      mcNumberId: c.mcNumberId || c.id.replace('mc:', ''),
      name: c.name,
      mcNumber: c.mcNumber || '',
      isMcNumber: true,
    }));
}

export function McSelectionProvider({ children }: McSelectionProviderProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMcId, setSelectedMcId] = useState<string | null>(null);
  const [mcOptions, setMcOptions] = useState<McOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch MC options
  useEffect(() => {
    let mounted = true;
    
    async function loadMcOptions() {
      try {
        setIsLoading(true);
        const options = await fetchMcOptions();
        if (mounted) {
          setMcOptions(options);
          
          // Initialize selected MC from session/cookie if available
          if (options.length > 0) {
            // Check session first
            const currentMcId = (session?.user as any)?.mcNumberId;
            if (currentMcId) {
              const found = options.find(
                (opt: any) => opt.mcNumberId === currentMcId || opt.id === `mc:${currentMcId}`
              );
              if (found) {
                setSelectedMcId(found.id);
                return; // Found in session, use it
              }
            }
            
            // Fallback: check cookie
            if (typeof window !== 'undefined') {
              const cookieMcId = document.cookie
                .split('; ')
                .find((row) => row.startsWith('currentMcNumberId='))
                ?.split('=')[1];
              
              if (cookieMcId) {
              const found = options.find(
                (opt: any) => opt.mcNumberId === cookieMcId || opt.id === `mc:${cookieMcId}`
              );
                if (found) {
                  setSelectedMcId(found.id);
                  return; // Found in cookie, use it
                }
              }
            }
            
            // Default to "All Companies" (null) if nothing found
            setSelectedMcId(null);
          } else {
            // No MC options available
            setSelectedMcId(null);
          }
        }
      } catch (error) {
        console.error('Failed to load MC options:', error);
        if (mounted) {
          setMcOptions([]);
          setSelectedMcId(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    // Only load if session is available (or if we're on client side)
    if (session !== undefined || typeof window !== 'undefined') {
      loadMcOptions();
    }
    
    return () => {
      mounted = false;
    };
  }, [session]);

  // Set cookie for API routes (without URL changes)
  const setMcCookie = useCallback((mcId: string | null) => {
    if (mcId) {
      const mcOption = mcOptions.find((opt) => opt.id === mcId);
      if (mcOption) {
        document.cookie = `currentMcNumberId=${mcOption.mcNumberId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        if (mcOption.mcNumber) {
          document.cookie = `currentMcNumber=${encodeURIComponent(mcOption.mcNumber)}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
        // Clear "all" mode cookie
        document.cookie = `mcViewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    } else {
      // "All Companies" - set "all" mode
      document.cookie = `mcViewMode=all; path=/; max-age=${60 * 60 * 24 * 30}`;
      document.cookie = `currentMcNumberId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `currentMcNumber=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [mcOptions]);

  // Refresh all data smoothly without UI flashing
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Use refetchQueries with careful options to prevent UI flashing
      // Only refetch active queries (visible on screen) and keep previous data
      await queryClient.refetchQueries({
        type: 'active', // Only active queries
      });
    } finally {
      // Small delay to prevent rapid state changes
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  }, [queryClient]);

  // Handle MC selection change with smooth transition
  const setSelectedMc = useCallback((mcId: string | null) => {
    // Update state immediately for instant UI feedback
    setSelectedMcId(mcId);
    
    // Set cookie synchronously
    setMcCookie(mcId);
    
    // Use requestAnimationFrame + setTimeout for smoother refetch
    // This batches the refetch with the next frame, preventing blocking
    requestAnimationFrame(() => {
      setTimeout(() => {
        refreshData();
      }, 0);
    });
  }, [setMcCookie, refreshData]);

  const selectedMc = selectedMcId 
    ? mcOptions.find((opt) => opt.id === selectedMcId) || null
    : null;

  return (
    <McSelectionContext.Provider
      value={{
        selectedMcId,
        selectedMc,
        mcOptions,
        isLoading,
        isRefreshing,
        setSelectedMc,
        refreshData,
      }}
    >
      {children}
    </McSelectionContext.Provider>
  );
}

export function useMcSelection() {
  const context = useContext(McSelectionContext);
  if (context === undefined) {
    throw new Error('useMcSelection must be used within McSelectionProvider');
  }
  return context;
}

