import { Metadata } from 'next';
import { HelpCenterClient } from './HelpCenterClient';

export const metadata: Metadata = {
    title: 'Help Center | TMS',
    description: 'Learn how to use the TMS system with comprehensive guides and tutorials',
};

export default function HelpCenterPage() {
    return <HelpCenterClient />;
}
