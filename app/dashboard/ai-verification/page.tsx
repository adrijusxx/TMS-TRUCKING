import { Metadata } from 'next';
import AIVerificationQueue from '@/components/ai/AIVerificationQueue';

export const metadata: Metadata = {
  title: 'AI Verification Queue | TMS',
  description: 'Review and approve AI suggestions',
};

export default function AIVerificationPage() {
  return <AIVerificationQueue />;
}



