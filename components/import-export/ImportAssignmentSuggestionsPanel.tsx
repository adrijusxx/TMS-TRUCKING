'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, LinkIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { SuggestionCard, type SuggestionData } from '@/components/drivers/SuggestionCard';

interface ImportAssignmentSuggestionsPanelProps {
  importBatchIds: string[];
}

export function ImportAssignmentSuggestionsPanel({ importBatchIds }: ImportAssignmentSuggestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  const primaryBatchId = importBatchIds[0];

  const { data: suggestions = [], isLoading } = useQuery<SuggestionData[]>({
    queryKey: ['import-suggestions', primaryBatchId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/import/analyze-assignments?importBatchId=${primaryBatchId}`));
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!primaryBatchId,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'accept' | 'dismiss' }) => {
      const res = await fetch(apiUrl(`/api/import/suggestions/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'accept' ? 'Assignment updated' : 'Suggestion dismissed');
      queryClient.invalidateQueries({ queryKey: ['import-suggestions', primaryBatchId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Analyzing equipment assignments...
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted/80 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <LinkIcon className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">Equipment Assignment Suggestions</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {suggestions.length} pending
        </Badge>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Based on imported loads, these driver-equipment pairings were detected. Accept to update driver profiles.
          </p>
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={(id) => actionMutation.mutate({ id, action: 'accept' })}
              onDismiss={(id) => actionMutation.mutate({ id, action: 'dismiss' })}
              isLoading={actionMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
