'use client';

import type { ExtendedColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MeetingData {
  id: string;
  meetingDate: string | Date;
  meetingTime?: string | null;
  location?: string | null;
  topic: string;
  agenda?: string | null;
  minutes?: string | null;
  actionItems?: string | null;
  attendance: Array<{
    id: string;
    attended: boolean;
    driver: { id: string; user: { firstName: string; lastName: string } };
  }>;
}

export interface MeetingActions {
  onEdit?: (meeting: MeetingData) => void;
  onDelete?: (meeting: MeetingData) => void;
  onAttendance?: (meeting: MeetingData) => void;
}

export function createMeetingsColumns(actions?: MeetingActions): ExtendedColumnDef<MeetingData>[] {
  return [
    {
      id: 'meetingDate',
      accessorKey: 'meetingDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.meetingDate),
      defaultVisible: true,
      required: true,
    },
    {
      id: 'meetingTime',
      accessorKey: 'meetingTime',
      header: 'Time',
      cell: ({ row }) => row.original.meetingTime ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'topic',
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => <span className="font-medium">{row.original.topic}</span>,
      defaultVisible: true,
    },
    {
      id: 'location',
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location ?? <span className="text-muted-foreground">-</span>,
      defaultVisible: true,
    },
    {
      id: 'attendance',
      header: 'Attendance',
      cell: ({ row }) => {
        const att = row.original.attendance;
        const attended = att.filter((a) => a.attended).length;
        return (
          <Badge variant="outline">
            {attended}/{att.length} attended
          </Badge>
        );
      },
      defaultVisible: true,
    },
    {
      id: 'hasMinutes',
      header: 'Minutes',
      cell: ({ row }) => (
        <Badge variant="outline" className={row.original.minutes ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
          {row.original.minutes ? 'Yes' : 'No'}
        </Badge>
      ),
      defaultVisible: true,
    },
    ...(actions ? [{
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: MeetingData } }) => {
        const meeting = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onAttendance && (
                <DropdownMenuItem onClick={() => actions.onAttendance!(meeting)}>
                  <Users className="h-4 w-4 mr-2" /> Attendance
                </DropdownMenuItem>
              )}
              {actions.onEdit && (
                <DropdownMenuItem onClick={() => actions.onEdit!(meeting)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {actions.onDelete && (
                <DropdownMenuItem onClick={() => actions.onDelete!(meeting)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      defaultVisible: true,
    } as ExtendedColumnDef<MeetingData>] : []),
  ];
}
