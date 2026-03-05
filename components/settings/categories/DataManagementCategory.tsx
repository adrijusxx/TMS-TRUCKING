'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RotateCcw, History } from 'lucide-react';
import BulkDeleteManager from '@/components/settings/BulkDeleteManager';
import DeletedItemsCategory from '@/components/settings/categories/DeletedItemsCategory';
import AuditHistoryCategory from '@/components/settings/categories/AuditHistoryCategory';

export default function DataManagementCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data & Audit</h2>
        <p className="text-muted-foreground">
          Bulk delete records, restore soft-deleted items, and review the audit trail of all changes made across the system. Use these tools carefully &mdash; bulk deletes are permanent.
        </p>
      </div>

      <Tabs defaultValue="bulk-delete" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bulk-delete">
            <Trash2 className="h-4 w-4 mr-2" />
            Bulk Delete
          </TabsTrigger>
          <TabsTrigger value="deleted-items">
            <RotateCcw className="h-4 w-4 mr-2" />
            Deleted Items
          </TabsTrigger>
          <TabsTrigger value="audit-history">
            <History className="h-4 w-4 mr-2" />
            Audit History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bulk-delete">
          <BulkDeleteManager />
        </TabsContent>

        <TabsContent value="deleted-items">
          <DeletedItemsCategory />
        </TabsContent>

        <TabsContent value="audit-history">
          <AuditHistoryCategory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
