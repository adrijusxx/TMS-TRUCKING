import ProfitabilityAnalysis from '@/components/analytics/ProfitabilityAnalysis';
import ComprehensiveProfitAnalytics from '@/components/analytics/ComprehensiveProfitAnalytics';
import DeepInsightsContainer from '@/components/analytics/DeepInsightsContainer';
export default function ProfitabilityPage() {
  return (
    <div className="space-y-4">
{/* High-level Financial Overview */}
        <ComprehensiveProfitAnalytics />

        {/* Deep Insights: Cost Analysis + Staffing Recommendations */}
        <DeepInsightsContainer />

        {/* Detailed Customer/Lane Breakdown */}
        <ProfitabilityAnalysis />
      </div>
  );
}
