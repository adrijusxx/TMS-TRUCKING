'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Loader2, X, User, Check, ChevronsUpDown, Mail, Phone } from 'lucide-react';
import { cn, apiUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  userId: string;
  role?: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string; role: string };
}

interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

interface CaseAssignmentPickerProps {
  breakdownId: string;
  assignments: Assignment[];
}

const ASSIGNMENT_ROLES = [
  { value: 'Lead', label: 'Lead' },
  { value: 'Support', label: 'Support' },
  { value: 'On-Call', label: 'On-Call' },
  { value: 'Reviewer', label: 'Reviewer' },
];

async function searchStaff(query: string) {
  const response = await fetch(apiUrl(`/api/users/staff?search=${encodeURIComponent(query)}&limit=10`));
  if (!response.ok) throw new Error('Failed to search staff');
  const data = await response.json();
  return data.data || [];
}

async function addAssignment(breakdownId: string, data: { userId: string; role?: string }) {
  const response = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/assignments`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to add assignment');
  }
  return response.json();
}

async function removeAssignment(breakdownId: string, userId: string) {
  const response = await fetch(apiUrl(`/api/breakdowns/${breakdownId}/assignments?userId=${userId}`), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to remove assignment');
  }
  return response.json();
}

export default function CaseAssignmentPicker({ breakdownId, assignments }: CaseAssignmentPickerProps) {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Support');

  const { data: staffData, isLoading: staffLoading } = useQuery<StaffUser[]>({
    queryKey: ['staff-search', searchQuery],
    queryFn: () => searchStaff(searchQuery),
    enabled: searchOpen,
  });

  const staff = staffData || [];
  const selectedUser = staff.find(s => s.id === selectedUserId);

  // Filter out already assigned users
  const availableStaff = staff.filter(s => !assignments.some(a => a.userId === s.id));

  const addMutation = useMutation({
    mutationFn: (data: { userId: string; role?: string }) => addAssignment(breakdownId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      toast.success('Team member assigned');
      setSelectedUserId('');
      setSelectedRole('Support');
      setShowPicker(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAssignment(breakdownId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeBreakdowns-compact'] });
      toast.success('Team member removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdd = () => {
    if (!selectedUserId) {
      toast.error('Please select a team member');
      return;
    }
    addMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const getInitials = (firstName: string, lastName: string) => 
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'DISPATCHER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'FLEET': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Assignments */}
      {assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-2 bg-background rounded-md border">
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {getInitials(assignment.user.firstName, assignment.user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {assignment.user.firstName} {assignment.user.lastName}
                    </span>
                    {assignment.role && (
                      <Badge variant="outline" className="text-xs h-4 px-1.5">{assignment.role}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className={cn('text-xs h-4 px-1.5', getRoleBadgeColor(assignment.user.role))}>
                      {assignment.user.role}
                    </Badge>
                    {assignment.user.phone && (
                      <a href={`tel:${assignment.user.phone}`} className="flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" />
                        {assignment.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeMutation.mutate(assignment.userId)}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No team members assigned</p>
        </div>
      )}

      {/* Add Assignment Form */}
      {showPicker ? (
        <div className="space-y-3 border rounded-md p-3 bg-background">
          <div className="space-y-1">
            <Label className="text-xs">Select Team Member</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-xs">
                  {selectedUser ? (
                    <span>{selectedUser.firstName} {selectedUser.lastName}</span>
                  ) : (
                    'Search for staff...'
                  )}
                  <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search by name..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="h-8"
                  />
                  <CommandList>
                    {staffLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                    <CommandEmpty>No staff found.</CommandEmpty>
                    <CommandGroup>
                      {availableStaff.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={() => {
                            setSelectedUserId(user.id);
                            setSearchOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-3.5 w-3.5', selectedUserId === user.id ? 'opacity-100' : 'opacity-0')} />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-xs">{user.firstName} {user.lastName}</span>
                              <Badge variant="secondary" className={cn('ml-2 text-xs h-4 px-1', getRoleBadgeColor(user.role))}>
                                {user.role}
                              </Badge>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Assignment Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPicker(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending || !selectedUserId}>
              {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
              Assign
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowPicker(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Assign Team Member
        </Button>
      )}
    </div>
  );
}












