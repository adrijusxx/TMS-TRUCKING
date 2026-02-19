import NetSapiensSettings from '@/components/settings/integrations/NetSapiensSettings';

export default function NetSapiensIntegrationPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">NetSapiens PBX</h1>
        <p className="text-muted-foreground mt-2">
          Connect your business phone system for click-to-call, call history, SMS, voicemail, and recordings.
        </p>
      </div>

      <NetSapiensSettings />
    </div>
  );
}
