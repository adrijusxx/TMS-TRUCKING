'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Edit,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { formatDate, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface OnCallShift {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  startDate: string;
  endDate: string;
  shiftType: 'DAY' | 'NIGHT' | 'WEEKEND' | 'HOLIDAY';
  handoffNotes?: string;
  createdAt: string;
}

interface OnCallUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
}

async function fetchOnCallShifts(startDate: string, endDate: string) {
  const response = await fetch(
    apiUrl(`/api/fleet/on-call/shifts?startDate=${startDate}&endDate=${endDate}`)
  );
  if (!response.ok) throw new Error('Failed to fetch on-call shifts');
  return response.json();
}

async function fetchOnCallUsers() {
  const response = await fetch(apiUrl('/api/fleet/on-call/users'));
  if (!response.ok) throw new Error('Failed to fetch on-call users');
  return response.json();
}

async function createOnCallShift(data: {
  userId: string;
  startDate: string;
  endDate: string;
  shiftType: string;
  handoffNotes?: string;
}) {
  const response = await fetch(apiUrl('/api/fleet/on-call/shifts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create shift');
  }
  return response.json();
}

async function updateOnCallShift(id: string, data: any) {
  const response = await fetch(apiUrl(`/api/fleet/on-call/shifts/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update shift');
  }
  return response.json();
}

function getShiftTypeColor(type: string): string {
  switch (type) {
    case 'DAY':
      return 'bg-blue-500 text-white';
    case 'NIGHT':
      return 'bg-indigo-500 text-white';
    case 'WEEKEND':
      return 'bg-purple-500 text-white';
    case 'HOLIDAY':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export default function OnCallSchedule() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<OnCallShift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [shiftForm, setShiftForm] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    shiftType: 'DAY',
    handoffNotes: '',
  });

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: shiftsData } = useQuery({
    queryKey: ['onCallShifts', monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () =>
      fetchOnCallShifts(monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]),
  });

  const { data: usersData } = useQuery({
    queryKey: ['onCallUsers'],
    queryFn: fetchOnCallUsers,
  });

  const shifts: OnCallShift[] = shiftsData?.data?.shifts || [];
  const users: OnCallUser[] = usersData?.data?.users || [];

  const createMutation = useMutation({
    mutationFn: createOnCallShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onCallShifts'] });
      toast.success('On-call shift created successfully');
      setShiftDialogOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateOnCallShift(editingShift!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onCallShifts'] });
      toast.success('On-call shift updated successfully');
      setShiftDialogOpen(false);
      setEditingShift(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setShiftForm({
      userId: '',
      startDate: '',
      endDate: '',
      shiftType: 'DAY',
      handoffNotes: '',
    });
    setSelectedDate(null);
  };

  const handleOpenDialog = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateStr = date.toISOString().split('T')[0];
      setShiftForm({
        ...shiftForm,
        startDate: dateStr,
        endDate: dateStr,
      });
    }
    setShiftDialogOpen(true);
  };

  const handleEditShift = (shift: OnCallShift) => {
    setEditingShift(shift);
    setShiftForm({
      userId: shift.userId,
      startDate: shift.startDate.split('T')[0],
      endDate: shift.endDate.split('T')[0],
      shiftType: shift.shiftType,
      handoffNotes: shift.handoffNotes || '',
    });
    setShiftDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!shiftForm.userId || !shiftForm.startDate || !shiftForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingShift) {
      updateMutation.mutate(shiftForm);
    } else {
      createMutation.mutate(shiftForm);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getShiftsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter((shift) => {
      const start = shift.startDate.split('T')[0];
      const end = shift.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage 24/7 road service staffing and coverage
          </p>
        </div>
        {can('trucks.edit') && (
          <Dialog open={shiftDialogOpen} onOpenChange={(open) => {
            setShiftDialogOpen(open);
            if (!open) {
              setEditingShift(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingShift ? 'Edit On-Call Shift' : 'Create On-Call Shift'}
                </DialogTitle>
                <DialogDescription>
                  Assign staff members to on-call coverage periods
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Staff Member *</Label>
                    <Select
                      value={shiftForm.userId}
                      onValueChange={(value) => setShiftForm({ ...shiftForm, userId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift Type *</Label>
                    <Select
                      value={shiftForm.shiftType}
                      onValueChange={(value) => setShiftForm({ ...shiftForm, shiftType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAY">Day Shift</SelectItem>
                        <SelectItem value="NIGHT">Night Shift</SelectItem>
                        <SelectItem value="WEEKEND">Weekend</SelectItem>
                        <SelectItem value="HOLIDAY">Holiday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={shiftForm.startDate}
                      onChange={(e) => setShiftForm({ ...shiftForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={shiftForm.endDate}
                      onChange={(e) => setShiftForm({ ...shiftForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Handoff Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add notes for shift handoff, special instructions, or important information..."
                    value={shiftForm.handoffNotes}
                    onChange={(e) => setShiftForm({ ...shiftForm, handoffNotes: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShiftDialogOpen(false);
                      setEditingShift(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : editingShift
                      ? 'Update Shift'
                      : 'Create Shift'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current On-Call */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Currently On-Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const todayStr = today.toISOString().split('T')[0];
            const currentShifts = shifts.filter((shift) => {
              const start = shift.startDate.split('T')[0];
              const end = shift.endDate.split('T')[0];
              return todayStr >= start && todayStr <= end;
            });

            if (currentShifts.length === 0) {
              return (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No one is currently scheduled for on-call</p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {currentShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getShiftTypeColor(shift.shiftType)}>
                        {shift.shiftType}
                      </Badge>
                      <div>
                        <div className="font-medium">{shift.userName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(shift.startDate)} - {formatDate(shift.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {shift.userPhone && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`tel:${shift.userPhone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {shift.userEmail && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`mailto:${shift.userEmail}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {can('trucks.edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditShift(shift)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>{monthName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-3 text-center font-medium border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {days.map((date, index) => {
                const dayShifts = getShiftsForDate(date);
                const isToday = date && date.toDateString() === today.toDateString();
                const isOtherMonth = !date;

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-r border-b last:border-r-0 p-2 ${
                      isOtherMonth ? 'bg-muted/30' : ''
                    } ${isToday ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                  >
                    {date && (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm font-medium ${
                              isToday ? 'text-blue-600 dark:text-blue-400' : ''
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {can('trucks.edit') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleOpenDialog(date)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getShiftTypeColor(
                                shift.shiftType
                              )}`}
                              onClick={() => can('trucks.edit') && handleEditShift(shift)}
                              title={`${shift.userName} - ${shift.shiftType}`}
                            >
                              <div className="truncate font-medium">{shift.userName}</div>
                              <div className="truncate opacity-90">{shift.shiftType}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

