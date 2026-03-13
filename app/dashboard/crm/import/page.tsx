import UnifiedImportWizard from '@/components/import-export/UnifiedImportWizard';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
    title: `Import Leads | Recruiting | ${APP_NAME}`,
    description: 'Import recruiting leads from CSV or Excel files',
};

export default function CRMImportPage() {
    return (
        <UnifiedImportWizard entityType="recruiting-leads" mode="fullpage" />
    );
}
