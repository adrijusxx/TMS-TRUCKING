'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils';

interface McOption {
  id: string;
  mcNumberId: string;
  name: string;
  mcNumber: string;
  isMcNumber: boolean;
}

interface McFilterContextType {
  selectedMcId: string | null; // null = "All Companies"
  selectedMc: McOption | null;
  mcOptions: McOption[];
  isLoading: boolean;
  setSelectedMc: (mcId: string | null) => void;
  // Client-side filter function
  filterByMc: <T extends { mcNumber?: string | null }>(items: T[]) => T[];
}

const McFilterContext = createContext<McFilterContextType | undefined>(undefined);

interface McFilterProviderProps {
  children: ReactNode;
}

async function fetchMcOptions() {
  try {
    const response = await fetch(apiUrl('/api/companies'));
    if (!response.ok) {
      console.warn('[McFilterContext] Failed to fetch MC options:', response.status, response.statusText);
      return []; // Return empty array instead of throwing
    }
    const data = await response.json();
    const companies = data?.data?.companies || [];
    
    return companies
      .filter((c: any) => c.isMcNumber)
      .map((c: any) => ({
        id: c.id,
        mcNumberId: c.mcNumberId || c.id.replace('mc:', ''),
        name: c.name,
        mcNumber: c.mcNumber || '',
        isMcNumber: true,
      }));
  } catch (error) {
    console.error('[McFilterContext] Error fetching MC options:', error);
    return []; // Return empty array on error instead of throwing
  }
}

export function McFilterProvider({ children }: McFilterProviderProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMcId, setSelectedMcId] = useState<string | null>(null);
  const [mcOptions, setMcOptions] = useState<McOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch MC options
  useEffect(() => {
    let mounted = true;
    
    async function loadMcOptions() {
      try {
        setIsLoading(true);
        const options = await fetchMcOptions();
        if (mounted) {
          setMcOptions(options);
          
          if (options.length > 0) {
            const currentMcId = (session?.user as any)?.mcNumberId;
            if (currentMcId) {
              const found = options.find(
                (opt: any) => opt.mcNumberId === currentMcId || opt.id === `mc:${currentMcId}`
              );
              if (found) {
                setSelectedMcId(found.id);
                return;
              }
            }
            
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
                  return;
                }
              }
            }
            
            setSelectedMcId(null);
          } else {
            setSelectedMcId(null);
          }
        }
      } catch (error) {
        console.error('[McFilterContext] Failed to load MC options:', error);
        // Silently handle error - don't break the app
        if (mounted) {
          setMcOptions([]);
          setSelectedMcId(null);
          setIsLoading(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (session !== undefined || typeof window !== 'undefined') {
      loadMcOptions();
    }
    
    return () => {
      mounted = false;
    };
  }, [session]);

  // Get selected MC details
  const selectedMc = useMemo(() => {
    return selectedMcId 
      ? mcOptions.find((opt) => opt.id === selectedMcId) || null
      : null;
  }, [selectedMcId, mcOptions]);

  // Client-side filter function - filters data instantly without refetching
  const filterByMc = useCallback(<T extends { mcNumber?: string | null }>(items: T[]): T[] => {
    if (!selectedMc || !selectedMc.mcNumber) {
      // "All Companies" - return all items
      return items;
    }
    
    // Filter by MC number - instant, no API call
    return items.filter((item) => {
      const itemMcNumber = item.mcNumber?.trim();
      const selectedMcNumber = selectedMc.mcNumber.trim();
      return itemMcNumber === selectedMcNumber;
    });
  }, [selectedMc]);

  // Set cookie for API routes (for future requests)
  const setMcCookie = useCallback((mcId: string | null) => {
    if (mcId) {
      const mcOption = mcOptions.find((opt) => opt.id === mcId);
      if (mcOption) {
        document.cookie = `currentMcNumberId=${mcOption.mcNumberId}; path=/; max-age=${60 * 60 * 24 * 30}`;
        if (mcOption.mcNumber) {
          document.cookie = `currentMcNumber=${encodeURIComponent(mcOption.mcNumber)}; path=/; max-age=${60 * 60 * 24 * 30}`;
        }
        document.cookie = `mcViewMode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    } else {
      document.cookie = `mcViewMode=all; path=/; max-age=${60 * 60 * 24 * 30}`;
      document.cookie = `currentMcNumberId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `currentMcNumber=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }, [mcOptions]);

  // Handle MC selection change - INSTANT, no refetch
  const setSelectedMc = useCallback((mcId: string | null) => {
    // Update state immediately - instant UI feedback
    setSelectedMcId(mcId);
    
    // Set cookie for future API requests
    setMcCookie(mcId);
    
    // Silently refetch in background without showing loading states
    // This happens in the background and doesn't affect the UI
    setTimeout(() => {
      queryClient.refetchQueries({
        type: 'active',
      });
    }, 1000); // Delay to let user see instant filter first
  }, [setMcCookie, queryClient]);

  return (
    <McFilterContext.Provider
      value={{
        selectedMcId,
        selectedMc,
        mcOptions,
        isLoading,
        setSelectedMc,
        filterByMc,
      }}
    >
      {children}
    </McFilterContext.Provider>
  );
}


