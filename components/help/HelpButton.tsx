'use client';

import { useState } from 'react';
import { HelpDialog } from '@/components/help/HelpDialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpButtonProps {
    module?: string;
    topic?: string;
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'floating';
}

export function HelpButton({ module, topic, className, variant = 'ghost' }: HelpButtonProps) {
    const [open, setOpen] = useState(false);

    if (variant === 'floating') {
        return (
            <>
                <button
                    onClick={() => setOpen(true)}
                    className={cn(
                        'fixed bottom-6 right-6 z-50',
                        'flex items-center gap-2',
                        'rounded-full px-5 py-3',
                        'bg-primary text-primary-foreground',
                        'shadow-lg hover:shadow-xl',
                        'transition-all duration-200',
                        'hover:scale-105 hover:bg-primary/90',
                        'text-sm font-medium',
                        className
                    )}
                    aria-label="Open help center"
                >
                    <MessageCircleQuestion className="h-5 w-5" />
                    <span className="hidden sm:inline">Need Help?</span>
                </button>
                <HelpDialog open={open} onOpenChange={setOpen} defaultModule={module} defaultTopic={topic} />
            </>
        );
    }

    return (
        <>
            <Button
                variant={variant}
                size="sm"
                onClick={() => setOpen(true)}
                className={cn('gap-2', className)}
            >
                <HelpCircle className="h-4 w-4" />
                Help
            </Button>
            <HelpDialog open={open} onOpenChange={setOpen} defaultModule={module} defaultTopic={topic} />
        </>
    );
}
