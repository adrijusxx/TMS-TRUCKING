'use client';

import { useState } from 'react';
import { HelpDialog } from '@/components/help/HelpDialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
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
                        'h-14 w-14 rounded-full',
                        'bg-primary text-primary-foreground',
                        'shadow-lg hover:shadow-xl',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'hover:scale-110',
                        className
                    )}
                    aria-label="Open help center"
                >
                    <HelpCircle className="h-6 w-6" />
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
