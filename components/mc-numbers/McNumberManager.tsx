'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import McNumberList from './McNumberList';
import McNumberForm from './McNumberForm';

export default function McNumberManager() {
  const { isAdmin } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General info</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, MC number, owner, or USDOT..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* MC Numbers List */}
          <McNumberList searchQuery={searchQuery} page={page} limit={20} />
        </TabsContent>

        <TabsContent value="offices">
          <div className="text-center py-8 text-muted-foreground">
            Offices feature coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Form Dialog */}
      <McNumberForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mcNumber={null}
      />
    </div>
  );
}
