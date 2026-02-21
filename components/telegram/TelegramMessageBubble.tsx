'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCheck, Plus, AlertTriangle } from 'lucide-react';
import MessageMedia from './MessageMedia';

interface LinkedCase {
    breakdownNumber: string;
    status: string;
    priority: string;
}

interface MessageBubbleProps {
    msg: {
        id: number;
        text: string;
        date: string | null;
        out: boolean;
        media: any;
    };
    linkedCase?: LinkedCase;
    onCreateCase?: (text: string) => void;
}

export default function TelegramMessageBubble({ msg, linkedCase, onCreateCase }: MessageBubbleProps) {
    return (
        <div className={`group/msg flex ${msg.out ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[70%]">
                <div
                    className={`rounded-lg px-3 py-2 ${msg.out
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                        }`}
                >
                    {msg.media && <MessageMedia media={msg.media} out={msg.out} />}
                    {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.out ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {msg.date && (
                            <span className="text-xs">
                                {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {msg.out && <CheckCheck className="h-3 w-3 text-blue-400" />}
                    </div>
                </div>
                {/* Case badge for messages that created/linked to a breakdown */}
                {linkedCase && (
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-500">
                            Case #{linkedCase.breakdownNumber}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {linkedCase.status}
                        </Badge>
                    </div>
                )}
                {/* Create Case button for inbound messages without a case */}
                {!msg.out && !linkedCase && msg.text && onCreateCase && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity mt-1 px-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => onCreateCase(msg.text)}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Case
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
