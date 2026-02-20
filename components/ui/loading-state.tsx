'use client';

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import common from '@/lib/content/common.json';

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'default' | 'lg';
    spinner?: boolean;
    className?: string;
}

export function LoadingState({
    message = common.actions.loading,
    size = 'default',
    spinner = true,
    className,
}: LoadingStateProps) {

    const sizeClasses = {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
                "flex flex-col items-center justify-center p-8 text-muted-foreground",
                className
            )}
        >
            {spinner && (
                <Loader2 className={cn("animate-spin mb-2", sizeClasses[size])} />
            )}
            {message && (
                <p className={cn(
                    "font-medium",
                    size === 'sm' && "text-xs",
                    size === 'default' && "text-sm",
                    size === 'lg' && "text-base"
                )}>
                    {message}
                </p>
            )}
        </motion.div>
    );
}
