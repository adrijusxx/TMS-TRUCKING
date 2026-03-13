import { Metadata } from 'next';
import AIVerificationQueue from '@/components/ai/AIVerificationQueue';
import { APP_NAME } from '@/lib/config/branding';

export const metadata: Metadata = {
  title: `AI Verification Queue | ${APP_NAME}`,
  description: 'Review and approve AI suggestions',
};

export default function AIVerificationPage() {
  return <AIVerificationQueue />;
}



