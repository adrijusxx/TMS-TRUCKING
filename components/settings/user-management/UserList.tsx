'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { roleColors, type SortField, type SortDirection, type ColumnVisibility } from './types';

interface UserListProps {
  users: any[];
  mcNumbers: any[];
  isLoading: boolean;
  selectedIds: string[];
  visibleColumns: ColumnVisibility;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectUser: (userId: string, checked: boolean) => void;
  onEdit: (user: any) => void;
  onDelete: (userId: string) => void;
}

export default function UserList({
  users,
  mcNumbers,
  isLoading,
  selectedIds,
  visibleColumns,
  sortField,
  sortDirection,
  onSort,
  onToggleSelectAll,
  onToggleSelectUser,
  onEdit,
  onDelete,
}: UserListProps) {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No users found</div>;
  }

  return (
    <div className="border rounded-lg overflow-auto max-h-[calc(100vh-300px)]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {visibleColumns.checkbox && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === users.length && users.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            {visibleColumns.name && (
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort('firstName')}>
                  Name{getSortIcon('firstName')}
                </Button>
              </TableHead>
            )}
            {visibleColumns.email && (
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort('email')}>
                  Email{getSortIcon('email')}
                </Button>
              </TableHead>
            )}
            {visibleColumns.password && <TableHead>Password</TableHead>}
            {visibleColumns.phone && <TableHead>Phone</TableHead>}
            {visibleColumns.role && (
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort('role')}>
                  Role{getSortIcon('role')}
                </Button>
              </TableHead>
            )}
            {visibleColumns.mcAccess && <TableHead>MC Access</TableHead>}
            {visibleColumns.status && (
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort('isActive')}>
                  Status{getSortIcon('isActive')}
                </Button>
              </TableHead>
            )}
            {visibleColumns.lastLogin && (
              <TableHead>
                <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => onSort('lastLogin')}>
                  Last Login{getSortIcon('lastLogin')}
                </Button>
              </TableHead>
            )}
            {visibleColumns.actions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <UserRow
              key={user.id}
              user={user}
              mcNumbers={mcNumbers}
              visibleColumns={visibleColumns}
              isSelected={selectedIds.includes(user.id)}
              onToggleSelect={(checked) => onToggleSelectUser(user.id, checked)}
              onEdit={() => onEdit(user)}
              onDelete={() => onDelete(user.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface UserRowProps {
  user: any;
  mcNumbers: any[];
  visibleColumns: ColumnVisibility;
  isSelected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function UserRow({ user, mcNumbers, visibleColumns, isSelected, onToggleSelect, onEdit, onDelete }: UserRowProps) {
  const allMcIds = new Set<string>();
  if (user.mcNumberId) allMcIds.add(user.mcNumberId);
  if (user.mcAccess && Array.isArray(user.mcAccess)) {
    user.mcAccess.forEach((mcId: string) => allMcIds.add(mcId));
  }
  if (allMcIds.size === 0 && user.mcNumber?.id) {
    allMcIds.add(user.mcNumber.id);
  }
  const accessibleMcIds = Array.from(allMcIds);

  return (
    <TableRow>
      {visibleColumns.checkbox && (
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        </TableCell>
      )}
      {visibleColumns.name && (
        <TableCell>{user.firstName} {user.lastName}</TableCell>
      )}
      {visibleColumns.email && <TableCell>{user.email}</TableCell>}
      {visibleColumns.password && (
        <TableCell>
          {user.tempPassword ? (
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{user.tempPassword}</span>
          ) : (
            <span className="text-muted-foreground text-xs">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</span>
          )}
        </TableCell>
      )}
      {visibleColumns.phone && <TableCell>{user.phone || '-'}</TableCell>}
      {visibleColumns.role && (
        <TableCell>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={roleColors[user.role] || ''}>{user.role}</Badge>
            {user.customRole && (
              <Badge variant="secondary" className="text-[10px]">{user.customRole.name}</Badge>
            )}
          </div>
        </TableCell>
      )}
      {visibleColumns.mcAccess && (
        <TableCell>
          {accessibleMcIds.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {accessibleMcIds.slice(0, 3).map((mcId: string) => {
                const mc = mcNumbers.find((m: any) => m.id === mcId);
                return mc ? (
                  <Badge key={mcId} variant="secondary" className="text-xs">
                    {mc.companyName} (MC {mc.number})
                  </Badge>
                ) : null;
              })}
              {accessibleMcIds.length > 3 && (
                <Badge variant="secondary" className="text-xs">+{accessibleMcIds.length - 3} more</Badge>
              )}
            </div>
          ) : user.role === 'ADMIN' ? (
            <Badge variant="outline" className="text-xs">All MCs</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>
      )}
      {visibleColumns.status && (
        <TableCell>
          <Badge variant={user.isActive ? 'default' : 'secondary'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
      )}
      {visibleColumns.lastLogin && (
        <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</TableCell>
      )}
      {visibleColumns.actions && (
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
