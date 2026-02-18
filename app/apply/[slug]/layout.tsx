import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Driver Application',
    description: 'Apply to drive with us',
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            <div className="mx-auto max-w-2xl px-4 py-8 sm:py-16">
                {children}
            </div>
        </div>
    );
}
