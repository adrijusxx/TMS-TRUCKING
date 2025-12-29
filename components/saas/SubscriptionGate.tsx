
import { auth } from '@/lib/auth'; // Ensure this path matches the working auth refactor
import { SubscriptionManager } from '@/lib/managers/SubscriptionManager';
import { SubscriptionModule } from '@prisma/client';
import { UpgradePrompt } from './UpgradePrompt';
import { ReactNode } from 'react';

interface SubscriptionGateProps {
    module: SubscriptionModule;
    children: ReactNode;
    fallback?: ReactNode; // Optional custom fallback
}

export async function SubscriptionGate({ module, children, fallback }: SubscriptionGateProps) {
    const session = await auth();

    if (!session?.user?.companyId) {
        return null; // or redirect to login
    }

    // Super Admin bypass
    if (session.user.role === 'SUPER_ADMIN') {
        return <>{children}</>;
    }

    const hasAccess = await SubscriptionManager.hasFeature(session.user.companyId, module);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // "Peek" Overlay Mode
    return (
        <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-lg border border-dashed border-muted-foreground/20">
            {/* Blurred Content - Reduced blur and increased opacity for better "peek" visibility */}
            <div className="absolute inset-0 filter blur-[2px] opacity-60 pointer-events-none select-none overflow-hidden" aria-hidden="true">
                {children}
            </div>

            {/* Lock Overlay - Reduced background opacity to let content shine through more */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[1px]">
                <UpgradePrompt module={module} />
            </div>
        </div>
    );
}
