import SafetyCostAnalytics from '@/components/safety/analytics/SafetyCostAnalytics';

export default function SafetyAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Safety Cost Analytics</h2>
        <p className="text-muted-foreground">
          Track and analyze safety-related costs including incidents, claims, and citations
        </p>
      </div>
      <SafetyCostAnalytics />
    </div>
  );
}
