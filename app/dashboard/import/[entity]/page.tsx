import ImportPage from '@/components/import-export/ImportPage';
import { getEntityConfig } from '@/lib/import-export/entity-config';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface ImportEntityPageProps {
  params: Promise<{ entity: string }>;
}

export default async function ImportEntityPage({ params }: ImportEntityPageProps) {
  const { entity } = await params;
  const config = getEntityConfig(entity);

  if (!config) {
    notFound();
  }

  // Determine back URL based on entity type
  const backUrls: Record<string, string> = {
    trucks: '/dashboard/trucks',
    trailers: '/dashboard/trailers',
    loads: '/dashboard/loads',
    customers: '/dashboard/customers',
    drivers: '/dashboard/drivers',
    invoices: '/dashboard/invoices',
  };

  const backUrl = backUrls[entity] || '/dashboard';

  return (
    <>
      <Breadcrumb items={[
        { label: 'Import', href: '/dashboard/import' },
        { label: config.label }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import {config.label}</h1>
        </div>
        <ImportPage
          entityType={entity}
          entityLabel={config.label}
          systemFields={config.fields}
          backUrl={backUrl}
          exampleFileUrl={config.exampleFileUrl}
        />
      </div>
    </>
  );
}

