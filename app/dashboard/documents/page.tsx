import { Breadcrumb } from '@/components/ui/breadcrumb';
import DocumentList from '@/components/documents/DocumentListNew';
import DocumentUpload from '@/components/documents/DocumentUpload';

export default function DocumentsPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Documents', href: '/dashboard/documents' }]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DocumentUpload />
        </div>
        <div className="lg:col-span-2">
          <DocumentList />
        </div>
      </div>
      </div>
    </>
  );
}

