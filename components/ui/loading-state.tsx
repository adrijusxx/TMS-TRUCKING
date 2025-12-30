import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import common from '@/lib/content/common.json';

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
    message?: string;
    size?: 'sm' | 'default' | 'lg';
    spinner?: boolean;
}

export function LoadingState({
    message = common.actions.loading,
    size = 'default',
    spinner = true,
    className,
    ...props
}: LoadingStateProps) {

    const sizeClasses = {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 text-muted-foreground animate-in fade-in-50",
                className
            )}
            {...props}
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
        </div>
    );
}
