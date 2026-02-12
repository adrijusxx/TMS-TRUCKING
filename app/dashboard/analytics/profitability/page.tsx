import ProfitabilityAnalysis from '@/components/analytics/ProfitabilityAnalysis';
import ComprehensiveProfitAnalytics from '@/components/analytics/ComprehensiveProfitAnalytics';
import DeepInsightsContainer from '@/components/analytics/DeepInsightsContainer';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function ProfitabilityPage() {
  return (
    <>
      <Breadcrumb items={[
        { label: 'Analytics & Reports', href: '/dashboard/analytics' },
        { label: 'Profitability Analysis' }
      ]} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profitability Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Ultra in-depth breakdown of finances, staffing needs, cost optimization, and strategic recommendations.
          </p>
        </div>

        {/* High-level Financial Overview */}
        <ComprehensiveProfitAnalytics />

        {/* Deep Insights: Cost Analysis + Staffing Recommendations */}
        <DeepInsightsContainer />

        {/* Detailed Customer/Lane Breakdown */}
        <ProfitabilityAnalysis />
      </div>
    </>
  );
}
