import UnifiedImportWizard from '@/components/import-export/UnifiedImportWizard';

export const metadata = {
    title: 'Import Leads | Recruiting | TMS',
    description: 'Import recruiting leads from CSV or Excel files',
};

export default function CRMImportPage() {
    return (
        <UnifiedImportWizard entityType="recruiting-leads" mode="fullpage" />
    );
}
