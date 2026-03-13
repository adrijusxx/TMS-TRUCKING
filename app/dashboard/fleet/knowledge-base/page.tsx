import { Metadata } from 'next';
import KnowledgeBaseManager from '@/components/fleet/KnowledgeBaseManager';
import { APP_NAME } from '@/lib/config/branding';

export const metadata: Metadata = {
    title: `AI Knowledge Base | ${APP_NAME}`,
    description: 'Manage documents for AI context and learning',
};

export default function KnowledgeBasePage() {
    return (
        <div className="p-6">
            <KnowledgeBaseManager />
        </div>
    );
}
