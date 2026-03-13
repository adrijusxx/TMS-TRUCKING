import { Metadata } from 'next';
import AIFeaturesTesting from '@/components/ai/AIFeaturesTesting';
import { APP_NAME } from '@/lib/config/branding';

export const metadata: Metadata = {
  title: `AI Features Testing | ${APP_NAME}`,
  description: 'Test and verify AI-powered features',
};

export default function AITestingPage() {
  return <AIFeaturesTesting />;
}



