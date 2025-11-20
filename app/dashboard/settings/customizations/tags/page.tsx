import TagManagement from '@/components/settings/customizations/TagManagement';

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tag Management</h1>
        <p className="text-muted-foreground">
          Manage tags for loads, drivers, and vehicles
        </p>
      </div>
      <TagManagement />
    </div>
  );
}
