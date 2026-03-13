'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import BulkActionBar from '@/components/import-export/BulkActionBar';
import { updateUser } from './api';
import { type UserFormData, ROLE_OPTIONS } from './types';

interface UserBulkActionsProps {
  selectedIds: string[];
  mcNumbers: any[];
  onClearSelection: () => void;
}

export default function UserBulkActions({
  selectedIds,
  mcNumbers,
  onClearSelection,
}: UserBulkActionsProps) {
  const queryClient = useQueryClient();
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [bulkEditMcAccess, setBulkEditMcAccess] = useState<string[]>([]);
  const [bulkEditRole, setBulkEditRole] = useState<string>('none');
  const [bulkEditStatus, setBulkEditStatus] = useState<string>('none');

  const handleBulkEdit = async (updates: Partial<UserFormData>) => {
    if (selectedIds.length === 0) return;

    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => updateUser(id, updates))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      queryClient.invalidateQueries({ queryKey: ['users'] });

      if (failed === 0) {
        toast.success(`Updated ${successful} user(s) successfully`);
        onClearSelection();
        setIsBulkEditDialogOpen(false);
      } else if (successful > 0) {
        toast.warning(
          `Updated ${successful} user(s), but ${failed} failed. Some users may not exist or belong to a different company.`,
          { duration: 5000 }
        );
        setIsBulkEditDialogOpen(false);
      } else {
        toast.error(
          `Failed to update users. They may not exist or belong to a different company.`,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update users');
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="sticky bottom-4 left-0 right-0 z-40 bg-white dark:bg-background border rounded-lg shadow-lg p-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={true} onCheckedChange={() => onClearSelection()} />
              <span className="text-sm font-medium">
                {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>Clear</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setBulkEditMcAccess([]);
                setBulkEditRole('none');
                setBulkEditStatus('none');
                setIsBulkEditDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
            <BulkActionBar
              selectedIds={selectedIds}
              onClearSelection={onClearSelection}
              entityType="user"
            />
          </div>
        </div>
      </div>

      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Users</DialogTitle>
            <DialogDescription>
              Update {selectedIds.length} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const updates: Partial<UserFormData> = {};
              if (bulkEditRole && bulkEditRole !== 'none') {
                updates.role = bulkEditRole as any;
              }
              if (bulkEditStatus && bulkEditStatus !== 'none') {
                updates.isActive = bulkEditStatus === 'true';
              }
              if (bulkEditMcAccess.length > 0) {
                updates.mcAccess = bulkEditMcAccess;
                updates.mcNumberId = bulkEditMcAccess[0];
              }
              if (Object.keys(updates).length === 0) {
                toast.error('Please select at least one field to update');
                return;
              }
              handleBulkEdit(updates);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="bulk-role">Role (optional)</Label>
              <Select value={bulkEditRole} onValueChange={setBulkEditRole}>
                <SelectTrigger><SelectValue placeholder="Keep current role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current role</SelectItem>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-status">Status (optional)</Label>
              <Select value={bulkEditStatus} onValueChange={setBulkEditStatus}>
                <SelectTrigger><SelectValue placeholder="Keep current status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>MC Access (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Select MC numbers to assign to all selected users. Leave empty to keep current MC access.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {mcNumbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No MC numbers available</p>
                ) : (
                  mcNumbers.map((mc: any) => (
                    <div key={mc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bulk-mc-access-${mc.id}`}
                        checked={bulkEditMcAccess.includes(mc.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkEditMcAccess([...bulkEditMcAccess, mc.id]);
                          } else {
                            setBulkEditMcAccess(bulkEditMcAccess.filter((id: string) => id !== mc.id));
                          }
                        }}
                      />
                      <Label htmlFor={`bulk-mc-access-${mc.id}`} className="font-normal cursor-pointer flex-1">
                        {mc.companyName} (MC {mc.number})
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {bulkEditMcAccess.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setBulkEditMcAccess([])}>
                  Clear MC Selection
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBulkEditDialogOpen(false);
                  setBulkEditMcAccess([]);
                  setBulkEditRole('none');
                  setBulkEditStatus('none');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update {selectedIds.length} User(s)
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
