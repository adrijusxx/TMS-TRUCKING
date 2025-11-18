import DocumentList from '@/components/documents/DocumentList';
import DocumentUpload from '@/components/documents/DocumentUpload';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Manage all your documents in one place
        </p>
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
  );
}

