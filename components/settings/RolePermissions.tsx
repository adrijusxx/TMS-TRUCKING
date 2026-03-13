'use client';

import { useState } from 'react';
import RoleList from './roles/RoleList';
import RoleEditor from './roles/RoleEditor';
import RoleUserList from './roles/RoleUserList';
import UserPermissionDashboard from './roles/UserPermissionDashboard';

type View =
  | { mode: 'list' }
  | { mode: 'edit'; roleId: string }
  | { mode: 'users'; roleId: string; roleName: string }
  | { mode: 'user-perms'; roleId: string; roleName: string; userId: string; userName: string };

export default function RolePermissions() {
  const [view, setView] = useState<View>({ mode: 'list' });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Roles & Permissions</h3>
        <p className="text-muted-foreground text-sm">
          Manage roles, permissions, and per-user overrides.
        </p>
      </div>

      {view.mode === 'list' && (
        <RoleList
          onEditRole={roleId => setView({ mode: 'edit', roleId })}
          onViewUsers={(roleId, roleName) => setView({ mode: 'users', roleId, roleName })}
        />
      )}

      {view.mode === 'edit' && (
        <RoleEditor
          roleId={view.roleId}
          onBack={() => setView({ mode: 'list' })}
        />
      )}

      {view.mode === 'users' && (
        <RoleUserList
          roleId={view.roleId}
          roleName={view.roleName}
          onBack={() => setView({ mode: 'list' })}
          onSelectUser={(userId, userName) =>
            setView({ mode: 'user-perms', roleId: view.roleId, roleName: view.roleName, userId, userName })
          }
        />
      )}

      {view.mode === 'user-perms' && (
        <UserPermissionDashboard
          roleId={view.roleId}
          roleName={view.roleName}
          userId={view.userId}
          userName={view.userName}
          onBack={() => setView({ mode: 'users', roleId: view.roleId, roleName: view.roleName })}
        />
      )}
    </div>
  );
}
