import { QuickBooksSettingsForm } from '@/components/integrations/QuickBooksSettingsForm';

export default function QuickBooksIntegrationPage() {
    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">QuickBooks Integration</h1>
                <p className="text-muted-foreground mt-2">
                    Sync invoices, payments, and customers with QuickBooks Online.
                </p>
            </div>

            <QuickBooksSettingsForm />
        </div>
    );
}
