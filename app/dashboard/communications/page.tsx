import CommunicationsHub from '@/components/communications/CommunicationsHub';
import { APP_NAME } from '@/lib/config/branding';

export const metadata = {
  title: `Communications | ${APP_NAME}`,
  description: 'Phone, SMS, voicemail, and call history hub',
};

export default function CommunicationsPage() {
  return <CommunicationsHub />;
}
