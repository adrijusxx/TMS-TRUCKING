'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinkIcon, Loader2, Search, Filter, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/utils';
import { SuggestionCard, type SuggestionData } from '@/components/drivers/SuggestionCard';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'TRUCK_CHANGE', label: 'Truck Change' },
  { value: 'TRAILER_CHANGE', label: 'Trailer Change' },
  { value: 'DISPATCHER_LINK', label: 'Dispatcher Link' },
  { value: 'NEW_ASSIGNMENT', label: 'New Assignment' },
];

export function ImportAssignmentSuggestionsManager() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<SuggestionData[]>({
    queryKey: ['import-suggestions-all'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/import/analyze-assignments?status=PENDING'));
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
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
      queryClient.invalidateQueries({ queryKey: ['import-suggestions-all'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkDismissMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map(id =>
          fetch(apiUrl(`/api/import/suggestions/${id}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'dismiss' }),
          })
        )
      );
    },
    onSuccess: () => {
      toast.success('All visible suggestions dismissed');
      queryClient.invalidateQueries({ queryKey: ['import-suggestions-all'] });
    },
    onError: () => toast.error('Some dismissals failed'),
  });

  const filtered = suggestions.filter(s => {
    if (typeFilter !== 'all' && s.suggestionType !== typeFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const driverName = `${s.driver.user.firstName} ${s.driver.user.lastName}`.toLowerCase();
      const driverNum = s.driver.driverNumber.toLowerCase();
      if (!driverName.includes(term) && !driverNum.includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <LinkIcon className="w-5 h-5 text-blue-600" />
        <h1 className="text-lg font-semibold">Equipment Assignment Suggestions</h1>
        <Badge variant="secondary">{suggestions.length} pending</Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Suggestions generated from load imports. Accept to update driver profiles with detected equipment pairings.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-red-600"
            onClick={() => bulkDismissMutation.mutate(filtered.map(s => s.id))}
            disabled={bulkDismissMutation.isPending}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Dismiss All ({filtered.length})
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading suggestions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No pending equipment suggestions</p>
          <p className="text-xs mt-1">Suggestions appear after importing loads with driver/truck/trailer data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(suggestion => (
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
