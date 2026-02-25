import UnifiedImportWizard from '@/components/import-export/UnifiedImportWizard';
import { getEntityConfig } from '@/lib/import-export/entity-config';
import { notFound } from 'next/navigation';
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
    <UnifiedImportWizard
          entityType={entity}
          mode="fullpage"
        />
  );
}

