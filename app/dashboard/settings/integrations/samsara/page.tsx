import { SamsaraSettingsForm } from '@/components/integrations/SamsaraSettingsForm';

export default function SamsaraIntegrationPage() {
    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Samsara Integration</h1>
                <p className="text-muted-foreground mt-2">
                    Connect your fleet to Samsara for real-time tracking, diagnostics, and HOS logs.
                </p>
            </div>

            <SamsaraSettingsForm />
        </div>
    );
}
