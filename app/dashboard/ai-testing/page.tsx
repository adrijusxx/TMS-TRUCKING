import { Metadata } from 'next';
import AIFeaturesTesting from '@/components/ai/AIFeaturesTesting';

export const metadata: Metadata = {
  title: 'AI Features Testing | TMS',
  description: 'Test and verify AI-powered features',
};

export default function AITestingPage() {
  return <AIFeaturesTesting />;
}



