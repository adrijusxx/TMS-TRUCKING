'use client';

/**
 * Example component showing how to use McSelectCombobox
 * and integrate MC selection with React Query
 */

import { useQuery } from '@tanstack/react-query';
import { useMcQueryKey } from '@/hooks/useMcQueryKey';
import { useMcSelection } from '@/lib/contexts/McSelectionContext';
import { McSelectCombobox } from './McSelectCombobox';
import { apiUrl } from '@/lib/utils';

export function McSelectExample() {
  const mcKey = useMcQueryKey();
  const { selectedMc, isLoading: mcLoading } = useMcSelection();
  
  // Example: Fetch loads with MC filter
  // The query key includes mcKey, so it refetches when MC changes
  const { data, isLoading } = useQuery({
    queryKey: ['loads', mcKey],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/loads?limit=10'));
      if (!response.ok) throw new Error('Failed to fetch loads');
      return response.json();
    },
    enabled: !mcLoading, // Wait for MC selection to load
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">MC Selection Example</h2>
        <McSelectCombobox />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Selected MC: {selectedMc?.name || 'All Companies'}</p>
        <p>MC ID: {selectedMc?.mcNumberId || 'null'}</p>
      </div>
      
      {isLoading ? (
        <div>Loading loads...</div>
      ) : (
        <div>
          <p>Loads count: {data?.data?.length || 0}</p>
          {/* Your loads list here */}
        </div>
      )}
    </div>
  );
}

