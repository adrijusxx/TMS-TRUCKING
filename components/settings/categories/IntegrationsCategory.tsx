'use client';

import IntegrationsSettings from '@/components/settings/IntegrationsSettings';

export default function IntegrationsCategory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect and manage third-party integrations
        </p>
      </div>

      <IntegrationsSettings />
    </div>
  );
}





