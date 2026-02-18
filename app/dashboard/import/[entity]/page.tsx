import UnifiedImportWizard from '@/components/import-export/UnifiedImportWizard';
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
        <UnifiedImportWizard
          entityType={entity}
          mode="fullpage"
        />
      </div>
    </>
  );
}

