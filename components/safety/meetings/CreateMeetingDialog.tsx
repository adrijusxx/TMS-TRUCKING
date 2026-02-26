'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { MeetingData } from './MeetingsColumns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMeeting?: MeetingData | null;
}

export default function CreateMeetingDialog({ open, onOpenChange, onSuccess, editMeeting }: Props) {
  const isEdit = !!editMeeting;

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const data = {
        meetingDate: formData.get('meetingDate'),
        meetingTime: formData.get('meetingTime') || null,
        location: formData.get('location') || null,
        topic: formData.get('topic'),
        agenda: formData.get('agenda') || null,
        minutes: formData.get('minutes') || null,
        actionItems: formData.get('actionItems') || null,
      };

      const url = isEdit ? apiUrl(`/api/safety/meetings/${editMeeting.id}`) : apiUrl('/api/safety/meetings');
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save meeting');
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Meeting updated' : 'Meeting scheduled');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meeting' : 'Schedule Safety Meeting'}</DialogTitle>
        </DialogHeader>
        <form action={(formData) => mutation.mutate(formData)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meetingDate">Date *</Label>
              <Input id="meetingDate" name="meetingDate" type="date" required defaultValue={editMeeting ? new Date(editMeeting.meetingDate).toISOString().split('T')[0] : ''} />
            </div>
            <div>
              <Label htmlFor="meetingTime">Time</Label>
              <Input id="meetingTime" name="meetingTime" type="time" defaultValue={editMeeting?.meetingTime ?? ''} />
            </div>
          </div>
          <div>
            <Label htmlFor="topic">Topic *</Label>
            <Input id="topic" name="topic" required defaultValue={editMeeting?.topic ?? ''} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={editMeeting?.location ?? ''} />
          </div>
          <div>
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea id="agenda" name="agenda" rows={3} defaultValue={editMeeting?.agenda ?? ''} />
          </div>
          {isEdit && (
            <>
              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Textarea id="minutes" name="minutes" rows={4} defaultValue={editMeeting?.minutes ?? ''} />
              </div>
              <div>
                <Label htmlFor="actionItems">Action Items</Label>
                <Textarea id="actionItems" name="actionItems" rows={3} defaultValue={editMeeting?.actionItems ?? ''} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
