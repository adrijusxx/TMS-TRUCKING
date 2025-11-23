'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';
import UserManagement from '@/components/settings/UserManagement';
import RolePermissions from '@/components/settings/RolePermissions';

export default function TeamUsersCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Team & Users</h2>
        <p className="text-muted-foreground">
          Manage team members, roles, and permissions
        </p>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </h3>
              <p className="text-muted-foreground mt-1">
                Manage users and team members across all departments
              </p>
            </div>
            <Tabs defaultValue="drivers" className="space-y-4">
              <TabsList>
                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                <TabsTrigger value="admins">Administrators</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Department</TabsTrigger>
                <TabsTrigger value="accounting">Accounting Department</TabsTrigger>
                <TabsTrigger value="fleet">Fleet Department</TabsTrigger>
                <TabsTrigger value="safety">Safety Department</TabsTrigger>
                <TabsTrigger value="hr">HR Department</TabsTrigger>
              </TabsList>

              <TabsContent value="drivers">
                <UserManagement 
                  roleFilter="DRIVER" 
                  title="Drivers" 
                  description="Manage drivers in your organization" 
                />
              </TabsContent>

              <TabsContent value="admins">
                <UserManagement 
                  roleFilter="ADMIN" 
                  title="Administrators" 
                  description="Manage system administrators with full access" 
                />
              </TabsContent>

              <TabsContent value="employees">
                <UserManagement 
                  roleFilter="EMPLOYEES" 
                  title="Employees" 
                  description="Manage employees (accountants and other staff)" 
                />
              </TabsContent>

              <TabsContent value="dispatch">
                <UserManagement 
                  roleFilter="DISPATCHER" 
                  title="Dispatch Department" 
                  description="Manage dispatchers in your organization" 
                />
              </TabsContent>

              <TabsContent value="accounting">
                <UserManagement 
                  roleFilter="ACCOUNTANT" 
                  title="Accounting Department" 
                  description="Manage accountants and accounting staff" 
                />
              </TabsContent>

              <TabsContent value="fleet">
                <UserManagement 
                  roleFilter="FLEET" 
                  title="Fleet Department" 
                  description="Manage fleet managers and fleet operations staff" 
                />
              </TabsContent>

              <TabsContent value="safety">
                <UserManagement 
                  roleFilter="SAFETY" 
                  title="Safety Department" 
                  description="Manage safety department staff (Admins with safety access)" 
                />
              </TabsContent>

              <TabsContent value="hr">
                <UserManagement 
                  roleFilter="HR" 
                  title="HR Department" 
                  description="Manage HR department staff (Admins with HR access)" 
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <RolePermissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

