import DocumentList from '@/components/documents/DocumentListNew';
import DocumentUpload from '@/components/documents/DocumentUpload';

export default function DocumentsPage() {
  return (
    <div className="space-y-4">
<div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DocumentUpload />
        </div>
        <div className="lg:col-span-2">
          <DocumentList />
        </div>
      </div>
      </div>
  );
}

