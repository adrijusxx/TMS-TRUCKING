import { Metadata } from 'next';
import { HelpCenterClient } from './HelpCenterClient';
import { APP_NAME } from '@/lib/config/branding';

export const metadata: Metadata = {
    title: `Help Center | ${APP_NAME}`,
    description: `Learn how to use ${APP_NAME} with comprehensive guides and tutorials`,
};

export default function HelpCenterPage() {
    return <HelpCenterClient />;
}
