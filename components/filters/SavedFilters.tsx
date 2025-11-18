'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, BookmarkCheck, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/utils';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  entityType: string;
}

interface SavedFiltersProps {
  entityType: string;
  currentFilters: Record<string, any>;
  onApplyFilter: (filters: Record<string, any>) => void;
}

async function fetchSavedFilters(entityType: string) {
  const response = await fetch(apiUrl(`/api/filters/saved?entityType=${entityType}`));
  if (!response.ok) throw new Error('Failed to fetch saved filters');
  return response.json();
}

async function saveFilter(data: { name: string; filters: Record<string, any>; entityType: string }) {
  const response = await fetch(apiUrl('/api/filters/saved'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save filter');
  return response.json();
}

async function deleteFilter(id: string) {
  const response = await fetch(apiUrl(`/api/filters/saved/${id}`), {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete filter');
  return response.json();
}

export default function SavedFilters({ entityType, currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: SavedFilter[] }>({
    queryKey: ['saved-filters', entityType],
    queryFn: () => fetchSavedFilters(entityType),
  });

  const saveMutation = useMutation({
    mutationFn: saveFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filter saved!');
      setSaveDialogOpen(false);
      setFilterName('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save filter');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters', entityType] });
      toast.success('Filter deleted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete filter');
    },
  });

  const savedFilters = data?.data || [];
  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  const handleSave = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }
    saveMutation.mutate({
      name: filterName,
      filters: currentFilters,
      entityType,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Filters
            {savedFilters.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No saved filters
            </div>
          ) : (
            savedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between group">
                <DropdownMenuItem
                  onClick={() => onApplyFilter(filter.filters)}
                  className="flex-1 cursor-pointer"
                >
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  {filter.name}
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete filter "${filter.name}"?`)) {
                      deleteMutation.mutate(filter.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
          <DropdownMenuSeparator />
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSaveDialogOpen(true);
                }}
                disabled={!hasActiveFilters}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Filter
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Filter</DialogTitle>
                <DialogDescription>
                  Save your current filter settings for quick access later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-name">Filter Name</Label>
                  <Input
                    id="filter-name"
                    placeholder="e.g., High Priority Loads"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSave();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

