'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search,
    BookOpen,
    HelpCircle,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { helpModules, getAllTopics } from '@/lib/config/help-articles';

interface HelpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultModule?: string;
    defaultTopic?: string;
}

export function HelpDialog({ open, onOpenChange, defaultModule, defaultTopic }: HelpDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedModule, setSelectedModule] = useState(defaultModule || 'getting-started');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(defaultTopic || null);

    const currentModule = helpModules.find((m) => m.id === selectedModule);

    const filteredTopics = useMemo(() => {
        if (!searchQuery.trim()) return currentModule?.topics ?? [];
        const q = searchQuery.toLowerCase();
        return (currentModule?.topics ?? []).filter(
            (t) =>
                t.title.toLowerCase().includes(q) ||
                t.summary.toLowerCase().includes(q) ||
                t.content.toLowerCase().includes(q)
        );
    }, [searchQuery, currentModule]);

    // Cross-module search results
    const globalResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase();
        return getAllTopics().filter(
            (t) =>
                t.title.toLowerCase().includes(q) ||
                t.summary.toLowerCase().includes(q) ||
                t.content.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const activeTopic = currentModule?.topics.find((t) => t.id === selectedTopic);

    // Simple markdown-to-HTML conversion for article content
    const renderContent = (raw: string) => {
        return raw
            .replace(/\n/g, '<br />')
            .replace(/#### (.*?)(<br \/>)/g, '<h4 class="text-sm font-semibold mt-4 mb-1">$1</h4>')
            .replace(/### (.*?)(<br \/>)/g, '<h3 class="text-base font-semibold mt-5 mb-2">$1</h3>')
            .replace(/## (.*?)(<br \/>)/g, '<h2 class="text-lg font-bold mt-6 mb-3">$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\|(.*)\|/g, (match) => {
                const cells = match.split('|').filter(Boolean).map((c) => c.trim());
                if (cells.every((c) => /^[-:]+$/.test(c))) return '';
                const tag = cells.length > 0 ? 'td' : 'td';
                return `<tr>${cells.map((c) => `<${tag} class="border px-3 py-1.5 text-sm">${c}</${tag}>`).join('')}</tr>`;
            })
            .replace(/(<tr>.*<\/tr>(<br \/>)?)+/g, (match) => {
                const rows = match.replace(/<br \/>/g, '');
                return `<table class="border-collapse w-full my-3">${rows}</table>`;
            })
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg overflow-x-auto text-sm my-3 font-mono"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[1400px] h-[85vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <HelpCircle className="h-5 w-5 text-primary" />
                            TMS Help Center
                        </DialogTitle>
                        <Badge variant="outline" className="text-xs">
                            {helpModules.reduce((sum, m) => sum + m.topics.length, 0)} articles
                        </Badge>
                    </div>
                    <div className="mt-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search all help articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden min-h-0">
                    {/* Sidebar — module list */}
                    <div className="w-56 lg:w-64 border-r bg-muted/30 overflow-y-auto shrink-0">
                        <div className="p-3 space-y-1">
                            {helpModules.map((mod) => {
                                const Icon = mod.icon;
                                const isActive = selectedModule === mod.id;
                                return (
                                    <button
                                        key={mod.id}
                                        onClick={() => {
                                            setSelectedModule(mod.id);
                                            setSelectedTopic(null);
                                            setSearchQuery('');
                                        }}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? '' : mod.color)} />
                                        <div className="min-w-0">
                                            <div className="truncate">{mod.name}</div>
                                            {!isActive && (
                                                <div className="text-xs opacity-60 truncate">{mod.description}</div>
                                            )}
                                        </div>
                                        <Badge
                                            variant={isActive ? 'secondary' : 'outline'}
                                            className="ml-auto text-[10px] h-5 px-1.5 shrink-0"
                                        >
                                            {mod.topics.length}
                                        </Badge>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        {selectedTopic && activeTopic ? (
                            /* Article view */
                            <ScrollArea className="flex-1 p-6">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTopic(null)}
                                    className="mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to {currentModule?.name}
                                </Button>
                                <div className="max-w-3xl">
                                    <h1 className="text-2xl font-bold mb-2">{activeTopic.title}</h1>
                                    <p className="text-muted-foreground mb-6">{activeTopic.summary}</p>
                                    <div
                                        className="prose prose-sm max-w-none dark:prose-invert leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderContent(activeTopic.content) }}
                                    />
                                </div>
                            </ScrollArea>
                        ) : globalResults && searchQuery.trim() ? (
                            /* Global search results */
                            <ScrollArea className="flex-1 p-6">
                                <h2 className="text-xl font-bold mb-1">Search Results</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {globalResults.length} article{globalResults.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                                </p>
                                {globalResults.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p>No articles found. Try different keywords.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {globalResults.map((topic) => (
                                            <button
                                                key={`${topic.moduleId}-${topic.id}`}
                                                onClick={() => {
                                                    setSelectedModule(topic.moduleId);
                                                    setSelectedTopic(topic.id);
                                                }}
                                                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">{topic.title}</span>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {topic.moduleName}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {topic.summary}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        ) : (
                            /* Topic list for selected module */
                            <ScrollArea className="flex-1 p-6">
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold mb-1">{currentModule?.name}</h2>
                                    <p className="text-sm text-muted-foreground">{currentModule?.description}</p>
                                </div>
                                <div className="grid gap-3">
                                    {filteredTopics.map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => setSelectedTopic(topic.id)}
                                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left group"
                                        >
                                            <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <span className="font-medium group-hover:text-primary transition-colors">
                                                    {topic.title}
                                                </span>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {topic.summary}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
