'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { DataTableWrapper } from '@/components/data-table/DataTableWrapper';
import { createSafetyTaskColumns, type SafetyTaskData } from './SafetyTasksColumns';
import { apiUrl } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import CreateSafetyTaskDialog from './CreateSafetyTaskDialog';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function SafetyTasksTab() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<SafetyTaskData | null>(null);
  const [deleteTask, setDeleteTask] = useState<SafetyTaskData | null>(null);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['safety-tasks'] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiUrl(`/api/safety/tasks/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete task');
      }
    },
    onSuccess: () => {
      toast.success('Safety task deleted');
      setDeleteTask(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const lockMutation = useMutation({
    mutationFn: async (task: SafetyTaskData) => {
      const res = await fetch(apiUrl(`/api/safety/tasks/${task.id}/lock`), { method: 'PATCH' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle lock');
      }
    },
    onSuccess: (_, task) => {
      toast.success(task.isLocked ? 'Task unlocked' : 'Task locked');
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleEdit = useCallback((task: SafetyTaskData) => setEditTask(task), []);
  const handleDelete = useCallback((task: SafetyTaskData) => setDeleteTask(task), []);
  const handleToggleLock = useCallback((task: SafetyTaskData) => lockMutation.mutate(task), [lockMutation]);

  const canEdit = can('safety.tasks.edit');
  const canDelete = can('safety.tasks.delete');
  const canLock = can('safety.tasks.lock');

  const columns = useMemo(
    () => createSafetyTaskColumns({
      onEdit: canEdit ? handleEdit : undefined,
      onDelete: canDelete ? handleDelete : undefined,
      onToggleLock: canLock ? handleToggleLock : undefined,
    }),
    [handleEdit, handleDelete, handleToggleLock, canEdit, canDelete, canLock]
  );

  const fetchTasks = useCallback(
    async (params: { page?: number; pageSize?: number; sorting?: SortingState; filters?: ColumnFiltersState }) => {
      const qp = new URLSearchParams();
      if (params.page) qp.set('page', String(params.page));
      if (params.pageSize) qp.set('limit', String(params.pageSize));
      if (params.sorting?.[0]) {
        qp.set('sortField', params.sorting[0].id);
        qp.set('sortOrder', params.sorting[0].desc ? 'desc' : 'asc');
      }
      const res = await fetch(apiUrl(`/api/safety/tasks?${qp.toString()}`));
      if (!res.ok) throw new Error('Failed to fetch safety tasks');
      const json = await res.json();
      return { data: json.data as SafetyTaskData[], meta: json.meta };
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {can('safety.tasks.create') && (
          <Button onClick={() => { setEditTask(null); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Safety Task
          </Button>
        )}
      </div>

      <DataTableWrapper<SafetyTaskData>
        config={{
          entityType: 'safety-tasks',
          columns,
          defaultSort: [{ id: 'date', desc: true }],
          defaultPageSize: 20,
          enableRowSelection: true,
          enableColumnVisibility: true,
        }}
        fetchData={fetchTasks}
        emptyMessage="No safety tasks found"
      />

      <CreateSafetyTaskDialog
        open={createOpen || !!editTask}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditTask(null); }
        }}
        onSuccess={refresh}
        editTask={editTask}
      />

      <AlertDialog open={!!deleteTask} onOpenChange={(open) => { if (!open) setDeleteTask(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Safety Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete task {deleteTask?.taskNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTask && deleteMutation.mutate(deleteTask.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
