'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createMeetingsColumns, type MeetingData } from './MeetingsColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import CreateMeetingDialog from './CreateMeetingDialog';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function MeetingsTable() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<MeetingData | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<MeetingData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-meetings'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/meetings/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete meeting');
    },
    onSuccess: () => {
      toast.success('Meeting deleted');
      setDeleteMeeting(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canManage = can('safety.meetings.manage');

  const columns = useMemo(
    () => createMeetingsColumns({
      onEdit: canManage ? (m) => setEditMeeting(m) : undefined,
      onDelete: canManage ? (m) => setDeleteMeeting(m) : undefined,
    }),
    [canManage]
  );

  const fetchMeetings = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      const res = await fetch(apiUrl(`/api/safety/meetings?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch meetings');
      const json = await res.json();
      return { data: json.data as MeetingData[], meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {canManage && (
          <Button onClick={() => { setEditMeeting(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </div>

      <DataTableWrapper<MeetingData>
        config={{
          entityType: 'safety-meetings',
          columns,
          defaultSort: [{ id: 'meetingDate', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchMeetings}
        emptyMessage="No safety meetings found"
      />

      <CreateMeetingDialog
        open={createOpen || !!editMeeting}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditMeeting(null); }
        }}
        onSuccess={refresh}
        editMeeting={editMeeting}
      />

      <AlertDialog open={!!deleteMeeting} onOpenChange={(open) => { if (!open) setDeleteMeeting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the meeting &quot;{deleteMeeting?.topic}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMeeting && deleteMutation.mutate(deleteMeeting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
