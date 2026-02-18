'use client';

import React from 'react';
import type { ExtendedColumnDef } from '@/components/data-table/types';
import { EditableCell } from '@/components/ui/editable-cell';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { apiUrl } from '@/lib/utils';

export interface FMCSAActionItemData {
  id: string;
  actionItem: string;
  priority: string;
  assignedTo?: string | null;
  dueDate?: string | Date | null;
  completedAt?: string | Date | null;
  completionNotes?: string | null;
  status: string;
  createdAt: string | Date;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  COMPLIANT: 'bg-green-100 text-green-800 border-green-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800 border-gray-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPriority(priority: string): string {
  return priority.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

async function updateActionItemField(
  actionItemId: string,
  field: string,
  value: string | number | null
): Promise<void> {
  const response = await fetch(apiUrl(`/api/safety/compliance/fmcsa/action-items/${actionItemId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ [field]: value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Failed to update ${field}`);
  }
}

export function createFMCSAActionItemColumns(
  onUpdate?: () => void
): ExtendedColumnDef<FMCSAActionItemData>[] {
  const handleSave = async (rowId: string, columnId: string, value: string | number) => {
    try {
      await updateActionItemField(rowId, columnId, value);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  };

  return [
    {
      id: 'actionItem',
      accessorKey: 'actionItem',
      header: 'Action Item',
      cell: ({ row }) => row.original.actionItem,
      defaultVisible: true,
      required: true,
    },
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.original.priority;
        const priorityColor = priorityColors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <Badge variant="outline" className={priorityColor}>
            {formatPriority(priority)}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
        return (
          <Badge variant="outline" className={statusColor}>
            {formatStatus(status)}
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        if (!dueDate) return <span className="text-muted-foreground">—</span>;
        return formatDate(dueDate);
      },
      defaultVisible: true,
    },
    {
      id: 'assignedTo',
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) => row.original.assignedTo || <span className="text-muted-foreground">—</span>,
      defaultVisible: false,
    },
    {
      id: 'completedAt',
      accessorKey: 'completedAt',
      header: 'Completed',
      cell: ({ row }) => {
        const completedAt = row.original.completedAt;
        if (!completedAt) return <span className="text-muted-foreground">—</span>;
        return formatDate(completedAt);
      },
      defaultVisible: false,
    },
    {
      id: 'completionNotes',
      accessorKey: 'completionNotes',
      header: 'Notes',
      cell: ({ row }) => (
        <EditableCell
          value={row.original.completionNotes || ''}
          rowId={row.original.id}
          columnId="completionNotes"
          onSave={handleSave}
          type="text"
          placeholder="Enter notes"
        />
      ),
      defaultVisible: false,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
      defaultVisible: false,
    },
  ];
}

