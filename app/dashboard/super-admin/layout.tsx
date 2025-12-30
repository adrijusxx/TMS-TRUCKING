import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

interface SuperAdminLayoutProps {
    children: ReactNode;
}

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const session = await auth();

    // Only SUPER_ADMIN can access this area
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="flex flex-col h-full">
            {/* Super Admin Header */}
            <div className="bg-gradient-to-r from-status-error-muted/20 to-status-warning-muted/20 border-b border-status-error/30 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-status-error/20 rounded-lg">
                            <svg className="w-5 h-5 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">Super Admin Control Panel</h1>
                            <p className="text-xs text-status-error/80">System-wide administration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-status-error/80">
                        <span className="px-2 py-1 bg-status-error/10 rounded border border-status-error/20">
                            {session.user.email}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
