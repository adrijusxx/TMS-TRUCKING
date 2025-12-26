import { Metadata } from 'next';
import KnowledgeBaseManager from '@/components/fleet/KnowledgeBaseManager';

export const metadata: Metadata = {
    title: 'AI Knowledge Base | TMS',
    description: 'Manage documents for AI context and learning',
};

export default function KnowledgeBasePage() {
    return (
        <div className="p-6">
            <KnowledgeBaseManager />
        </div>
    );
}
