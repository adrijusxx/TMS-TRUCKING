'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Bot } from 'lucide-react';
import KBDocumentList from './knowledge-base/KBDocumentList';
import AIAgentsTab from './knowledge-base/AIAgentsTab';

export default function KnowledgeBaseManager() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Knowledge Base</h2>
                <p className="text-muted-foreground">
                    Manage AI agents and the knowledge documents they use for responses.
                </p>
            </div>

            <Tabs defaultValue="documents" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="documents" className="gap-2">
                        <FileText className="h-4 w-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="gap-2">
                        <Bot className="h-4 w-4" /> AI Agents
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="documents">
                    <KBDocumentList />
                </TabsContent>
                <TabsContent value="agents">
                    <AIAgentsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
