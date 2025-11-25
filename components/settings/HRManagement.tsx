'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';

export default function HRManagement() {
  return (
    <Tabs defaultValue="dispatchers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dispatchers">Dispatchers</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatchers">
          <UserManagement title="Dispatchers" description="Manage dispatchers in your organization" />
        </TabsContent>

        <TabsContent value="employees">
          <UserManagement title="Employees" description="Manage accountants, admins, and other employees" />
        </TabsContent>
      </Tabs>
  );
}

