'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Circle } from 'lucide-react';
import { apiUrl } from '@/lib/utils';

interface RoleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
}

interface RoleUserListProps {
  roleId: string;
  roleName: string;
  onBack: () => void;
  onSelectUser: (userId: string, userName: string) => void;
}

export default function RoleUserList({ roleId, roleName, onBack, onSelectUser }: RoleUserListProps) {
  const { data: users = [], isLoading } = useQuery<RoleUser[]>({
    queryKey: ['role-users', roleId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/settings/roles/${roleId}/users`));
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      return json.data || [];
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Roles
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users in &quot;{roleName}&quot;
          </h3>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? 's' : ''} assigned to this role.
            Click a user to view their effective permissions.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users assigned to this role.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectUser(user.id, `${user.firstName} ${user.lastName}`)}
                  >
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        <Circle className={`h-2 w-2 fill-current ${user.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.lastLogin)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
