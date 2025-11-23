'use client';

/**
 * Example showing INSTANT client-side MC filtering
 * No refetching, no loading states, completely smooth
 */

import { useClientSideMcFilter } from '@/hooks/useClientSideMcFilter';
import { useMcFilter } from '@/lib/contexts/McFilterContext';
import { McSelectCombobox } from './McSelectCombobox';
import { apiUrl } from '@/lib/utils';

export function McFilterExample() {
  const { selectedMc } = useMcFilter();
  
  // Fetch ALL loads once, then filter client-side
  // This is INSTANT - no API calls when MC changes!
  const { filteredData, allData, isLoading } = useClientSideMcFilter({
    queryKey: ['loads'], // No MC in key - fetches all data once
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/loads?limit=1000'));
      if (!response.ok) throw new Error('Failed to fetch loads');
      return response.json();
    },
    // Optional: if your items don't have mcNumber directly
    // getMcNumber: (load) => load.mcNumber,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">MC Filter Example (Instant)</h2>
        <McSelectCombobox />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Selected MC: {selectedMc?.name || 'All Companies'}</p>
        <p>Total loads: {allData.length}</p>
        <p>Filtered loads: {filteredData.length}</p>
        <p className="text-green-600">✨ Filtering is instant - no API calls!</p>
      </div>
      
      {isLoading ? (
        <div>Loading loads...</div>
      ) : (
        <div>
          <p>Showing {filteredData.length} load(s)</p>
          {/* Your filtered loads list here */}
        </div>
      )}
    </div>
  );
}

