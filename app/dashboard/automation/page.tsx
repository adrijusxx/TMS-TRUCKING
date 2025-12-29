import { Breadcrumb } from '@/components/ui/breadcrumb';
import AutomationPanel from '@/components/automation/AutomationPanel';

export default function AutomationPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Automation', href: '/dashboard/automation' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automation</h1>
        </div>
        <AutomationPanel />
      </div>
    </>
  );
}

