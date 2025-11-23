import TagManagement from '@/components/settings/customizations/TagManagement';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function TagsPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'Customizations', href: '/dashboard/settings' },
        { label: 'Tags' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tag Management</h1>
        </div>
        <TagManagement />
      </div>
    </>
  );
}
