import UnifiedImportWizard from '@/components/import-export/UnifiedImportWizard';

export const metadata = {
    title: 'Import Leads | Recruiting | TMS',
    description: 'Import recruiting leads from CSV or Excel files',
};

export default function CRMImportPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Import Leads</h1>
                <p className="text-muted-foreground">
                    Upload a CSV or Excel file to import recruiting leads in bulk
                </p>
            </div>
            <UnifiedImportWizard entityType="recruiting-leads" mode="fullpage" />
        </div>
    );
}
