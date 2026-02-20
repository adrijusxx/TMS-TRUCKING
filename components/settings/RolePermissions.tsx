'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FolderOpen } from 'lucide-react';
import RoleList from './roles/RoleList';
import RoleEditor from './roles/RoleEditor';
import PermissionGroupList from './roles/PermissionGroupList';
import PermissionGroupEditor from './roles/PermissionGroupEditor';

type View =
  | { tab: 'roles'; mode: 'list' }
  | { tab: 'roles'; mode: 'edit'; roleId: string }
  | { tab: 'groups'; mode: 'list' }
  | { tab: 'groups'; mode: 'edit'; groupId: string };

export default function RolePermissions() {
  const [view, setView] = useState<View>({ tab: 'roles', mode: 'list' });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Roles & Permissions</h3>
        <p className="text-muted-foreground text-sm">
          Manage roles, permission groups, and per-user overrides.
        </p>
      </div>

      {/* Show editor views without tabs */}
      {view.tab === 'roles' && view.mode === 'edit' && (
        <RoleEditor
          roleId={view.roleId}
          onBack={() => setView({ tab: 'roles', mode: 'list' })}
        />
      )}

      {view.tab === 'groups' && view.mode === 'edit' && (
        <PermissionGroupEditor
          groupId={view.groupId}
          onBack={() => setView({ tab: 'groups', mode: 'list' })}
        />
      )}

      {/* Show list views with tabs */}
      {view.mode === 'list' && (
        <Tabs
          value={view.tab}
          onValueChange={t => setView({ tab: t as 'roles' | 'groups', mode: 'list' })}
        >
          <TabsList>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="groups">
              <FolderOpen className="h-4 w-4 mr-2" />
              Permission Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-6">
            <RoleList
              onEditRole={roleId => setView({ tab: 'roles', mode: 'edit', roleId })}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <PermissionGroupList
              onEditGroup={groupId => setView({ tab: 'groups', mode: 'edit', groupId })}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
